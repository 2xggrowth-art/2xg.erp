import { supabaseAdmin } from '../config/supabase';

export class StockCountsService {
  /**
   * Generate next stock count number (SC-00001, SC-00002, etc.)
   */
  async generateNumber(): Promise<string> {
    const { data, error } = await supabaseAdmin
      .from('stock_counts')
      .select('stock_count_number')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    let nextNum = 1;
    if (data && data.length > 0) {
      const match = data[0].stock_count_number.match(/^SC-(\d+)$/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }

    return `SC-${nextNum.toString().padStart(5, '0')}`;
  }

  /**
   * List stock counts with optional filters
   */
  async getAll(filters?: { status?: string; location_id?: string; assigned_to?: string }) {
    let query = supabaseAdmin
      .from('stock_counts')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.location_id) {
      query = query.eq('location_id', filters.location_id);
    }
    if (filters?.assigned_to) {
      query = query.eq('assigned_to_user_id', filters.assigned_to);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /**
   * Get a single stock count with its items
   */
  async getById(id: string) {
    const { data: stockCount, error } = await supabaseAdmin
      .from('stock_counts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    const { data: items, error: itemsError } = await supabaseAdmin
      .from('stock_count_items')
      .select('*')
      .eq('stock_count_id', id)
      .order('created_at', { ascending: true });

    if (itemsError) throw itemsError;

    return { ...stockCount, items: items || [] };
  }

  /**
   * Get stock counts assigned to a specific user (for mobile)
   */
  async getAssigned(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('stock_counts')
      .select('*')
      .eq('assigned_to_user_id', userId)
      .in('status', ['draft', 'in_progress'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Create a new stock count with items.
   * Snapshots current_stock as expected_quantity for each item.
   */
  async create(data: {
    description?: string;
    location_id?: string;
    location_name?: string;
    assigned_to_user_id?: string;
    assigned_to_name?: string;
    notes?: string;
    created_by_user_id?: string;
    items: Array<{
      item_id: string;
      bin_location_id?: string;
      bin_code?: string;
      expected_quantity?: number;
    }>;
  }) {
    const stockCountNumber = await this.generateNumber();

    // Create the stock count header
    const { data: stockCount, error } = await supabaseAdmin
      .from('stock_counts')
      .insert({
        stock_count_number: stockCountNumber,
        description: data.description || null,
        location_id: data.location_id || null,
        location_name: data.location_name || null,
        assigned_to_user_id: data.assigned_to_user_id || null,
        assigned_to_name: data.assigned_to_name || null,
        status: 'draft',
        notes: data.notes || null,
        created_by_user_id: data.created_by_user_id || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Snapshot current stock for each item
    if (data.items && data.items.length > 0) {
      const itemIds = data.items.map(i => i.item_id);
      const { data: itemRecords, error: itemsError } = await supabaseAdmin
        .from('items')
        .select('id, item_name, sku, current_stock')
        .in('id', itemIds);

      if (itemsError) throw itemsError;

      const itemMap = new Map(itemRecords?.map(r => [r.id, r]) || []);

      const countItems = data.items.map(item => {
        const record = itemMap.get(item.item_id);
        return {
          stock_count_id: stockCount.id,
          item_id: item.item_id,
          item_name: record?.item_name || '',
          sku: record?.sku || '',
          bin_location_id: item.bin_location_id || null,
          bin_code: item.bin_code || null,
          expected_quantity: item.expected_quantity != null ? item.expected_quantity : (record?.current_stock || 0),
          counted_quantity: null,
          variance: null,
        };
      });

      const { error: insertError } = await supabaseAdmin
        .from('stock_count_items')
        .insert(countItems);

      if (insertError) throw insertError;
    }

    return this.getById(stockCount.id);
  }

  /**
   * Update a stock count (draft only)
   */
  async update(id: string, data: {
    description?: string;
    location_id?: string;
    location_name?: string;
    assigned_to_user_id?: string;
    assigned_to_name?: string;
    notes?: string;
  }) {
    // Verify still in draft
    const existing = await this.getById(id);
    if (existing.status !== 'draft') {
      throw new Error('Can only edit stock counts in draft status');
    }

    const updateData: any = {};
    if (data.description !== undefined) updateData.description = data.description;
    if (data.location_id !== undefined) updateData.location_id = data.location_id || null;
    if (data.location_name !== undefined) updateData.location_name = data.location_name || null;
    if (data.assigned_to_user_id !== undefined) updateData.assigned_to_user_id = data.assigned_to_user_id || null;
    if (data.assigned_to_name !== undefined) updateData.assigned_to_name = data.assigned_to_name || null;
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    updateData.updated_at = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from('stock_counts')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    return this.getById(id);
  }

  /**
   * Delete a stock count (draft only)
   */
  async delete(id: string) {
    const existing = await this.getById(id);
    if (existing.status !== 'draft') {
      throw new Error('Can only delete stock counts in draft status');
    }

    const { error } = await supabaseAdmin
      .from('stock_counts')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  }

  /**
   * Update counted quantities (from mobile)
   */
  async updateCountedQuantities(id: string, items: Array<{
    id: string;
    counted_quantity: number;
    notes?: string;
  }>) {
    for (const item of items) {
      const variance = item.counted_quantity !== null && item.counted_quantity !== undefined
        ? item.counted_quantity - 0 // Will recalculate below
        : null;

      // Get expected quantity to calculate variance
      const { data: existing } = await supabaseAdmin
        .from('stock_count_items')
        .select('expected_quantity')
        .eq('id', item.id)
        .single();

      const expectedQty = existing?.expected_quantity || 0;
      const calculatedVariance = item.counted_quantity !== null && item.counted_quantity !== undefined
        ? item.counted_quantity - expectedQty
        : null;

      const { error } = await supabaseAdmin
        .from('stock_count_items')
        .update({
          counted_quantity: item.counted_quantity,
          variance: calculatedVariance,
          notes: item.notes || null,
        })
        .eq('id', item.id);

      if (error) throw error;
    }

    return this.getById(id);
  }

  /**
   * Create a completed stock count from a bin scan session
   */
  async createFromBinScan(data: {
    bin_location_id: string;
    bin_code: string;
    location_id?: string;
    location_name?: string;
    scanned_by_user_id?: string;
    scanned_by_name?: string;
    items: Array<{
      item_id: string;
      item_name: string;
      sku: string;
      expected_quantity: number;
      counted_quantity: number;
    }>;
  }) {
    const stockCountNumber = await this.generateNumber();

    const { data: stockCount, error } = await supabaseAdmin
      .from('stock_counts')
      .insert({
        stock_count_number: stockCountNumber,
        description: `Bin scan: ${data.bin_code}`,
        location_id: data.location_id || null,
        location_name: data.location_name || null,
        assigned_to_user_id: data.scanned_by_user_id || null,
        assigned_to_name: data.scanned_by_name || null,
        status: 'completed',
        notes: null,
        created_by_user_id: data.scanned_by_user_id || null,
      })
      .select()
      .single();

    if (error) throw error;

    if (data.items && data.items.length > 0) {
      const countItems = data.items.map(item => ({
        stock_count_id: stockCount.id,
        item_id: item.item_id,
        item_name: item.item_name,
        sku: item.sku,
        bin_location_id: data.bin_location_id,
        bin_code: data.bin_code,
        expected_quantity: item.expected_quantity,
        counted_quantity: item.counted_quantity,
        variance: item.counted_quantity - item.expected_quantity,
      }));

      const { error: insertError } = await supabaseAdmin
        .from('stock_count_items')
        .insert(countItems);

      if (insertError) throw insertError;
    }

    return this.getById(stockCount.id);
  }

  /**
   * Update stock count status with workflow logic
   */
  async updateStatus(id: string, status: string, userId?: string, notes?: string) {
    const existing = await this.getById(id);
    const currentStatus = existing.status;

    // Validate transition
    const validTransitions: Record<string, string[]> = {
      'draft': ['in_progress'],
      'in_progress': ['submitted'],
      'submitted': ['approved', 'rejected'],
      'rejected': ['in_progress'],
    };

    if (!validTransitions[currentStatus]?.includes(status)) {
      throw new Error(`Cannot transition from '${currentStatus}' to '${status}'`);
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (status === 'approved') {
      updateData.approved_by_user_id = userId || null;
      updateData.approved_at = new Date().toISOString();

      // Adjust items.current_stock to match counted quantities
      for (const item of existing.items) {
        if (item.counted_quantity !== null && item.counted_quantity !== undefined) {
          const { error: stockError } = await supabaseAdmin
            .from('items')
            .update({ current_stock: item.counted_quantity })
            .eq('id', item.item_id);

          if (stockError) {
            console.error(`Failed to adjust stock for item ${item.item_id}:`, stockError);
          }
        }
      }
    }

    if (status === 'rejected') {
      // Clear counted quantities so counter can re-count
      for (const item of existing.items) {
        await supabaseAdmin
          .from('stock_count_items')
          .update({ counted_quantity: null, variance: null })
          .eq('id', item.id);
      }
    }

    const { error } = await supabaseAdmin
      .from('stock_counts')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    return this.getById(id);
  }
}
