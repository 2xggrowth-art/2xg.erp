import { supabaseAdmin } from '../config/supabase';

// Auto-approval threshold in INR
const AUTO_APPROVAL_THRESHOLD = 200;

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
    // Generate expense number - use ORDER BY DESC + LIMIT 1 instead of fetching all rows
    const { data: latestExpense } = await supabaseAdmin
      .from('expenses')
      .select('expense_number')
      .order('expense_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    let maxNumber = 0;
    if (latestExpense?.expense_number) {
      const match = latestExpense.expense_number.match(/EXP-0*(\d+)/);
      if (match) {
        maxNumber = parseInt(match[1]);
      }
    }

    const nextNumber = maxNumber + 1;
    const expenseNumber = `EXP-${String(nextNumber).padStart(4, '0')}`;

    // Get organization_id (default to first organization)
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .limit(1)
      .single();

    // Check if expense qualifies for auto-approval
    const amount = parseFloat(expenseData.amount);
    const isAutoApproved = amount < AUTO_APPROVAL_THRESHOLD;

    // Prepare expense data with defaults - mapped to actual DB columns
    const expense: Record<string, any> = {
      organization_id: expenseData.organization_id || org?.id,
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
      approval_status: isAutoApproved ? 'Approved' : 'Pending',
      remarks: expenseData.remarks || null,
      expense_date: expenseData.expense_date,
      paid_by_id: expenseData.paid_by_id,
      paid_by_name: expenseData.paid_by_name,
      branch: expenseData.branch || null
    };

    // Only add approval fields if auto-approved (these columns may not exist in all DBs)
    if (isAutoApproved) {
      expense.approved_by_name = 'System (Auto-approved)';
      expense.approved_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('expenses')
      .insert(expense)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update an existing expense (only if status is Pending)
   */
  async updateExpense(id: string, expenseData: any) {
    // First check if expense exists and is still pending
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('expenses')
      .select('approval_status')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!existing) throw new Error('Expense not found');
    if (existing.approval_status !== 'Pending') {
      throw new Error('Cannot update expense that is not in Pending status');
    }

    // Check if updated amount qualifies for auto-approval
    const amount = parseFloat(expenseData.amount);
    const isAutoApproved = amount < AUTO_APPROVAL_THRESHOLD;

    // Prepare update data
    const updateData: any = {
      category_id: expenseData.category_id,
      expense_item: expenseData.expense_item,
      notes: expenseData.description || expenseData.notes || null,
      amount: expenseData.amount,
      total_amount: expenseData.total_amount || expenseData.amount,
      payment_mode: expenseData.payment_mode,
      payment_voucher_number: expenseData.payment_voucher_number || null,
      remarks: expenseData.remarks || null,
      expense_date: expenseData.expense_date,
      paid_by_id: expenseData.paid_by_id,
      paid_by_name: expenseData.paid_by_name,
      branch: expenseData.branch || null,
      updated_at: new Date().toISOString()
    };

    // Handle file upload if new file provided
    if (expenseData.voucher_file_url) {
      updateData.voucher_file_url = expenseData.voucher_file_url;
      updateData.voucher_file_name = expenseData.voucher_file_name;
    }

    // Apply auto-approval if amount changed and qualifies
    if (isAutoApproved) {
      updateData.approval_status = 'Approved';
      updateData.approved_by_name = 'System (Auto-approved)';
      updateData.approved_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('expenses')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete an expense (only if status is Pending)
   */
  async deleteExpense(id: string) {
    // First check if expense exists and is still pending
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('expenses')
      .select('approval_status')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!existing) throw new Error('Expense not found');
    if (existing.approval_status !== 'Pending') {
      throw new Error('Cannot delete expense that is not in Pending status');
    }

    const { error } = await supabaseAdmin
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true, message: 'Expense deleted successfully' };
  }

  /**
   * Approve an expense
   */
  async approveExpense(id: string, approverName: string) {
    // First check if expense exists and is pending
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('expenses')
      .select('approval_status, expense_number, amount')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!existing) throw new Error('Expense not found');
    if (existing.approval_status !== 'Pending') {
      throw new Error('Expense is not in Pending status');
    }

    const { data, error } = await supabaseAdmin
      .from('expenses')
      .update({
        approval_status: 'Approved',
        approved_by_name: approverName,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    // Log the approval action
    await this.logApprovalAction(id, 'approved', approverName);

    return data;
  }

  /**
   * Reject an expense
   */
  async rejectExpense(id: string, approverName: string, reason: string) {
    // First check if expense exists and is pending
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('expenses')
      .select('approval_status, expense_number, amount')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!existing) throw new Error('Expense not found');
    if (existing.approval_status !== 'Pending') {
      throw new Error('Expense is not in Pending status');
    }

    const { data, error } = await supabaseAdmin
      .from('expenses')
      .update({
        approval_status: 'Rejected',
        approved_by_name: approverName,
        approved_at: new Date().toISOString(),
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    // Log the rejection action
    await this.logApprovalAction(id, 'rejected', approverName, reason);

    return data;
  }

  /**
   * Log approval actions to expense_approval_logs table
   */
  private async logApprovalAction(expenseId: string, action: string, performedBy: string, reason?: string) {
    try {
      await supabaseAdmin
        .from('expense_approval_logs')
        .insert({
          expense_id: expenseId,
          action: action,
          performed_by: performedBy,
          reason: reason || null,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      // Don't fail the main operation if logging fails
      console.error('Failed to log approval action:', error);
    }
  }
}
