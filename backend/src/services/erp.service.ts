import { supabaseAdmin } from '../config/supabase';
import { DateRangeParams } from '../types';

export class ErpService {
  /**
   * Calculate total sales value
   */
  async calculateTotalSales(startDate?: string, endDate?: string) {
    let query = supabaseAdmin
      .from('sales_transactions')
      .select('amount');

    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }
    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    const total = data.reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      totalSales: total,
      transactionCount: data.length,
      currency: 'INR'
    };
  }

  /**
   * Get sales breakdown by category
   */
  async getSalesByCategory(startDate?: string, endDate?: string) {
    let query = supabaseAdmin
      .from('sales_transactions')
      .select(`
        category_id,
        amount,
        product_categories (
          name
        )
      `);

    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }
    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by category
    const categoryMap = new Map<string, { name: string; total: number; count: number }>();

    data.forEach((transaction: any) => {
      const categoryName = transaction.product_categories?.name || 'Uncategorized';
      const existing = categoryMap.get(categoryName) || { name: categoryName, total: 0, count: 0 };
      existing.total += Number(transaction.amount);
      existing.count += 1;
      categoryMap.set(categoryName, existing);
    });

    return Array.from(categoryMap.values()).sort((a, b) => b.total - a.total);
  }

  /**
   * Get total overdue amount
   */
  async getOverdueAmount(startDate?: string, endDate?: string) {
    let query = supabaseAdmin
      .from('sales_transactions')
      .select('due_amount')
      .eq('payment_status', 'overdue');

    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }
    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    const total = data.reduce((sum, t) => sum + Number(t.due_amount), 0);

    return {
      amount: total,
      count: data.length,
      currency: 'INR'
    };
  }

  /**
   * Get hot selling items
   */
  async getHotSellingItems(limit = 10) {
    const { data, error } = await supabaseAdmin
      .from('inventory_items')
      .select('id, product_name, sales_count, unit_price')
      .order('sales_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  /**
   * Get low stock items (below reorder point)
   */
  async getLowStockItems() {
    const { data, error } = await supabaseAdmin
      .from('inventory_items')
      .select('id, product_name, sku, current_stock, reorder_point');

    if (error) throw error;

    // Filter items where current_stock is less than reorder_point
    return data.filter(item => item.current_stock < item.reorder_point);
  }
}
