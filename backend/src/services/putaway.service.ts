import { supabaseAdmin } from '../config/supabase';

const supabase = supabaseAdmin;

export class PutawayService {
  /**
   * Generate a task number in PUT-YYYYMMDD-NNN format
   */
  async generateTaskNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `PUT-${dateStr}-`;

    const { data } = await supabase
      .from('putaway_tasks')
      .select('task_number')
      .like('task_number', `${prefix}%`)
      .order('task_number', { ascending: false })
      .limit(1);

    let nextNum = 1;
    if (data && data.length > 0) {
      const lastNum = parseInt(data[0].task_number.split('-').pop() || '0', 10);
      nextNum = lastNum + 1;
    }

    return `${prefix}${String(nextNum).padStart(3, '0')}`;
  }

  /**
   * Create putaway tasks for bill items that don't have bin allocations
   */
  async createTasksFromBill(billId: string, createdByUserId?: string): Promise<any[]> {
    // Get bill items
    const { data: billItems, error: billItemsError } = await supabase
      .from('bill_items')
      .select('id, item_id, item_name, quantity, serial_numbers')
      .eq('bill_id', billId);

    if (billItemsError) throw billItemsError;
    if (!billItems || billItems.length === 0) return [];

    // Get existing bin allocations for these bill items
    const billItemIds = billItems.map((bi: any) => bi.id);
    const { data: existingAllocations } = await supabase
      .from('bill_item_bin_allocations')
      .select('bill_item_id, quantity')
      .in('bill_item_id', billItemIds);

    // Calculate allocated quantity per bill item
    const allocatedMap: Record<string, number> = {};
    if (existingAllocations) {
      for (const alloc of existingAllocations) {
        allocatedMap[alloc.bill_item_id] = (allocatedMap[alloc.bill_item_id] || 0) + Number(alloc.quantity);
      }
    }

    // Find unallocated items (or partially allocated)
    const unallocated = billItems.filter((bi: any) => {
      const allocated = allocatedMap[bi.id] || 0;
      return allocated < Number(bi.quantity);
    });

    if (unallocated.length === 0) return [];

    // Get item details (SKU) for unallocated items
    const itemIds = unallocated.filter((bi: any) => bi.item_id).map((bi: any) => bi.item_id);
    let itemMap: Record<string, any> = {};
    if (itemIds.length > 0) {
      const { data: items } = await supabase
        .from('items')
        .select('id, sku, item_name')
        .in('id', itemIds);
      if (items) {
        for (const item of items) {
          itemMap[item.id] = item;
        }
      }
    }

    // Create putaway tasks
    const tasks = [];
    for (const bi of unallocated) {
      const allocated = allocatedMap[bi.id] || 0;
      const remainingQty = Number(bi.quantity) - allocated;
      const item = bi.item_id ? itemMap[bi.item_id] : null;

      // Suggest a bin
      let suggestedBin: any = null;
      if (bi.item_id) {
        try {
          suggestedBin = await this.suggestBin(bi.item_id);
        } catch {
          // No suggestion available
        }
      }

      // Handle serial numbers - create one task per serial if serial tracked
      const serials = bi.serial_numbers || [];
      if (serials.length > 0 && serials.length === remainingQty) {
        // One task per serial number
        for (const serial of serials) {
          const taskNumber = await this.generateTaskNumber();
          tasks.push({
            task_number: taskNumber,
            bill_id: billId,
            bill_item_id: bi.id,
            item_id: bi.item_id,
            item_name: bi.item_name,
            sku: item?.sku || null,
            serial_number: serial,
            quantity: 1,
            placed_quantity: 0,
            suggested_bin_id: suggestedBin?.bin_id || null,
            suggested_bin_code: suggestedBin?.bin_code || null,
            status: 'pending',
            created_by_user_id: createdByUserId || null,
          });
        }
      } else {
        // One task for the full quantity
        const taskNumber = await this.generateTaskNumber();
        tasks.push({
          task_number: taskNumber,
          bill_id: billId,
          bill_item_id: bi.id,
          item_id: bi.item_id,
          item_name: bi.item_name,
          sku: item?.sku || null,
          serial_number: serials.length > 0 ? serials[0] : null,
          quantity: remainingQty,
          placed_quantity: 0,
          suggested_bin_id: suggestedBin?.bin_id || null,
          suggested_bin_code: suggestedBin?.bin_code || null,
          status: 'pending',
          created_by_user_id: createdByUserId || null,
        });
      }
    }

    if (tasks.length === 0) return [];

    const { data: createdTasks, error: createError } = await supabase
      .from('putaway_tasks')
      .insert(tasks)
      .select();

    if (createError) throw createError;
    return createdTasks || [];
  }

  /**
   * Get pending putaway tasks
   */
  async getPendingTasks(userId?: string): Promise<any[]> {
    let query = supabase
      .from('putaway_tasks')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.or(`assigned_to_user_id.eq.${userId},assigned_to_user_id.is.null`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Get in-progress putaway tasks
   */
  async getInProgressTasks(userId?: string): Promise<any[]> {
    let query = supabase
      .from('putaway_tasks')
      .select('*')
      .eq('status', 'in_progress')
      .order('updated_at', { ascending: false });

    if (userId) {
      query = query.eq('assigned_to_user_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Get completed putaway tasks (history)
   */
  async getHistory(limit: number = 20): Promise<any[]> {
    const { data, error } = await supabase
      .from('putaway_tasks')
      .select('*')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get a single putaway task by ID
   */
  async getTaskById(id: string): Promise<any> {
    const { data, error } = await supabase
      .from('putaway_tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Start a putaway task (pending → in_progress)
   */
  async startTask(taskId: string, userId: string, userName?: string): Promise<any> {
    const task = await this.getTaskById(taskId);
    if (!task) throw new Error('Task not found');
    if (task.status !== 'pending') {
      throw new Error(`Cannot start task with status "${task.status}"`);
    }

    const { data, error } = await supabase
      .from('putaway_tasks')
      .update({
        status: 'in_progress',
        assigned_to_user_id: userId,
        assigned_to_name: userName || task.assigned_to_name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Place an item into a bin (the core putaway action)
   */
  async placeItem(
    taskId: string,
    binLocationId: string,
    quantity: number,
    userId: string
  ): Promise<any> {
    const task = await this.getTaskById(taskId);
    if (!task) throw new Error('Task not found');
    if (task.status !== 'in_progress') {
      throw new Error(`Cannot place item for task with status "${task.status}"`);
    }

    const remaining = Number(task.quantity) - Number(task.placed_quantity);
    if (quantity > remaining) {
      throw new Error(`Cannot place ${quantity} units. Only ${remaining} remaining.`);
    }

    // Get bin location info
    const { data: bin } = await supabase
      .from('bin_locations')
      .select('id, bin_code')
      .eq('id', binLocationId)
      .single();

    if (!bin) throw new Error('Bin location not found');

    // Create the bill_item_bin_allocation (this is the actual stock placement)
    if (task.bill_item_id) {
      const allocationData: any = {
        bill_item_id: task.bill_item_id,
        bin_location_id: binLocationId,
        quantity: quantity,
      };

      // Add serial number if present
      if (task.serial_number) {
        allocationData.serial_numbers = [task.serial_number];
      }

      const { error: allocError } = await supabase
        .from('bill_item_bin_allocations')
        .insert(allocationData);

      if (allocError) throw allocError;
    }

    // Update putaway task
    const newPlacedQty = Number(task.placed_quantity) + quantity;
    const isComplete = newPlacedQty >= Number(task.quantity);

    const updateData: any = {
      placed_quantity: newPlacedQty,
      actual_bin_id: binLocationId,
      actual_bin_code: bin.bin_code,
      updated_at: new Date().toISOString(),
    };

    if (isComplete) {
      updateData.status = 'completed';
      updateData.completed_at = new Date().toISOString();
      updateData.completed_by_user_id = userId;
    }

    const { data: updatedTask, error: updateError } = await supabase
      .from('putaway_tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (updateError) throw updateError;
    return updatedTask;
  }

  /**
   * Suggest a bin for an item based on existing placements
   */
  async suggestBin(itemId: string): Promise<{ bin_id: string; bin_code: string; reason: string } | null> {
    // Check where this item already exists (co-location strategy)
    const { data: existingAllocations } = await supabase
      .from('bill_item_bin_allocations')
      .select('bin_location_id, quantity, bill_items!inner(item_id)')
      .eq('bill_items.item_id', itemId);

    if (existingAllocations && existingAllocations.length > 0) {
      // Aggregate quantity per bin
      const binQty: Record<string, number> = {};
      for (const alloc of existingAllocations) {
        const binId = alloc.bin_location_id;
        binQty[binId] = (binQty[binId] || 0) + Number(alloc.quantity);
      }

      // Find the bin with the most of this item
      const topBinId = Object.entries(binQty).sort(([, a], [, b]) => b - a)[0][0];

      const { data: bin } = await supabase
        .from('bin_locations')
        .select('id, bin_code')
        .eq('id', topBinId)
        .eq('status', 'active')
        .single();

      if (bin) {
        return { bin_id: bin.id, bin_code: bin.bin_code, reason: 'Same item in this bin' };
      }
    }

    // Fallback: suggest any active bin
    const { data: bins } = await supabase
      .from('bin_locations')
      .select('id, bin_code')
      .eq('status', 'active')
      .order('bin_code', { ascending: true })
      .limit(1);

    if (bins && bins.length > 0) {
      return { bin_id: bins[0].id, bin_code: bins[0].bin_code, reason: 'Available bin' };
    }

    return null;
  }

  /**
   * Get stats for the mobile dashboard
   */
  async getStats(userId?: string): Promise<any> {
    // Pending count
    let pendingQuery = supabase
      .from('putaway_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');
    if (userId) {
      pendingQuery = pendingQuery.or(`assigned_to_user_id.eq.${userId},assigned_to_user_id.is.null`);
    }
    const { count: pendingCount } = await pendingQuery;

    // In-progress count
    let progressQuery = supabase
      .from('putaway_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'in_progress');
    if (userId) {
      progressQuery = progressQuery.eq('assigned_to_user_id', userId);
    }
    const { count: inProgressCount } = await progressQuery;

    // Completed today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count: completedToday } = await supabase
      .from('putaway_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('completed_at', todayStart.toISOString());

    return {
      pending_count: pendingCount || 0,
      in_progress_count: inProgressCount || 0,
      completed_today: completedToday || 0,
      queued_offline: 0,
    };
  }

  /**
   * Get admin dashboard stats
   */
  async getAdminStats(): Promise<any> {
    // Total active bins
    const { count: totalBins } = await supabase
      .from('bin_locations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');

    // Total active items
    const { count: totalItems } = await supabase
      .from('items')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    // Total capacity (sum of bin capacities)
    const { data: capacityData } = await supabase
      .from('bin_locations')
      .select('capacity')
      .eq('status', 'active')
      .not('capacity', 'is', null);

    const totalCapacity = capacityData
      ? capacityData.reduce((sum: number, bin: any) => sum + (Number(bin.capacity) || 0), 0)
      : 0;

    // Bins with stock (for utilization)
    // Count bins that have any bill_item_bin_allocations
    const { data: occupiedBins } = await supabase
      .from('bill_item_bin_allocations')
      .select('bin_location_id')
      .gt('quantity', 0);

    const uniqueOccupiedBins = occupiedBins
      ? new Set(occupiedBins.map((a: any) => a.bin_location_id)).size
      : 0;

    const utilizationPct = (totalBins || 0) > 0
      ? Math.round((uniqueOccupiedBins / (totalBins || 1)) * 100)
      : 0;

    // Pending placements
    const { count: pendingPlacements } = await supabase
      .from('putaway_tasks')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'in_progress']);

    // Pending stock counts
    const { count: pendingStockCounts } = await supabase
      .from('stock_counts')
      .select('id', { count: 'exact', head: true })
      .in('status', ['draft', 'in_progress']);

    return {
      total_bins: totalBins || 0,
      total_items: totalItems || 0,
      utilization_pct: utilizationPct,
      total_capacity: totalCapacity,
      pending_placements: pendingPlacements || 0,
      pending_stock_counts: pendingStockCounts || 0,
    };
  }
}

export default new PutawayService();
