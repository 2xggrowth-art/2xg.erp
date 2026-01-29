import { supabaseAdmin } from '../config/supabase';

export class CareService {
  /**
   * Get total service tickets raised
   */
  async getTotalTickets(startDate?: string, endDate?: string) {
    let query = supabaseAdmin
      .from('service_tickets')
      .select('id', { count: 'exact', head: true });

    if (startDate) {
      query = query.gte('raised_date', startDate);
    }
    if (endDate) {
      query = query.lte('raised_date', endDate);
    }

    const { count, error } = await query;

    if (error) throw error;

    return {
      total: count || 0
    };
  }

  /**
   * Get tickets grouped by category
   */
  async getTicketsByCategory(startDate?: string, endDate?: string) {
    let query = supabaseAdmin
      .from('service_tickets')
      .select('issue_category, status');

    if (startDate) {
      query = query.gte('raised_date', startDate);
    }
    if (endDate) {
      query = query.lte('raised_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by category
    const categoryMap = new Map<string, number>();

    data.forEach((ticket: any) => {
      const category = ticket.issue_category;
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    // Convert to array format for charts
    return Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count
    })).sort((a, b) => b.count - a.count);
  }

  /**
   * Get ticket trends over time (for charts)
   */
  async getTicketTrends(startDate?: string, endDate?: string) {
    let query = supabaseAdmin
      .from('service_tickets')
      .select('raised_date, status');

    if (startDate) {
      query = query.gte('raised_date', startDate);
    }
    if (endDate) {
      query = query.lte('raised_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by date
    const dateMap = new Map<string, { open: number; resolved: number }>();

    data.forEach((ticket: any) => {
      const date = ticket.raised_date;
      const existing = dateMap.get(date) || { open: 0, resolved: 0 };

      if (ticket.status === 'resolved' || ticket.status === 'closed') {
        existing.resolved++;
      } else {
        existing.open++;
      }

      dateMap.set(date, existing);
    });

    return Array.from(dateMap.entries()).map(([date, counts]) => ({
      date,
      ...counts
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
}
