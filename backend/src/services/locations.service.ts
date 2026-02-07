import { supabaseAdmin } from '../config/supabase';

export class LocationsService {
  async getAllLocations(filters?: {
    status?: string;
    search?: string;
  }) {
    let query = supabaseAdmin
      .from('locations')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async getLocationById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('locations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async checkLocationNameExists(name: string, excludeId?: string) {
    let query = supabaseAdmin
      .from('locations')
      .select('id')
      .eq('name', name);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  }

  async createLocation(locationData: {
    name: string;
    description?: string;
    status?: string;
  }) {
    const exists = await this.checkLocationNameExists(locationData.name.trim());
    if (exists) {
      throw new Error(`Location '${locationData.name}' already exists`);
    }

    const newLocation = {
      name: locationData.name.trim(),
      description: locationData.description?.trim() || null,
      status: locationData.status || 'active'
    };

    const { data, error } = await supabaseAdmin
      .from('locations')
      .insert(newLocation)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateLocation(id: string, locationData: {
    name?: string;
    description?: string;
    status?: string;
  }) {
    if (locationData.name) {
      const exists = await this.checkLocationNameExists(locationData.name.trim(), id);
      if (exists) {
        throw new Error(`Location '${locationData.name}' already exists`);
      }
    }

    const updateData: any = {};

    if (locationData.name !== undefined) {
      updateData.name = locationData.name.trim();
    }
    if (locationData.description !== undefined) {
      updateData.description = locationData.description?.trim() || null;
    }
    if (locationData.status !== undefined) {
      updateData.status = locationData.status;
    }

    const { data, error } = await supabaseAdmin
      .from('locations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteLocation(id: string) {
    // Check if any bin_locations reference this location
    const { data: bins, error: checkError } = await supabaseAdmin
      .from('bin_locations')
      .select('id')
      .eq('location_id', id)
      .limit(1);

    if (checkError) throw checkError;

    if (bins && bins.length > 0) {
      throw new Error('Cannot delete location that has bins assigned to it. Remove all bins first.');
    }

    const { data, error } = await supabaseAdmin
      .from('locations')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
