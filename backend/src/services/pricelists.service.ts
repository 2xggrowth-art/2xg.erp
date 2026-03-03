import { supabaseAdmin as supabase } from '../config/supabase';

export interface PricelistItem {
  item_id: string;
  price: number;
}

export interface CreatePricelistData {
  name: string;
  description?: string;
  is_default?: boolean;
  is_active?: boolean;
  organization_id?: string;
}

export class PricelistsService {
  /**
   * Create a new pricelist
   */
  async createPricelist(data: CreatePricelistData, organizationId?: string): Promise<any> {
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

      // If this is set as default, unset any existing defaults
      if (data.is_default) {
        await supabase
          .from('pricelists')
          .update({ is_default: false })
          .eq('organization_id', orgId)
          .eq('is_default', true);
      }

      const { data: pricelist, error } = await supabase
        .from('pricelists')
        .insert({
          organization_id: orgId,
          name: data.name,
          description: data.description || null,
          is_default: data.is_default || false,
          is_active: data.is_active !== undefined ? data.is_active : true,
        })
        .select()
        .single();

      if (error) throw error;
      return pricelist;
    } catch (error) {
      console.error('Error creating pricelist:', error);
      throw error;
    }
  }

  /**
   * Get all pricelists
   */
  async getAllPricelists(orgId?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('pricelists')
        .select('*')
        .order('created_at', { ascending: false });

      if (orgId) {
        query = query.eq('organization_id', orgId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pricelists:', error);
      throw error;
    }
  }

  /**
   * Get pricelist by ID with items
   */
  async getPricelistById(id: string): Promise<any> {
    try {
      const { data: pricelist, error } = await supabase
        .from('pricelists')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Fetch pricelist items
      const { data: items, error: itemsError } = await supabase
        .from('pricelist_items')
        .select('*')
        .eq('pricelist_id', id)
        .order('created_at', { ascending: true });

      if (itemsError) throw itemsError;

      return { ...pricelist, items: items || [] };
    } catch (error) {
      console.error('Error fetching pricelist:', error);
      throw error;
    }
  }

  /**
   * Update a pricelist
   */
  async updatePricelist(id: string, data: Partial<CreatePricelistData>): Promise<any> {
    try {
      const updateData: any = {};

      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.is_default !== undefined) updateData.is_default = data.is_default;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;
      updateData.updated_at = new Date().toISOString();

      // If setting as default, unset existing defaults first
      if (data.is_default) {
        const { data: existing } = await supabase
          .from('pricelists')
          .select('organization_id')
          .eq('id', id)
          .single();

        if (existing?.organization_id) {
          await supabase
            .from('pricelists')
            .update({ is_default: false })
            .eq('organization_id', existing.organization_id)
            .eq('is_default', true)
            .neq('id', id);
        }
      }

      if (Object.keys(updateData).length <= 1) {
        throw new Error('No valid fields to update');
      }

      const { data: pricelist, error } = await supabase
        .from('pricelists')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return pricelist;
    } catch (error) {
      console.error('Error updating pricelist:', error);
      throw error;
    }
  }

  /**
   * Soft delete a pricelist (set is_active=false)
   */
  async deletePricelist(id: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('pricelists')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error deleting pricelist:', error);
      throw error;
    }
  }

  /**
   * Bulk upsert pricelist items
   */
  async setPricelistItems(pricelistId: string, items: PricelistItem[]): Promise<any[]> {
    try {
      // Delete existing items for this pricelist
      const { error: deleteError } = await supabase
        .from('pricelist_items')
        .delete()
        .eq('pricelist_id', pricelistId);

      if (deleteError) throw deleteError;

      if (!items || items.length === 0) {
        return [];
      }

      // Insert new items
      const itemsToInsert = items.map(item => ({
        pricelist_id: pricelistId,
        item_id: item.item_id,
        price: Number(item.price),
      }));

      const { data, error } = await supabase
        .from('pricelist_items')
        .insert(itemsToInsert)
        .select();

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error setting pricelist items:', error);
      throw error;
    }
  }

  /**
   * Get all item prices for a pricelist
   */
  async getItemPrices(pricelistId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('pricelist_items')
        .select('*')
        .eq('pricelist_id', pricelistId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pricelist items:', error);
      throw error;
    }
  }
}
