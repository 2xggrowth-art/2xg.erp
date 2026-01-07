import { supabaseAdmin } from '../config/supabase';
import { DateRangeParams } from '../types';

export class ExpensesService {
  /**
   * Get all expenses
   */
  async getAllExpenses(startDate?: string, endDate?: string) {
    let query = supabaseAdmin
      .from('expenses')
      .select(`
        *,
        expense_categories (name)
      `)
      .order('expense_date', { ascending: false });

    if (startDate) {
      query = query.gte('expense_date', startDate);
    }
    if (endDate) {
      query = query.lte('expense_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /**
   * Get expenses summary
   */
  async getExpensesSummary(startDate?: string, endDate?: string) {
    let query = supabaseAdmin
      .from('expenses')
      .select('total_amount, status, is_billable');

    if (startDate) {
      query = query.gte('expense_date', startDate);
    }
    if (endDate) {
      query = query.lte('expense_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    const totalExpenses = data.reduce((sum, exp) => sum + Number(exp.total_amount), 0);
    const pendingExpenses = data.filter(exp => exp.status === 'pending').length;
    const approvedExpenses = data.filter(exp => exp.status === 'approved').length;
    const billableExpenses = data.filter(exp => exp.is_billable).reduce((sum, exp) => sum + Number(exp.total_amount), 0);

    return {
      totalExpenses,
      expenseCount: data.length,
      pendingCount: pendingExpenses,
      approvedCount: approvedExpenses,
      billableAmount: billableExpenses,
      currency: 'INR'
    };
  }

  /**
   * Get expenses by category
   */
  async getExpensesByCategory(startDate?: string, endDate?: string) {
    let query = supabaseAdmin
      .from('expenses')
      .select(`
        total_amount,
        expense_categories (name)
      `);

    if (startDate) {
      query = query.gte('expense_date', startDate);
    }
    if (endDate) {
      query = query.lte('expense_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    const categoryMap = new Map<string, { name: string; total: number; count: number }>();

    data.forEach((exp: any) => {
      const categoryName = exp.expense_categories?.name || 'Uncategorized';
      const existing = categoryMap.get(categoryName) || { name: categoryName, total: 0, count: 0 };
      existing.total += Number(exp.total_amount);
      existing.count += 1;
      categoryMap.set(categoryName, existing);
    });

    return Array.from(categoryMap.values()).sort((a, b) => b.total - a.total);
  }

  /**
   * Get expense categories
   */
  async getExpenseCategories() {
    const { data, error } = await supabaseAdmin
      .from('expense_categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  }
}
