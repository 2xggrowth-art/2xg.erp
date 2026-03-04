import { supabaseAdmin as supabase } from '../config/supabase';

export interface CreateRegisterData {
  name: string;
  description?: string;
  is_active?: boolean;
  organization_id?: string;
}

export class RegistersService {
  /**
   * Get all registers
   */
  async getAllRegisters(orgId?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('registers')
        .select('*')
        .order('created_at', { ascending: true });

      if (orgId) {
        query = query.eq('organization_id', orgId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching registers:', error);
      throw error;
    }
  }

  /**
   * Create a new register
   */
  async createRegister(data: CreateRegisterData, organizationId?: string): Promise<any> {
    try {
      let orgId = organizationId || data.organization_id;
      if (!orgId) {
        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .limit(1)
          .single();
        orgId = org?.id || '00000000-0000-0000-0000-000000000001';
      }

      const { data: register, error } = await supabase
        .from('registers')
        .insert({
          organization_id: orgId,
          name: data.name,
          description: data.description || null,
          is_active: data.is_active !== undefined ? data.is_active : true,
        })
        .select()
        .single();

      if (error) throw error;
      return register;
    } catch (error) {
      console.error('Error creating register:', error);
      throw error;
    }
  }

  /**
   * Update a register
   */
  async updateRegister(id: string, data: Partial<CreateRegisterData>): Promise<any> {
    try {
      const updateData: any = {};

      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;

      if (Object.keys(updateData).length === 0) {
        throw new Error('No valid fields to update');
      }

      const { data: register, error } = await supabase
        .from('registers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return register;
    } catch (error) {
      console.error('Error updating register:', error);
      throw error;
    }
  }

  /**
   * Get the next available device number for an organization
   */
  async getNextDeviceNumber(orgId: string): Promise<number> {
    const { data, error } = await supabase
      .from('registers')
      .select('device_number')
      .eq('organization_id', orgId)
      .not('device_number', 'is', null)
      .order('device_number', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!data || data.length === 0 || data[0].device_number == null) {
      return 1;
    }
    return data[0].device_number + 1;
  }

  /**
   * Register a device — creates or updates a register with a unique device_number.
   * Used by POS desktop apps to get a unique prefix for invoice/session numbers.
   */
  async registerDevice(orgId: string, deviceName: string): Promise<any> {
    try {
      // Check if a register with this name already exists for this org
      const { data: existing } = await supabase
        .from('registers')
        .select('*')
        .eq('organization_id', orgId)
        .eq('name', deviceName)
        .limit(1);

      if (existing && existing.length > 0) {
        const reg = existing[0];
        // If it already has a device_number, return it as-is
        if (reg.device_number != null) {
          return reg;
        }
        // Otherwise assign the next device number
        const nextNum = await this.getNextDeviceNumber(orgId);
        const { data: updated, error } = await supabase
          .from('registers')
          .update({ device_number: nextNum, is_active: true })
          .eq('id', reg.id)
          .select()
          .single();
        if (error) throw error;
        return updated;
      }

      // Create a new register with device_number
      const nextNum = await this.getNextDeviceNumber(orgId);
      const { data: register, error } = await supabase
        .from('registers')
        .insert({
          organization_id: orgId,
          name: deviceName,
          device_number: nextNum,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return register;
    } catch (error) {
      console.error('Error registering device:', error);
      throw error;
    }
  }

  /**
   * Soft delete a register (set is_active=false)
   */
  async deleteRegister(id: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('registers')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error deleting register:', error);
      throw error;
    }
  }
}
