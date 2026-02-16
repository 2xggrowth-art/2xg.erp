import { supabaseAdmin as supabase } from '../config/supabase';

export const placementHistoryService = {
  // Get combined history from placements, transfers, and damage reports
  async getAll() {
    const [placements, transfers, damages] = await Promise.all([
      this.getPlacementHistory(),
      this.getTransferHistory(),
      this.getDamageHistory(),
    ]);

    // Combine and sort by timestamp descending
    const combined = [...placements, ...transfers, ...damages]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return combined;
  },

  // Get history for a specific item
  async getByItemId(itemId: string) {
    const [placements, transfers, damages] = await Promise.all([
      this.getPlacementHistory(itemId),
      this.getTransferHistory(itemId),
      this.getDamageHistory(itemId),
    ]);

    const combined = [...placements, ...transfers, ...damages]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return combined;
  },

  async getPlacementHistory(itemId?: string) {
    let query = supabase
      .from('placement_tasks')
      .select('*')
      .eq('status', 'placed')
      .order('placed_at', { ascending: false });

    if (itemId) {
      query = query.eq('item_id', itemId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching placement history:', error);
      return [];
    }

    return (data || []).map((p: any) => ({
      id: p.id,
      type: 'placement' as const,
      item_name: p.item_name,
      sku: p.sku || '',
      serial_number: p.serial_number,
      colour: p.colour,
      size: p.size,
      from_bin: null,
      to_bin: p.placed_bin_code || p.suggested_bin_code,
      user_name: p.placed_by_name || 'System',
      timestamp: p.placed_at || p.created_at,
      reference_number: p.source_po || p.id,
    }));
  },

  async getTransferHistory(itemId?: string) {
    let query = supabase
      .from('transfer_tasks')
      .select('*')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    if (itemId) {
      query = query.eq('item_id', itemId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching transfer history:', error);
      return [];
    }

    return (data || []).map((t: any) => ({
      id: t.id,
      type: 'transfer' as const,
      item_name: t.item_name,
      sku: t.sku || '',
      serial_number: t.serial_number,
      colour: t.colour,
      size: t.size,
      from_bin: t.source_bin_code,
      to_bin: t.dest_bin_code,
      user_name: t.assigned_to_name || 'System',
      timestamp: t.completed_at || t.created_at,
      reference_number: t.transfer_number || t.id,
    }));
  },

  async getDamageHistory(itemId?: string) {
    let query = supabase
      .from('item_damage_reports')
      .select('*')
      .order('reported_at', { ascending: false });

    if (itemId) {
      query = query.eq('item_id', itemId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching damage history:', error);
      return [];
    }

    return (data || []).map((d: any) => ({
      id: d.id,
      type: 'damage' as const,
      item_name: d.item_name,
      sku: '',
      serial_number: d.serial_number,
      colour: null,
      size: null,
      from_bin: d.bin_code,
      to_bin: null,
      damage_type: d.damage_type,
      severity: d.severity,
      user_name: d.reported_by_name || 'Unknown',
      timestamp: d.reported_at || d.created_at,
      reference_number: d.id,
    }));
  },
};

export default placementHistoryService;
