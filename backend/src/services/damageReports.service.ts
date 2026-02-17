import { supabaseAdmin as supabase } from '../config/supabase';

interface CreateDamageReportInput {
  stock_count_id?: string;
  item_id?: string;
  item_name: string;
  serial_number?: string;
  bin_location_id?: string;
  bin_code?: string;
  damaged_bin_id?: string;
  damage_type?: string;
  severity?: string;
  quantity?: number;
  damage_description?: string;
  photo_base64?: string;
  reported_by?: string;
  reported_by_name?: string;
}

interface UpdateDamageReportInput {
  status: 'approved' | 'rejected';
  reviewed_by: string;
  review_notes?: string;
}

export const damageReportsService = {
  // Create a new damage report
  async create(data: CreateDamageReportInput) {
    const { data: report, error } = await supabase
      .from('item_damage_reports')
      .insert({
        stock_count_id: data.stock_count_id,
        item_id: data.item_id,
        item_name: data.item_name,
        serial_number: data.serial_number,
        bin_location_id: data.bin_location_id,
        bin_code: data.bin_code,
        damaged_bin_id: data.damaged_bin_id,
        damage_type: data.damage_type,
        severity: data.severity,
        quantity: data.quantity || 1,
        damage_description: data.damage_description,
        photo_base64: data.photo_base64,
        reported_by: data.reported_by,
        reported_by_name: data.reported_by_name,
        reported_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating damage report:', error);
      throw error;
    }

    return report;
  },

  // Get all damage reports with optional filters
  async getAll(filters?: { status?: string; item_id?: string; stock_count_id?: string }) {
    let query = supabase
      .from('item_damage_reports')
      .select(`
        *,
        items:item_id (id, item_name, sku),
        bin_locations:bin_location_id (id, bin_code),
        damaged_bins:damaged_bin_id (id, bin_code)
      `)
      .order('reported_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.item_id) {
      query = query.eq('item_id', filters.item_id);
    }
    if (filters?.stock_count_id) {
      query = query.eq('stock_count_id', filters.stock_count_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching damage reports:', error);
      throw error;
    }

    return data;
  },

  // Get a single damage report by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('item_damage_reports')
      .select(`
        *,
        items:item_id (id, item_name, sku, variant, color, size),
        bin_locations:bin_location_id (id, bin_code),
        damaged_bins:damaged_bin_id (id, bin_code)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching damage report:', error);
      throw error;
    }

    return data;
  },

  // Update damage report (approve/reject)
  async review(id: string, data: UpdateDamageReportInput) {
    const { data: report, error } = await supabase
      .from('item_damage_reports')
      .update({
        status: data.status,
        reviewed_by: data.reviewed_by,
        reviewed_at: new Date().toISOString(),
        review_notes: data.review_notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error reviewing damage report:', error);
      throw error;
    }

    return report;
  },

  // Get pending count for dashboard
  async getPendingCount() {
    const { count, error } = await supabase
      .from('item_damage_reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) {
      console.error('Error counting pending damage reports:', error);
      throw error;
    }

    return count || 0;
  },

  // Clear photo from a damage report (to save storage)
  async clearPhoto(id: string) {
    const { data, error } = await supabase
      .from('item_damage_reports')
      .update({ photo_base64: null, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error clearing photo from damage report:', error);
      throw error;
    }

    return data;
  },

  // Delete a damage report
  async delete(id: string) {
    const { error } = await supabase
      .from('item_damage_reports')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting damage report:', error);
      throw error;
    }

    return true;
  },
};

export default damageReportsService;
