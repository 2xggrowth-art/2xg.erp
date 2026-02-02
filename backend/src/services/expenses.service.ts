import { supabaseAdmin } from '../config/supabase';

export class ExpensesService {
  /**
   * Get all expenses
   */
  async getAllExpenses(startDate?: string, endDate?: string) {
    let query = supabaseAdmin
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false });

    if (startDate) {
      query = query.gte('expense_date', startDate);
    }
    if (endDate) {
      query = query.lte('expense_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Fetch categories for all expenses that have category_id
    if (data && data.length > 0) {
      const categoryIds = [...new Set(data.filter(e => e.category_id).map(e => e.category_id))];

      if (categoryIds.length > 0) {
        const { data: categories } = await supabaseAdmin
          .from('expense_categories')
          .select('id, category_name')
          .in('id', categoryIds);

        if (categories && categories.length > 0) {
          const categoryMap = new Map(categories.map(c => [c.id, c.category_name]));

          data.forEach(expense => {
            if (expense.category_id && categoryMap.has(expense.category_id)) {
              expense.category_name = categoryMap.get(expense.category_id);
            }
          });
        }
      }
    }

    return data;
  }

  /**
   * Get expense by ID
   */
  async getExpenseById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // If expense has category_id, fetch category separately
    if (data && data.category_id) {
      const { data: category } = await supabaseAdmin
        .from('expense_categories')
        .select('category_name')
        .eq('id', data.category_id)
        .single();

      if (category) {
        data.category_name = category.category_name;
      }
    }

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
    // Generate expense number - get all expense numbers to find the actual max
    const { data: expenses } = await supabaseAdmin
      .from('expenses')
      .select('expense_number');

    let maxNumber = 0;
    if (expenses && expenses.length > 0) {
      expenses.forEach((exp: any) => {
        if (exp.expense_number) {
          const match = exp.expense_number.match(/EXP-0*(\d+)/);
          if (match) {
            const num = parseInt(match[1]);
            if (num > maxNumber) maxNumber = num;
          }
        }
      });
    }

    const nextNumber = maxNumber + 1;
    const expenseNumber = `EXP-${String(nextNumber).padStart(4, '0')}`;

    // Prepare expense data with defaults - mapped to actual DB columns
    const expense = {
      expense_number: expenseNumber,
      category_id: expenseData.category_id,
      expense_item: expenseData.expense_item,
      notes: expenseData.description || expenseData.notes || null,
      amount: expenseData.amount,
      total_amount: expenseData.total_amount || expenseData.amount,
      payment_mode: expenseData.payment_mode,
      payment_voucher_number: expenseData.payment_voucher_number || null,
      voucher_file_url: expenseData.voucher_file_url || null,
      voucher_file_name: expenseData.voucher_file_name || null,
      approval_status: 'Pending',
      remarks: expenseData.remarks || null,
      paid_by_id: expenseData.paid_by_id,
      paid_by_name: expenseData.paid_by_name,
      branch: expenseData.branch || null
    };

    const { data, error } = await supabaseAdmin
      .from('expenses')
      .insert(expense)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }
}
