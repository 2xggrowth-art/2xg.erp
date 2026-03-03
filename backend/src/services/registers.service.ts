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
