import { supabaseAdmin } from '../config/supabase';

export class AssemblyService {
  async createJourney(data: {
    barcode: string;
    model_sku: string;
    frame_number?: string;
    location_id?: string;
    bin_location_id?: string;
    grn_reference?: string;
  }) {
    const { data: journey, error } = await supabaseAdmin
      .from('assembly_journeys')
      .insert({
        barcode: data.barcode,
        model_sku: data.model_sku,
        frame_number: data.frame_number,
        current_location_id: data.location_id,
        bin_location_id: data.bin_location_id || null,
        grn_reference: data.grn_reference,
        current_status: 'inwarded'
      })
      .select()
      .single();

    if (error) throw error;
    return journey;
  }

  async bulkCreateJourneysFromBill(data: {
    serials: string[];
    model_sku: string;
    grn_reference: string;
  }): Promise<{ created: number; skipped: number; errors: string[] }> {
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const serial of data.serials) {
      const { error } = await supabaseAdmin
        .from('assembly_journeys')
        .insert({
          barcode: serial,
          model_sku: data.model_sku,
          grn_reference: data.grn_reference,
          current_status: 'inwarded'
        });

      if (error) {
        if (error.code === '23505') {
          skipped++;
        } else {
          errors.push(`${serial}: ${error.message}`);
        }
      } else {
        created++;
      }
    }

    return { created, skipped, errors };
  }

  async getJourneyByBarcode(barcode: string) {
    const { data, error } = await supabaseAdmin
      .from('assembly_journeys')
      .select(`
        *,
        current_location:locations(*),
        bin_location:assembly_bins(*),
        technician:users!assembly_journeys_technician_id_fkey(id, name, email),
        supervisor:users!assembly_journeys_supervisor_id_fkey(id, name, email),
        qc_person:users!assembly_journeys_qc_person_id_fkey(id, name, email)
      `)
      .eq('barcode', barcode)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async assignToTechnician(barcode: string, technicianId: string, supervisorId: string) {
    const { data, error } = await supabaseAdmin.rpc('assign_to_technician', {
      p_barcode: barcode,
      p_technician_id: technicianId,
      p_supervisor_id: supervisorId
    });
    if (error) throw error;
    return data;
  }

  async bulkAssign(barcodes: string[], technicianId: string, supervisorId: string) {
    const results = [];
    for (const barcode of barcodes) {
      try {
        const result = await this.assignToTechnician(barcode, technicianId, supervisorId);
        results.push({ barcode, ...result });
      } catch (err: any) {
        results.push({ barcode, success: false, message: err.message });
      }
    }
    return results;
  }

  async startAssembly(barcode: string, technicianId: string) {
    const { data, error } = await supabaseAdmin.rpc('start_assembly', {
      p_barcode: barcode,
      p_technician_id: technicianId
    });
    if (error) throw error;
    return data;
  }

  async updateChecklist(barcode: string, technicianId: string, checklist: object) {
    const { data, error } = await supabaseAdmin
      .from('assembly_journeys')
      .update({ checklist })
      .eq('barcode', barcode)
      .eq('technician_id', technicianId)
      .eq('current_status', 'in_progress')
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async completeAssembly(barcode: string, technicianId: string, checklist: object) {
    const { data, error } = await supabaseAdmin.rpc('complete_assembly', {
      p_barcode: barcode,
      p_technician_id: technicianId,
      p_checklist: checklist
    });
    if (error) throw error;
    return data;
  }

  async getTechnicianQueue(technicianId: string) {
    const { data, error } = await supabaseAdmin.rpc('get_technician_queue', {
      p_technician_id: technicianId
    });
    if (error) throw error;
    return data;
  }

  async getKanbanBoard(filters: { status?: string; location_id?: string; technician_id?: string; priority?: boolean }) {
    let query = supabaseAdmin.from('assembly_kanban_board').select('*');
    if (filters.status) query = query.eq('current_status', filters.status);
    if (filters.location_id) query = query.eq('current_location_id', filters.location_id);
    if (filters.technician_id) query = query.eq('technician_id', filters.technician_id);
    if (filters.priority) query = query.eq('priority', true);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getDailyDashboard() {
    const { data, error } = await supabaseAdmin
      .from('assembly_daily_dashboard')
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async getBottleneckReport() {
    const { data, error } = await supabaseAdmin.from('assembly_bottleneck_report').select('*');
    if (error) throw error;
    return data;
  }

  async getTechnicianWorkload() {
    const { data, error } = await supabaseAdmin.from('assembly_technician_workload').select('*');
    if (error) throw error;
    return data;
  }

  async getQCFailureAnalysis() {
    const { data, error } = await supabaseAdmin.from('assembly_qc_failure_analysis').select('*');
    if (error) throw error;
    return data;
  }

  async canInvoice(barcode: string) {
    const { data, error } = await supabaseAdmin.rpc('can_invoice_item', { p_barcode: barcode });
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  }

  async submitQCResult(barcode: string, qcPersonId: string, result: string, failureReason?: string, photos?: string[]) {
    const { data, error } = await supabaseAdmin.rpc('submit_qc_result', {
      p_barcode: barcode,
      p_qc_person_id: qcPersonId,
      p_result: result,
      p_failure_reason: failureReason || null,
      p_photos: photos || null
    });
    if (error) throw error;
    return data;
  }

  async flagPartMissing(barcode: string, partsList: string[], notes?: string) {
    const { data, error } = await supabaseAdmin
      .from('assembly_journeys')
      .update({
        parts_missing: true,
        parts_missing_list: partsList,
        notes,
        assembly_paused: true,
        pause_reason: 'parts_missing'
      })
      .eq('barcode', barcode)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async reportDamage(barcode: string, damageNotes: string, photos?: string[]) {
    const { data, error } = await supabaseAdmin
      .from('assembly_journeys')
      .update({
        damage_reported: true,
        damage_notes: damageNotes,
        damage_photos: photos,
        assembly_paused: true,
        pause_reason: 'damage_reported'
      })
      .eq('barcode', barcode)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async setPriority(barcode: string, priority: boolean) {
    const { data, error } = await supabaseAdmin
      .from('assembly_journeys')
      .update({ priority })
      .eq('barcode', barcode)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getAssemblyHistory(journeyId: string) {
    const { data, error } = await supabaseAdmin
      .from('assembly_status_history')
      .select(`*, changed_by_user:users(name, email)`)
      .eq('journey_id', journeyId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async getBikeDetails(barcode: string) {
    const { data, error } = await supabaseAdmin
      .from('assembly_journeys')
      .select(`
        *,
        location:locations(id, name, code),
        bin_location:assembly_bins(id, bin_code, bin_name),
        technician:users!assembly_journeys_technician_id_fkey(id, name, email),
        qc_person:users!assembly_journeys_qc_person_id_fkey(id, name, email)
      `)
      .eq('barcode', barcode)
      .single();
    if (error) throw error;

    const { data: timeline } = await supabaseAdmin
      .from('assembly_status_history')
      .select('to_status, created_at')
      .eq('journey_id', data.id)
      .order('created_at', { ascending: false });

    return {
      ...data,
      technician_name: (data as any).technician?.name,
      timeline: timeline?.map((t: any) => ({ status: t.to_status, timestamp: t.created_at })) || []
    };
  }

  async getLocations() {
    const { data, error } = await supabaseAdmin.from('locations').select('*').order('name');
    if (error) throw error;
    return data;
  }

  async createLocation(locationData: { name: string; code: string; type: string; address?: string }) {
    const { data, error } = await supabaseAdmin
      .from('locations')
      .insert(locationData)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateLocation(id: string, updates: object) {
    const { data, error } = await supabaseAdmin
      .from('locations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteLocation(id: string) {
    const { count } = await supabaseAdmin
      .from('assembly_journeys')
      .select('id', { count: 'exact', head: true })
      .eq('current_location_id', id)
      .neq('current_status', 'ready_for_sale');

    if (count && count > 0) {
      throw new Error(`Cannot delete location: ${count} active bike(s) are at this location`);
    }

    const { data, error } = await supabaseAdmin
      .from('locations')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getBins() {
    const { data, error } = await supabaseAdmin
      .from('assembly_bins')
      .select('*, location:locations(*)')
      .eq('is_active', true)
      .order('bin_code');
    if (error) throw error;
    return data;
  }

  async getBinsByLocation(locationId: string) {
    const { data, error } = await supabaseAdmin
      .from('assembly_bins')
      .select('*')
      .eq('location_id', locationId)
      .eq('is_active', true)
      .order('bin_code');
    if (error) throw error;
    return data;
  }

  async getAvailableBins(locationId?: string | null) {
    let query = supabaseAdmin
      .from('assembly_bins')
      .select('*, location:locations(*)')
      .eq('is_active', true)
      .order('bin_code');
    if (locationId) query = query.eq('location_id', locationId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).filter((bin: any) => bin.current_occupancy < bin.capacity);
  }

  async getBinsByZone(locationId: string, zone: string) {
    const { data, error } = await supabaseAdmin.rpc('get_bins_by_zone', {
      p_location_id: locationId,
      p_zone: zone
    });
    if (error) throw error;
    return data;
  }

  async getBinZones(locationId?: string | null) {
    let query = supabaseAdmin
      .from('assembly_bins')
      .select('status_zone, location_id')
      .eq('is_active', true);
    if (locationId) query = query.eq('location_id', locationId);
    const { data, error } = await query;
    if (error) throw error;
    const zones = [...new Set((data || []).map((b: any) => b.status_zone))];
    return zones;
  }

  async getBinZoneStatistics(locationId?: string | null) {
    let query = supabaseAdmin.from('assembly_bin_zone_statistics').select('*');
    if (locationId) query = query.eq('location_id', locationId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async moveBikeToBin(barcode: string, newBinId: string, movedBy: string, reason?: string) {
    const { data, error } = await supabaseAdmin.rpc('move_bike_to_bin', {
      p_barcode: barcode,
      p_new_bin_id: newBinId,
      p_moved_by: movedBy,
      p_reason: reason || null
    });
    if (error) throw error;
    return data;
  }

  async getBinMovementHistory(journeyId: string) {
    const { data, error } = await supabaseAdmin
      .from('assembly_bin_movement_history')
      .select(`
        *,
        from_bin:assembly_bins!assembly_bin_movement_history_from_bin_id_fkey(bin_code, bin_name, status_zone),
        to_bin:assembly_bins!assembly_bin_movement_history_to_bin_id_fkey(bin_code, bin_name, status_zone),
        moved_by_user:users(name, email)
      `)
      .eq('journey_id', journeyId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async getTechnicians() {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .eq('buildline_role', 'technician');
    if (error) throw error;
    return data;
  }
}
