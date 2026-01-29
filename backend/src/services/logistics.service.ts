import { supabaseAdmin } from '../config/supabase';

export class LogisticsService {
  /**
   * Get shipment summary
   */
  async getShipmentSummary(startDate?: string, endDate?: string) {
    // Total shipment due (pending)
    let dueQuery = supabaseAdmin
      .from('shipments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .eq('shipment_type', 'regular');

    // Total shipment received
    let receivedQuery = supabaseAdmin
      .from('shipments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'received')
      .eq('shipment_type', 'regular');

    // Total spare shipment received
    let spareQuery = supabaseAdmin
      .from('shipments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'received')
      .eq('shipment_type', 'spare');

    if (startDate) {
      dueQuery = dueQuery.gte('created_at', startDate);
      receivedQuery = receivedQuery.gte('received_date', startDate);
      spareQuery = spareQuery.gte('received_date', startDate);
    }
    if (endDate) {
      dueQuery = dueQuery.lte('created_at', endDate);
      receivedQuery = receivedQuery.lte('received_date', endDate);
      spareQuery = spareQuery.lte('received_date', endDate);
    }

    const [dueResult, receivedResult, spareResult] = await Promise.all([
      dueQuery,
      receivedQuery,
      spareQuery
    ]);

    if (dueResult.error) throw dueResult.error;
    if (receivedResult.error) throw receivedResult.error;
    if (spareResult.error) throw spareResult.error;

    return {
      due: dueResult.count || 0,
      received: receivedResult.count || 0,
      spare: spareResult.count || 0
    };
  }

  /**
   * Get delivery summary by type
   */
  async getDeliverySummary(startDate?: string, endDate?: string) {
    let query = supabaseAdmin
      .from('deliveries')
      .select('delivery_type, status');

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Count by delivery type
    const summary = {
      cycleDelivered: 0,
      pickupPending: 0,
      pickupCleared: 0,
      outsideDelivery: 0
    };

    data.forEach((delivery: any) => {
      switch (delivery.delivery_type) {
        case 'cycle_delivered':
          if (delivery.status === 'completed') summary.cycleDelivered++;
          break;
        case 'pickup_pending':
          if (delivery.status === 'pending') summary.pickupPending++;
          break;
        case 'pickup_cleared':
          if (delivery.status === 'completed') summary.pickupCleared++;
          break;
        case 'outside_delivery':
          summary.outsideDelivery++;
          break;
      }
    });

    return summary;
  }

  /**
   * Get detailed delivery list
   */
  async getDeliveryList(startDate?: string, endDate?: string, type?: string) {
    let query = supabaseAdmin
      .from('deliveries')
      .select('*')
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('delivery_type', type);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }
}
