import { supabaseAdmin as supabase } from '../config/supabase';
import { BinLocationsService } from './binLocations.service';

export interface CreateStockCountData {
  bill_id?: string;
  location_id?: string;
  location_name: string;
  bin_location_id?: string;
  bin_code?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  assigned_by?: string;
  assigned_by_name?: string;
  count_type?: 'delivery' | 'audit';
  due_date?: string;
  notes?: string;
  auto_generated?: boolean;
}

export interface UpdateItemCountData {
  counted_quantity: number;
  notes?: string;
}

export class StockCountsService {
  /**
   * Generate a new count number
   */
  async generateCountNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const { data: latest } = await supabase
      .from('stock_counts')
      .select('count_number')
      .ilike('count_number', `SC-${year}-%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!latest) {
      return `SC-${year}-0001`;
    }

    const match = latest.count_number.match(/SC-\d{4}-(\d+)/);
    if (match) {
      const nextNumber = parseInt(match[1]) + 1;
      return `SC-${year}-${nextNumber.toString().padStart(4, '0')}`;
    }

    return `SC-${year}-0001`;
  }

  /**
   * Get all stock counts with optional filters
   */
  async getStockCounts(filters?: {
    assigned_to?: string;
    status?: string;
    count_type?: string;
  }) {
    let query = supabase
      .from('stock_counts')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.count_type) {
      query = query.eq('count_type', filters.count_type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /**
   * Get a single stock count with items
   */
  async getStockCount(id: string) {
    const { data: count, error: countError } = await supabase
      .from('stock_counts')
      .select('*')
      .eq('id', id)
      .single();

    if (countError) throw countError;

    const { data: items, error: itemsError } = await supabase
      .from('stock_count_items')
      .select('*')
      .eq('stock_count_id', id)
      .order('item_name');

    if (itemsError) throw itemsError;

    return { ...count, items };
  }

  /**
   * Create a new stock count from a bill or bin
   */
  async createStockCount(data: CreateStockCountData) {
    const countNumber = await this.generateCountNumber();

    // If bin_location_id is provided but location_name is not, look up the bin details
    let locationName = data.location_name;
    let binCode = data.bin_code;
    let locationId = data.location_id;

    if (data.bin_location_id && !locationName) {
      const { data: bin } = await supabase
        .from('bin_locations')
        .select('bin_code, location_id, locations(name)')
        .eq('id', data.bin_location_id)
        .single();

      if (bin) {
        binCode = bin.bin_code;
        locationId = bin.location_id;
        locationName = (bin as any).locations?.name || bin.bin_code || 'Unknown';
      }
    }

    // If assigned_to is provided but assigned_to_name is not, look up the user
    let assignedToName = data.assigned_to_name;
    if (data.assigned_to && !assignedToName) {
      const { data: mobileUser } = await supabase
        .from('mobile_users')
        .select('employee_name')
        .eq('id', data.assigned_to)
        .single();

      if (mobileUser) {
        assignedToName = mobileUser.employee_name;
      }
    }

    // Create the stock count
    const { data: count, error: countError } = await supabase
      .from('stock_counts')
      .insert({
        count_number: countNumber,
        bill_id: data.bill_id || null,
        location_id: locationId || null,
        location_name: locationName || 'Unknown',
        bin_location_id: data.bin_location_id || null,
        bin_code: binCode || null,
        assigned_to: data.assigned_to || null,
        assigned_to_name: assignedToName || null,
        assigned_by: data.assigned_by || null,
        assigned_by_name: data.assigned_by_name || null,
        count_type: data.count_type || 'audit',
        due_date: data.due_date || null,
        notes: data.notes || null,
        status: 'pending',
        auto_generated: data.auto_generated || false,
      })
      .select()
      .single();

    if (countError) throw countError;

    // If bin_location_id is provided (without bill_id), load items from bin stock
    // Uses getBinLocationsWithStock() which calculates NET stock (purchases - sales +/- transfers)
    if (data.bin_location_id && !data.bill_id) {
      const binLocationsService = new BinLocationsService();
      const allBinsWithStock = await binLocationsService.getBinLocationsWithStock();
      const targetBin = allBinsWithStock.find((b: any) => b.id === data.bin_location_id);

      if (targetBin && targetBin.items && targetBin.items.length > 0) {
        // Get item details (sku, advanced_tracking_type) for all items in this bin
        const itemIds = targetBin.items.map((i: any) => i.item_id).filter(Boolean);
        let itemDetailsMap: Record<string, any> = {};
        if (itemIds.length > 0) {
          const { data: itemDetails } = await supabase
            .from('items')
            .select('id, sku, advanced_tracking_type')
            .in('id', itemIds);
          if (itemDetails) {
            itemDetails.forEach((item: any) => { itemDetailsMap[item.id] = item; });
          }
        }

        const countItems: any[] = [];

        for (const binItem of targetBin.items) {
          if (!binItem.item_id) continue;
          const itemInfo = itemDetailsMap[binItem.item_id] || {};
          const netQuantity = Math.round(binItem.quantity * 100) / 100; // Round to avoid floating point issues

          if (netQuantity <= 0) continue; // Skip items with zero or negative net stock

          // All items (including serial-tracked): single row with net quantity
          // Serial barcodes (e.g. SKU-0032/1) are matched to the parent item by SKU
          countItems.push({
            stock_count_id: count.id,
            item_id: binItem.item_id,
            item_name: binItem.item_name,
            sku: itemInfo.sku || '',
            serial_number: null,
            expected_quantity: netQuantity,
            status: 'pending',
          });
        }

        if (countItems.length > 0) {
          const { error: itemsError } = await supabase
            .from('stock_count_items')
            .insert(countItems);

          if (itemsError) throw itemsError;

          await supabase
            .from('stock_counts')
            .update({ total_items: countItems.length })
            .eq('id', count.id);
        }
      }
    }

    // If bill_id is provided, load items from the bill
    if (data.bill_id) {
      const { data: billItems, error: billError } = await supabase
        .from('bill_items')
        .select('id, item_id, item_name, quantity')
        .eq('bill_id', data.bill_id);

      if (billError) throw billError;

      if (billItems && billItems.length > 0) {
        // Get item details (sku) for each bill item
        const itemIds = billItems.filter(bi => bi.item_id).map(bi => bi.item_id);
        let itemDetails: any[] = [];
        if (itemIds.length > 0) {
          const { data: items } = await supabase
            .from('items')
            .select('id, sku')
            .in('id', itemIds);
          itemDetails = items || [];
        }

        const countItems = billItems.map(bi => {
          const itemDetail = itemDetails.find(i => i.id === bi.item_id);
          return {
            stock_count_id: count.id,
            item_id: bi.item_id || null,
            item_name: bi.item_name,
            sku: itemDetail?.sku || null,
            bill_item_id: bi.id,
            expected_quantity: bi.quantity,
            status: 'pending',
          };
        });

        const { error: itemsError } = await supabase
          .from('stock_count_items')
          .insert(countItems);

        if (itemsError) throw itemsError;

        // Update total_items
        await supabase
          .from('stock_counts')
          .update({ total_items: countItems.length })
          .eq('id', count.id);
      }

      // Also get the bill number
      const { data: bill } = await supabase
        .from('bills')
        .select('bill_number')
        .eq('id', data.bill_id)
        .single();

      if (bill) {
        await supabase
          .from('stock_counts')
          .update({ bill_number: bill.bill_number })
          .eq('id', count.id);
      }
    }

    return this.getStockCount(count.id);
  }

  /**
   * Start a count (counter begins counting)
   */
  async startCount(id: string) {
    const { data, error } = await supabase
      .from('stock_counts')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update an item's counted quantity
   */
  async updateItemCount(countId: string, itemId: string, data: UpdateItemCountData) {
    // First verify the item belongs to this count
    const { data: item, error: fetchError } = await supabase
      .from('stock_count_items')
      .select('expected_quantity')
      .eq('id', itemId)
      .eq('stock_count_id', countId)
      .single();

    if (fetchError) throw fetchError;
    if (!item) throw new Error('Item not found in this count');

    // Determine status based on match
    const status = data.counted_quantity === item.expected_quantity ? 'counted' : 'mismatch';

    const { data: updated, error } = await supabase
      .from('stock_count_items')
      .update({
        counted_quantity: data.counted_quantity,
        status,
        counted_at: new Date().toISOString(),
        notes: data.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .eq('stock_count_id', countId)
      .select()
      .single();

    if (error) throw error;
    return updated;
  }

  /**
   * Submit count for admin review
   */
  async submitCount(id: string) {
    const { data, error } = await supabase
      .from('stock_counts')
      .update({
        status: 'submitted',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Approve a count (admin action)
   */
  async approveCount(id: string, reviewedBy: string, reviewedByName: string, reviewNotes?: string) {
    const { data, error } = await supabase
      .from('stock_counts')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewedBy,
        reviewed_by_name: reviewedByName,
        review_notes: reviewNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Reject a count (admin action)
   */
  async rejectCount(id: string, reviewedBy: string, reviewedByName: string, reviewNotes?: string) {
    const { data, error } = await supabase
      .from('stock_counts')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewedBy,
        reviewed_by_name: reviewedByName,
        review_notes: reviewNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Request a recount (admin action)
   */
  async requestRecount(id: string, reviewedBy: string, reviewedByName: string, reviewNotes?: string) {
    // Reset the count to in_progress and clear counted quantities
    const { error: itemsError } = await supabase
      .from('stock_count_items')
      .update({
        counted_quantity: null,
        status: 'pending',
        counted_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('stock_count_id', id);

    if (itemsError) throw itemsError;

    const { data, error } = await supabase
      .from('stock_counts')
      .update({
        status: 'recount',
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewedBy,
        reviewed_by_name: reviewedByName,
        review_notes: reviewNotes || null,
        completed_at: null,
        counted_items: 0,
        matched_items: 0,
        mismatched_items: 0,
        accuracy_percentage: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get dashboard stats for admin
   */
  async getStats() {
    // Get counts by status
    const { data: counts } = await supabase
      .from('stock_counts')
      .select('status, accuracy_percentage');

    const stats = {
      total: counts?.length || 0,
      pending: counts?.filter(c => c.status === 'pending').length || 0,
      in_progress: counts?.filter(c => c.status === 'in_progress').length || 0,
      submitted: counts?.filter(c => c.status === 'submitted').length || 0,
      approved: counts?.filter(c => c.status === 'approved').length || 0,
      rejected: counts?.filter(c => c.status === 'rejected').length || 0,
      recount: counts?.filter(c => c.status === 'recount').length || 0,
      avg_accuracy: 0,
    };

    // Calculate average accuracy for completed counts
    const completedCounts = counts?.filter(c =>
      ['submitted', 'approved', 'rejected'].includes(c.status) &&
      c.accuracy_percentage != null
    ) || [];

    if (completedCounts.length > 0) {
      const totalAccuracy = completedCounts.reduce((sum, c) => sum + (c.accuracy_percentage || 0), 0);
      stats.avg_accuracy = Math.round((totalAccuracy / completedCounts.length) * 100) / 100;
    }

    return stats;
  }

  /**
   * Get counter performance stats
   */
  async getCounterStats(mobileUserId: string) {
    const { data: counts } = await supabase
      .from('stock_counts')
      .select('status, accuracy_percentage')
      .eq('assigned_to', mobileUserId);

    const completed = counts?.filter(c => ['approved', 'rejected'].includes(c.status)) || [];
    const avgAccuracy = completed.length > 0
      ? completed.reduce((sum, c) => sum + (c.accuracy_percentage || 0), 0) / completed.length
      : 0;

    return {
      total_counts: counts?.length || 0,
      completed_counts: completed.length,
      pending_counts: counts?.filter(c => ['pending', 'in_progress', 'recount'].includes(c.status)).length || 0,
      submitted_counts: counts?.filter(c => c.status === 'submitted').length || 0,
      avg_accuracy: Math.round(avgAccuracy * 100) / 100,
    };
  }

  /**
   * Get available (unclaimed) auto-generated counts for today
   */
  async getAvailableToday() {
    // Use IST date
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset + now.getTimezoneOffset() * 60 * 1000);
    const todayStr = istDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('stock_counts')
      .select('*')
      .eq('due_date', todayStr)
      .is('assigned_to', null)
      .eq('status', 'pending')
      .eq('auto_generated', true)
      .order('location_name')
      .order('bin_code');

    if (error) throw error;
    return data || [];
  }

  /**
   * Claim an unassigned count (counter picks a bin)
   */
  async claimCount(countId: string, userId: string, userName: string) {
    // Check the count exists and is unclaimed
    const { data: count, error: fetchError } = await supabase
      .from('stock_counts')
      .select('id, status, assigned_to')
      .eq('id', countId)
      .single();

    if (fetchError) throw fetchError;
    if (!count) throw new Error('Count not found');

    if (count.assigned_to) {
      throw new Error('This bin is already claimed by another counter');
    }

    if (count.status !== 'pending') {
      throw new Error('This count is no longer available');
    }

    // Claim it: assign to user and start
    const { data: updated, error } = await supabase
      .from('stock_counts')
      .update({
        assigned_to: userId,
        assigned_to_name: userName,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', countId)
      .is('assigned_to', null) // Double-check still unclaimed (race condition guard)
      .select()
      .single();

    if (error) throw error;
    if (!updated) throw new Error('This bin was already claimed by another counter');

    return this.getStockCount(countId);
  }
}
