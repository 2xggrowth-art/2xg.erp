import { supabaseAdmin } from '../config/supabase';

export class CrmService {
  /**
   * Get lead reporting metrics
   */
  async getLeadReporting(startDate?: string, endDate?: string) {
    let query = supabaseAdmin
      .from('crm_leads')
      .select('status, expected_value');

    if (startDate) {
      query = query.gte('lead_date', startDate);
    }
    if (endDate) {
      query = query.lte('lead_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate metrics
    const metrics = {
      volume: data.length,
      wonCount: data.filter(l => l.status === 'won').length,
      lostCount: data.filter(l => l.status === 'lost').length,
      activeCount: data.filter(l => !['won', 'lost'].includes(l.status)).length,
      totalValue: data.reduce((sum, l) => sum + (Number(l.expected_value) || 0), 0),
      wonValue: data
        .filter(l => l.status === 'won')
        .reduce((sum, l) => sum + (Number(l.expected_value) || 0), 0),
      currency: 'INR'
    };

    return metrics;
  }

  /**
   * Get customer list
   */
  async getCustomers(startDate?: string, endDate?: string) {
    let query = supabaseAdmin
      .from('crm_leads')
      .select('*')
      .order('lead_date', { ascending: false });

    if (startDate) {
      query = query.gte('lead_date', startDate);
    }
    if (endDate) {
      query = query.lte('lead_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  /**
   * Get leads by status breakdown
   */
  async getLeadsByStatus(startDate?: string, endDate?: string) {
    let query = supabaseAdmin
      .from('crm_leads')
      .select('status');

    if (startDate) {
      query = query.gte('lead_date', startDate);
    }
    if (endDate) {
      query = query.lte('lead_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by status
    const statusMap = new Map<string, number>();

    data.forEach((lead: any) => {
      const status = lead.status;
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });

    return Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count
    }));
  }
}
