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
}
