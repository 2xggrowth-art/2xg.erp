import { supabaseAdmin } from '../config/supabase';

export class DamageReportsService {
  /**
   * Generate next damage report number (DMG-00001, DMG-00002, etc.)
   */
  async generateNumber(): Promise<string> {
    const { data, error } = await supabaseAdmin
      .from('damage_reports')
      .select('report_number')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    let nextNum = 1;
    if (data && data.length > 0) {
      const match = data[0].report_number.match(/^DMG-(\d+)$/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }

    return `DMG-${nextNum.toString().padStart(5, '0')}`;
  }

  /**
   * List all damage reports with optional filters
   */
  async getAll(filters?: { status?: string; item_id?: string }) {
    let query = supabaseAdmin
      .from('damage_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.item_id) {
      query = query.eq('item_id', filters.item_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /**
   * Get a single damage report by ID
   */
  async getById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('damage_reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a new damage report
   */
  async create(data: {
    item_id: string;
    item_name?: string;
    bin_location_id?: string;
    quantity: number;
    damage_type?: string;
    description?: string;
    photo_urls?: string[];
    reported_by_user_id?: string;
    reported_by_name?: string;
  }) {
    const reportNumber = await this.generateNumber();

    // Get item name if not provided
    let itemName = data.item_name;
    if (!itemName && data.item_id) {
      const { data: item } = await supabaseAdmin
        .from('items')
        .select('item_name')
        .eq('id', data.item_id)
        .single();
      itemName = item?.item_name || '';
    }

    const { data: report, error } = await supabaseAdmin
      .from('damage_reports')
      .insert({
        report_number: reportNumber,
        item_id: data.item_id,
        item_name: itemName,
        bin_location_id: data.bin_location_id || null,
        quantity: data.quantity,
        damage_type: data.damage_type || 'other',
        description: data.description || null,
        photo_urls: data.photo_urls || [],
        status: 'reported',
        reported_by_user_id: data.reported_by_user_id || null,
        reported_by_name: data.reported_by_name || null,
        stock_adjusted: false,
      })
      .select()
      .single();

    if (error) throw error;
    return report;
  }

  /**
   * Update damage report status (review / write-off)
   * When status → 'written_off', deducts quantity from items.current_stock
   */
  async updateStatus(id: string, status: string, userId?: string, notes?: string) {
    const existing = await this.getById(id);

    const validTransitions: Record<string, string[]> = {
      'reported': ['reviewed', 'written_off'],
      'reviewed': ['written_off'],
    };

    if (!validTransitions[existing.status]?.includes(status)) {
      throw new Error(`Cannot transition from '${existing.status}' to '${status}'`);
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'reviewed' || status === 'written_off') {
      updateData.reviewed_by_user_id = userId || null;
      updateData.reviewed_at = new Date().toISOString();
    }

    // Write-off: deduct stock
    if (status === 'written_off' && !existing.stock_adjusted) {
      const { data: item } = await supabaseAdmin
        .from('items')
        .select('current_stock')
        .eq('id', existing.item_id)
        .single();

      if (item) {
        const newStock = Math.max(0, (item.current_stock || 0) - existing.quantity);
        await supabaseAdmin
          .from('items')
          .update({ current_stock: newStock })
          .eq('id', existing.item_id);
      }

      updateData.stock_adjusted = true;
    }

    const { data, error } = await supabaseAdmin
      .from('damage_reports')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
