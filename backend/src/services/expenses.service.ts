import { supabaseAdmin } from '../config/supabase';

export class ExpensesService {
  /**
   * Get all expenses
   */
  async getAllExpenses(startDate?: string, endDate?: string) {
    let query = supabaseAdmin
      .from('expenses')
      .select(`
        *,
        expense_categories!fk_category (category_name)
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
   * Get expense by ID
   */
  async getExpenseById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('expenses')
      .select(`
        *,
        expense_categories!fk_category (category_name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get expenses summary
   */
  async getExpensesSummary(startDate?: string, endDate?: string) {
    let query = supabaseAdmin
      .from('expenses')
      .select('amount, approval_status');

    if (startDate) {
      query = query.gte('expense_date', startDate);
    }
    if (endDate) {
      query = query.lte('expense_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    const totalExpenses = data.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const pendingExpenses = data.filter(exp => exp.approval_status === 'Pending').length;
    const approvedExpenses = data.filter(exp => exp.approval_status === 'Approved').length;

    return {
      totalExpenses,
      expenseCount: data.length,
      pendingCount: pendingExpenses,
      approvedCount: approvedExpenses,
      billableAmount: 0,
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
        amount,
        category_id,
        expense_categories!fk_category (category_name)
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
      const categoryName = exp.expense_categories?.category_name || 'Uncategorized';
      const existing = categoryMap.get(categoryName) || { name: categoryName, total: 0, count: 0 };
      existing.total += Number(exp.amount);
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
      .order('category_name');

    if (error) throw error;
    return data;
  }

  /**
   * Create a new expense
   */
  async createExpense(expenseData: any) {
    // Generate expense number - get all expense numbers to find the max
    const { data: expenses } = await supabaseAdmin
      .from('expenses')
      .select('expense_number')
      .order('expense_number', { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (expenses && expenses.length > 0 && expenses[0]?.expense_number) {
      const match = expenses[0].expense_number.match(/EXP-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    const expenseNumber = `EXP-${String(nextNumber).padStart(5, '0')}`;

    // Prepare expense data with defaults
    // Map frontend fields to database schema (COMPLETE_SCHEMA_FIXED.sql)
    const expense = {
      expense_number: expenseNumber,
      category_id: expenseData.category_id,
      expense_item: expenseData.expense_item || 'General Expense', // REQUIRED FIELD
      expense_date: expenseData.expense_date,
      amount: expenseData.amount,
      tax_amount: 0, // No tax in current implementation
      total_amount: expenseData.amount, // Required field - set to amount since no tax
      payment_method: expenseData.payment_mode || null, // Map payment_mode → payment_method
      reference_number: expenseData.payment_voucher_number || null, // Map payment_voucher_number → reference_number
      notes: [expenseData.description, expenseData.remarks].filter(Boolean).join('\n\n') || null, // Combine description + remarks → notes
      receipt_url: expenseData.voucher_file_url || null,
      status: 'pending' // Map approval_status → status (lowercase)
    };

    const { data, error } = await supabaseAdmin
      .from('expenses')
      .insert(expense)
      .select(`
        *,
        expense_categories!fk_category (category_name)
      `)
      .single();

    if (error) throw error;
    return data;
  }
}
