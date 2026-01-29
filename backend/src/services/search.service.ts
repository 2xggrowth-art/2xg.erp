import { supabaseAdmin } from '../config/supabase';

export class SearchService {
  /**
   * Global search across modules
   */
  async globalSearch(query: string, modules?: string[]) {
    const results: any = {
      items: [],
      customers: [],
      sales: [],
      purchases: [],
      expenses: [],
      tasks: []
    };

    const searchTerm = `%${query}%`;

    try {
      // Search in items
      if (!modules || modules.includes('items')) {
        const { data: items } = await supabaseAdmin
          .from('items')
          .select('id, item_name, sku')
          .or(`item_name.ilike.${searchTerm},sku.ilike.${searchTerm}`)
          .limit(10);

        if (items) results.items = items;
      }

      // Search in customers
      if (!modules || modules.includes('customers')) {
        const { data: customers } = await supabaseAdmin
          .from('customers')
          .select('id, name, email')
          .or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`)
          .limit(10);

        if (customers) results.customers = customers;
      }

      // Search in sales orders
      if (!modules || modules.includes('sales')) {
        const { data: sales } = await supabaseAdmin
          .from('sales_orders')
          .select('id, so_number, customer_name')
          .or(`so_number.ilike.${searchTerm},customer_name.ilike.${searchTerm}`)
          .limit(10);

        if (sales) results.sales = sales;
      }

      // Search in tasks
      if (!modules || modules.includes('tasks')) {
        const { data: tasks } = await supabaseAdmin
          .from('tasks')
          .select('id, title, description')
          .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
          .limit(10);

        if (tasks) results.tasks = tasks;
      }

      return results;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Save search query
   */
  async saveSearchHistory(userEmail: string, searchQuery: string, module?: string) {
    const { data, error } = await supabaseAdmin
      .from('search_history')
      .insert({
        user_email: userEmail,
        search_query: searchQuery,
        module
      });

    if (error) throw error;
    return data;
  }

  /**
   * Get search history
   */
  async getSearchHistory(userEmail: string, limit = 20) {
    const { data, error } = await supabaseAdmin
      .from('search_history')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  /**
   * Get saved searches
   */
  async getSavedSearches(userEmail: string) {
    const { data, error } = await supabaseAdmin
      .from('saved_searches')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}
