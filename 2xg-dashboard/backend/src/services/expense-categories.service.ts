import { supabaseAdmin } from '../config/supabase';

export interface ExpenseCategory {
  id: string;
  organization_id: string;
  category_name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseCategoryData {
  category_name: string;
  description?: string;
  is_active?: boolean;
}

export const expenseCategoriesService = {
  /**
   * Get all expense categories
   */
  async getAllCategories(organizationId: string, filters?: { isActive?: boolean }) {
    try {
      let query = supabaseAdmin
        .from('expense_categories')
        .select('*')
        .eq('organization_id', organizationId)
        .order('category_name', { ascending: true });

      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching expense categories:', error);
      throw error;
    }
  },

  /**
   * Get category by ID
   */
  async getCategoryById(id: string, organizationId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('expense_categories')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching expense category:', error);
      throw error;
    }
  },

  /**
   * Create new expense category
   */
  async createCategory(organizationId: string, data: CreateExpenseCategoryData) {
    try {
      const { data: newCategory, error } = await supabaseAdmin
        .from('expense_categories')
        .insert({
          organization_id: organizationId,
          category_name: data.category_name,
          description: data.description,
          is_active: data.is_active ?? true
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('Category name already exists');
        }
        throw error;
      }

      return newCategory;
    } catch (error) {
      console.error('Error creating expense category:', error);
      throw error;
    }
  },

  /**
   * Update expense category
   */
  async updateCategory(id: string, organizationId: string, data: Partial<CreateExpenseCategoryData>) {
    try {
      const updateData: any = {};

      if (data.category_name !== undefined) {
        updateData.category_name = data.category_name;
      }
      if (data.description !== undefined) {
        updateData.description = data.description;
      }
      if (data.is_active !== undefined) {
        updateData.is_active = data.is_active;
      }

      if (Object.keys(updateData).length === 0) {
        throw new Error('No fields to update');
      }

      const { data: updatedCategory, error } = await supabaseAdmin
        .from('expense_categories')
        .update(updateData)
        .eq('id', id)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Category name already exists');
        }
        throw error;
      }

      return updatedCategory;
    } catch (error) {
      console.error('Error updating expense category:', error);
      throw error;
    }
  },

  /**
   * Delete expense category
   */
  async deleteCategory(id: string, organizationId: string) {
    try {
      // Check if category is used in any expenses
      const { count, error: countError } = await supabaseAdmin
        .from('expenses')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', id);

      if (countError) throw countError;

      if (count && count > 0) {
        throw new Error('Cannot delete category that is used in expenses. Deactivate it instead.');
      }

      const { data, error } = await supabaseAdmin
        .from('expense_categories')
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error deleting expense category:', error);
      throw error;
    }
  }
};
