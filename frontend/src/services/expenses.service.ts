import apiClient from './api.client';

export interface Expense {
  id?: string;
  expense_number?: string;
  category_id: string;
  category_name?: string;
  expense_item: string;
  description?: string;
  amount: number;
  payment_mode: 'Cash' | 'UPI' | 'Debit Card' | 'Credit Card' | 'Bank Transfer';
  payment_voucher_number?: string;
  voucher_file_url?: string;
  voucher_file_name?: string;
  approval_status?: 'Pending' | 'Approved' | 'Rejected';
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
  remarks?: string;
  expense_date: string;
  paid_by_id: string;
  paid_by_name: string;
  branch?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExpenseCategory {
  id: string;
  category_name: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
}

export const expensesService = {
  // Get all expenses with filters
  getAllExpenses: async (filters?: {
    approval_status?: string;
    category_id?: string;
    branch?: string;
    from_date?: string;
    to_date?: string;
    paid_by_id?: string;
    page?: number;
    limit?: number;
  }) => {
    try {
      const response = await apiClient.get('/expenses', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
  },

  // Get expense by ID
  getExpenseById: async (id: string) => {
    try {
      const response = await apiClient.get(`/expenses/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching expense:', error);
      throw error;
    }
  },

  // Get expense summary/statistics
  getExpensesSummary: async (filters?: {
    from_date?: string;
    to_date?: string;
    branch?: string;
  }) => {
    try {
      const response = await apiClient.get('/expenses/summary', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching expenses summary:', error);
      throw error;
    }
  },

  // Get expenses by category
  getExpensesByCategory: async (filters?: {
    from_date?: string;
    to_date?: string;
  }) => {
    try {
      const response = await apiClient.get('/expenses/by-category', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching expenses by category:', error);
      throw error;
    }
  },

  // Get expense categories
  getExpenseCategories: async () => {
    try {
      const response = await apiClient.get('/expenses/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching expense categories:', error);
      throw error;
    }
  },

  // Create new expense
  createExpense: async (
    expense: Omit<Expense, 'id' | 'expense_number' | 'created_at' | 'updated_at'>,
    voucherFile?: File | null
  ) => {
    try {
      // If file is provided, use FormData
      if (voucherFile) {
        const formData = new FormData();

        // Append file
        formData.append('voucher', voucherFile);

        // Append all expense data as individual fields
        Object.entries(expense).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value.toString());
          }
        });

        const response = await apiClient.post('/expenses', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      } else {
        // No file, send JSON
        const response = await apiClient.post('/expenses', expense);
        return response.data;
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }
};
