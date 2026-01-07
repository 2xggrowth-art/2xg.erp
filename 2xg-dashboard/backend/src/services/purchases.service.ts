import { supabaseAdmin } from '../config/supabase';
import { DateRangeParams } from '../types';

export class PurchasesService {
  /**
   * Get all purchase orders
   */
  async getAllPurchaseOrders(startDate?: string, endDate?: string) {
    let query = supabaseAdmin
      .from('purchase_orders')
      .select('*')
      .order('order_date', { ascending: false });

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
   * Get purchase orders summary
   */
  async getPurchaseSummary(startDate?: string, endDate?: string) {
    let query = supabaseAdmin
      .from('purchase_orders')
      .select('status, total_amount');

    if (startDate) {
      query = query.gte('order_date', startDate);
    }
    if (endDate) {
      query = query.lte('order_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    const totalPurchases = data.reduce((sum, po) => sum + Number(po.total_amount), 0);
    const pendingPO = data.filter(po => po.status === 'draft' || po.status === 'sent').length;
    const receivedPO = data.filter(po => po.status === 'received').length;

    return {
      totalOrders: data.length,
      totalAmount: totalPurchases,
      pendingOrders: pendingPO,
      receivedOrders: receivedPO,
      currency: 'INR'
    };
  }

  /**
   * Get purchase by status
   */
  async getPurchasesByStatus(startDate?: string, endDate?: string) {
    let query = supabaseAdmin
      .from('purchase_orders')
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

    data.forEach((po: any) => {
      const existing = statusMap.get(po.status) || { status: po.status, count: 0, total: 0 };
      existing.count += 1;
      existing.total += Number(po.total_amount);
      statusMap.set(po.status, existing);
    });

    return Array.from(statusMap.values());
  }
}
