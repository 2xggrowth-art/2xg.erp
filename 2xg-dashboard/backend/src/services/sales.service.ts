import { supabaseAdmin } from '../config/supabase';
import { DateRangeParams } from '../types';

export class SalesService {
  /**
   * Get all sales orders
   */
  async getAllSalesOrders(startDate?: string, endDate?: string) {
    let query = supabaseAdmin
      .from('sales_orders')
      .select('*')
      .order('order_date', { ascending: false});

    if (startDate) {
      query = query.gte('order_date', startDate);
    }
    if (endDate) {
      query = query.lte('order_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /**
   * Get sales summary
   */
  async getSalesSummary(startDate?: string, endDate?: string) {
    let query = supabaseAdmin
      .from('sales_orders')
      .select('status, total_amount, paid_amount, balance_due');

    if (startDate) {
      query = query.gte('order_date', startDate);
    }
    if (endDate) {
      query = query.lte('order_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    const totalSales = data.reduce((sum, so) => sum + Number(so.total_amount), 0);
    const totalPaid = data.reduce((sum, so) => sum + Number(so.paid_amount), 0);
    const totalDue = data.reduce((sum, so) => sum + Number(so.balance_due), 0);
    const confirmedOrders = data.filter(so => so.status === 'confirmed' || so.status === 'processing').length;

    return {
      totalOrders: data.length,
      totalSales,
      totalPaid,
      totalDue,
      confirmedOrders,
      currency: 'INR'
    };
  }

  /**
   * Get sales by status
   */
  async getSalesByStatus(startDate?: string, endDate?: string) {
    let query = supabaseAdmin
      .from('sales_orders')
      .select('status, total_amount');

    if (startDate) {
      query = query.gte('order_date', startDate);
    }
    if (endDate) {
      query = query.lte('order_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    const statusMap = new Map<string, { status: string; count: number; total: number }>();

    data.forEach((so: any) => {
      const existing = statusMap.get(so.status) || { status: so.status, count: 0, total: 0 };
      existing.count += 1;
      existing.total += Number(so.total_amount);
      statusMap.set(so.status, existing);
    });

    return Array.from(statusMap.values());
  }

  /**
   * Get top customers by sales
   */
  async getTopCustomers(limit = 10, startDate?: string, endDate?: string) {
    let query = supabaseAdmin
      .from('sales_orders')
      .select('customer_name, total_amount');

    if (startDate) {
      query = query.gte('order_date', startDate);
    }
    if (endDate) {
      query = query.lte('order_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    const customerMap = new Map<string, { name: string; total: number; count: number }>();

    data.forEach((so: any) => {
      const existing = customerMap.get(so.customer_name) || { name: so.customer_name, total: 0, count: 0 };
      existing.total += Number(so.total_amount);
      existing.count += 1;
      customerMap.set(so.customer_name, existing);
    });

    return Array.from(customerMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }
}
