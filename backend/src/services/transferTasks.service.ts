import { supabaseAdmin as supabase } from '../config/supabase';

export const transferTasksService = {
  async getAll(filters?: { status?: string; assigned_to?: string }) {
    let query = supabase
      .from('transfer_tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching transfer tasks:', error);
      throw error;
    }
    return data || [];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('transfer_tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching transfer task:', error);
      throw error;
    }
    return data;
  },

  async create(taskData: {
    transfer_order_id?: string;
    transfer_number?: string;
    item_id?: string;
    item_name: string;
    sku?: string;
    serial_number?: string;
    colour?: string;
    colour_hex?: string;
    size?: string;
    variant?: string;
    source_bin_id?: string;
    source_bin_code?: string;
    source_location?: string;
    dest_bin_id?: string;
    dest_bin_code?: string;
    dest_location?: string;
    urgency?: string;
    reason?: string;
    assigned_to?: string;
    assigned_to_name?: string;
  }) {
    // Generate transfer number
    const transferNumber = taskData.transfer_number || await this.generateTransferNumber();

    const { data, error } = await supabase
      .from('transfer_tasks')
      .insert({
        ...taskData,
        transfer_number: transferNumber,
        status: 'pending',
        current_step: 0,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating transfer task:', error);
      throw error;
    }
    return data;
  },

  async update(id: string, updates: {
    status?: string;
    current_step?: number;
  }) {
    const updateData: any = { ...updates };

    if (updates.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('transfer_tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating transfer task:', error);
      throw error;
    }
    return data;
  },

  async generateTransferNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('transfer_tasks')
      .select('id', { count: 'exact', head: true });

    const num = (count || 0) + 1;
    return `TT-${year}-${String(num).padStart(4, '0')}`;
  },

  // Create transfer tasks from a transfer order
  async createFromTransferOrder(transferOrderId: string) {
    // Get transfer order with items
    const { data: order, error: orderError } = await supabase
      .from('transfer_orders')
      .select('*, transfer_order_items(*)')
      .eq('id', transferOrderId)
      .single();

    if (orderError || !order) {
      console.error('Error fetching transfer order:', orderError);
      throw orderError || new Error('Transfer order not found');
    }

    const items = order.transfer_order_items || [];
    if (items.length === 0) return [];

    // Get allocations to know source/dest bins
    const { data: allocations } = await supabase
      .from('transfer_order_allocations')
      .select(`
        *,
        source_bin:source_bin_location_id (id, bin_code),
        dest_bin:destination_bin_location_id (id, bin_code)
      `)
      .eq('transfer_order_id', transferOrderId);

    const tasks = items.map((item: any) => {
      const alloc = allocations?.find((a: any) => a.item_id === item.item_id);
      return {
        transfer_order_id: transferOrderId,
        transfer_number: order.transfer_order_number,
        item_id: item.item_id,
        item_name: item.item_name,
        sku: '',
        source_bin_id: alloc?.source_bin_location_id,
        source_bin_code: alloc?.source_bin?.bin_code || '',
        source_location: order.source_location,
        dest_bin_id: alloc?.destination_bin_location_id,
        dest_bin_code: alloc?.dest_bin?.bin_code || '',
        dest_location: order.destination_location,
        status: 'in_progress',
        urgency: 'normal',
        current_step: 0,
        created_at: new Date().toISOString(),
      };
    });

    const { data, error } = await supabase
      .from('transfer_tasks')
      .insert(tasks)
      .select();

    if (error) {
      console.error('Error creating transfer tasks:', error);
      throw error;
    }
    return data;
  },
};

export default transferTasksService;
