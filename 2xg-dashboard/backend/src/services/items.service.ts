import { supabaseAdmin } from '../config/supabase';
import { DateRangeParams } from '../types';

export class ItemsService {
  /**
   * Get all items with optional filters
   */
  async getAllItems(filters?: {
    category?: string;
    isActive?: boolean;
    lowStock?: boolean;
  }) {
    let query = supabaseAdmin
      .from('items')
      .select(`
        id,
        item_name,
        sku,
        unit_price,
        cost_price,
        current_stock,
        reorder_point,
        unit_of_measurement,
        is_active,
        product_categories (name)
      `)
      .order('created_at', { ascending: false });

    if (filters?.category) {
      query = query.eq('category_id', filters.category);
    }

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Apply low stock filter if requested
    if (filters?.lowStock) {
      return data.filter(item => item.current_stock <= item.reorder_point);
    }

    return data;
  }

  /**
   * Get item by ID
   */
  async getItemById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get items summary
   */
  async getItemsSummary() {
    const { data, error } = await supabaseAdmin
      .from('items')
      .select('current_stock, reorder_point, is_active, unit_price');

    if (error) throw error;

    const totalItems = data.length;
    const activeItems = data.filter(item => item.is_active).length;
    const lowStockItems = data.filter(item => item.current_stock <= item.reorder_point).length;
    const totalValue = data.reduce((sum, item) => sum + (item.current_stock * item.unit_price), 0);

    return {
      totalItems,
      activeItems,
      lowStockItems,
      totalValue,
      currency: 'INR'
    };
  }

  /**
   * Get top selling items
   */
  async getTopSellingItems(limit = 10) {
    const { data, error } = await supabaseAdmin
      .from('inventory_items')
      .select('id, product_name, sales_count, unit_price')
      .order('sales_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  /**
   * Create a new item
   */
  async createItem(itemData: any) {
    // Get organization_id (default to first organization)
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .limit(1)
      .single();

    const newItem = {
      organization_id: org?.id,
      item_name: itemData.name,
      sku: itemData.sku,
      unit_of_measurement: itemData.unit,
      category_id: itemData.category || null,
      description: itemData.description || null,
      unit_price: parseFloat(itemData.unit_price) || 0,
      cost_price: parseFloat(itemData.cost_price) || 0,
      current_stock: parseInt(itemData.current_stock) || 0,
      reorder_point: parseInt(itemData.reorder_point) || 10,
      max_stock: parseInt(itemData.max_stock) || null,
      barcode: itemData.barcode || null,
      manufacturer: itemData.manufacturer || null,
      weight: parseFloat(itemData.weight) || null,
      dimensions: itemData.dimensions || null,
      is_active: itemData.is_active !== false,
      tax_rate: parseFloat(itemData.tax_rate) || 0,
      image_url: itemData.image_url || null,
      hsn_code: itemData.hsn_code || null,
      brand: itemData.brand || null,
      upc: itemData.upc || null,
      mpn: itemData.mpn || null,
      ean: itemData.ean || null,
      isbn: itemData.isbn || null,
      is_returnable: itemData.is_returnable || false,

      // Sales Information
      is_sellable: itemData.is_sellable !== false,
      selling_price: itemData.selling_price ? parseFloat(itemData.selling_price) : null,
      sales_account: itemData.sales_account || null,
      sales_description: itemData.sales_description || null,

      // Purchase Information
      is_purchasable: itemData.is_purchasable !== false,
      purchase_account: itemData.purchase_account || null,
      purchase_description: itemData.purchase_description || null,
      preferred_vendor_id: itemData.preferred_vendor_id || null,

      // Inventory Tracking
      track_inventory: itemData.track_inventory !== false,
      track_bin_location: itemData.track_bin_location || false,
      advanced_tracking_type: itemData.advanced_tracking_type || 'none',
      inventory_account: itemData.inventory_account || null,
      valuation_method: itemData.valuation_method || null
    };

    const { data, error } = await supabaseAdmin
      .from('items')
      .insert(newItem)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update an existing item
   */
  async updateItem(id: string, itemData: any) {
    const { data, error } = await supabaseAdmin
      .from('items')
      .update(itemData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete an item (soft delete by marking as inactive)
   */
  async deleteItem(id: string) {
    const { data, error } = await supabaseAdmin
      .from('items')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
