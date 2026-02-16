import { supabaseAdmin as supabase } from '../config/supabase';

export const placementTasksService = {
  async getAll(filters?: { status?: string }) {
    let query = supabase
      .from('placement_tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching placement tasks:', error);
      throw error;
    }
    return data || [];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('placement_tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching placement task:', error);
      throw error;
    }
    return data;
  },

  async create(taskData: {
    item_id?: string;
    item_name: string;
    sku?: string;
    serial_number?: string;
    colour?: string;
    colour_hex?: string;
    size?: string;
    variant?: string;
    category?: string;
    source_po?: string;
    suggested_bin_id?: string;
    suggested_bin_code?: string;
    suggested_bin_reason?: string;
  }) {
    const { data, error } = await supabase
      .from('placement_tasks')
      .insert({
        ...taskData,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating placement task:', error);
      throw error;
    }
    return data;
  },

  async update(id: string, updates: {
    status?: string;
    placed_bin_id?: string;
    placed_bin_code?: string;
    placed_by?: string;
    placed_by_name?: string;
  }) {
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (updates.status === 'placed') {
      updateData.placed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('placement_tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating placement task:', error);
      throw error;
    }
    return data;
  },

  // Create placement tasks from a bill (when items are received)
  async createFromBill(billId: string, billNumber: string) {
    // Get bill items
    const { data: billItems, error: billError } = await supabase
      .from('bill_items')
      .select(`
        id, item_id, quantity,
        items:item_id (id, item_name, sku, color, size, variant)
      `)
      .eq('bill_id', billId);

    if (billError) {
      console.error('Error fetching bill items:', billError);
      throw billError;
    }

    if (!billItems || billItems.length === 0) return [];

    // Get suggested bins (use existing allocations as suggestion)
    const tasks = billItems.map((bi: any) => ({
      item_id: bi.item_id,
      item_name: bi.items?.item_name || 'Unknown',
      sku: bi.items?.sku || '',
      colour: bi.items?.color || '',
      size: bi.items?.size || '',
      variant: bi.items?.variant || '',
      source_po: billNumber,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('placement_tasks')
      .insert(tasks)
      .select();

    if (error) {
      console.error('Error creating placement tasks from bill:', error);
      throw error;
    }
    return data;
  },
};

export default placementTasksService;
