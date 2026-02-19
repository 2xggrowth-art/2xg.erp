import { supabaseAdmin as supabase } from '../config/supabase';

interface CreateExchangeInput {
  item_name: string;
  condition: 'good' | 'ok' | 'bad';
  invoice_reference?: string;
  customer_name?: string;
  estimated_price?: number;
  photo_base64?: string;
  received_by?: string;
  received_by_name?: string;
  notes?: string;
}

export const exchangesService = {
  // Find or create the global EXCHANGE bin
  async ensureExchangeBin(): Promise<{ id: string; bin_code: string }> {
    const { data: existing, error: findError } = await supabase
      .from('bin_locations')
      .select('id, bin_code')
      .eq('bin_code', 'EXCHANGE')
      .single();

    if (existing) return existing;

    // PGRST116 = no rows found — need to create
    if (findError && findError.code !== 'PGRST116') throw findError;

    // Get first active location to assign the bin to
    const { data: locations } = await supabase
      .from('locations')
      .select('id')
      .eq('status', 'active')
      .limit(1);

    if (!locations || locations.length === 0) {
      throw new Error('No active locations found. Create a location first.');
    }

    const { data: newBin, error: createError } = await supabase
      .from('bin_locations')
      .insert({
        bin_code: 'EXCHANGE',
        location_id: locations[0].id,
        description: '2nd Hand Cycle Exchange - auto-created',
        status: 'active',
      })
      .select('id, bin_code')
      .single();

    if (createError) {
      // Handle race condition — another request may have created it
      if (createError.code === '23505') {
        const { data: retry } = await supabase
          .from('bin_locations')
          .select('id, bin_code')
          .eq('bin_code', 'EXCHANGE')
          .single();
        if (retry) return retry;
      }
      throw createError;
    }

    return newBin!;
  },

  // Create a new exchange item
  async create(data: CreateExchangeInput) {
    const exchangeBin = await exchangesService.ensureExchangeBin();

    const { data: item, error } = await supabase
      .from('exchange_items')
      .insert({
        item_name: data.item_name,
        condition: data.condition,
        invoice_reference: data.invoice_reference,
        customer_name: data.customer_name,
        estimated_price: data.estimated_price,
        photo_base64: data.photo_base64,
        exchange_bin_id: exchangeBin.id,
        received_by: data.received_by,
        received_by_name: data.received_by_name,
        notes: data.notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating exchange item:', error.message);
      throw error;
    }

    return item;
  },

  // Get all exchange items with optional filters
  async getAll(filters?: { status?: string; condition?: string }) {
    let query = supabase
      .from('exchange_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.condition) {
      query = query.eq('condition', filters.condition);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching exchange items:', error.message);
      throw error;
    }

    return data;
  },

  // Get a single exchange item by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('exchange_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching exchange item:', error.message);
      throw error;
    }

    return data;
  },

  // Update exchange item status
  async updateStatus(id: string, status: string) {
    const { data, error } = await supabase
      .from('exchange_items')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating exchange status:', error.message);
      throw error;
    }

    return data;
  },

  // Get stats for dashboard
  async getStats() {
    const { data, error } = await supabase
      .from('exchange_items')
      .select('status, condition');

    if (error) {
      console.error('Error fetching exchange stats:', error.message);
      throw error;
    }

    const items = data || [];
    return {
      total: items.length,
      by_status: {
        received: items.filter(i => i.status === 'received').length,
        listed: items.filter(i => i.status === 'listed').length,
        sold: items.filter(i => i.status === 'sold').length,
      },
      by_condition: {
        good: items.filter(i => i.condition === 'good').length,
        ok: items.filter(i => i.condition === 'ok').length,
        bad: items.filter(i => i.condition === 'bad').length,
      },
    };
  },

  // Delete an exchange item
  async delete(id: string) {
    const { error } = await supabase
      .from('exchange_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting exchange item:', error.message);
      throw error;
    }

    return true;
  },
};

export default exchangesService;
