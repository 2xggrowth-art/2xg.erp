import { pool } from '../config/database';

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
      let query = 'SELECT * FROM expense_categories WHERE organization_id = $1';
      const params: any[] = [organizationId];

      if (filters?.isActive !== undefined) {
        query += ' AND is_active = $2';
        params.push(filters.isActive);
      }

      query += ' ORDER BY category_name ASC';

      const result = await pool.query(query, params);
      return result.rows;
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
      const result = await pool.query(
        'SELECT * FROM expense_categories WHERE id = $1 AND organization_id = $2',
        [id, organizationId]
      );
      return result.rows[0];
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
      const result = await pool.query(
        `INSERT INTO expense_categories (organization_id, category_name, description, is_active)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [organizationId, data.category_name, data.description, data.is_active ?? true]
      );
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Category name already exists');
      }
      console.error('Error creating expense category:', error);
      throw error;
    }
  },

  /**
   * Update expense category
   */
  async updateCategory(id: string, organizationId: string, data: Partial<CreateExpenseCategoryData>) {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramCounter = 1;

      if (data.category_name !== undefined) {
        fields.push(`category_name = $${paramCounter++}`);
        values.push(data.category_name);
      }
      if (data.description !== undefined) {
        fields.push(`description = $${paramCounter++}`);
        values.push(data.description);
      }
      if (data.is_active !== undefined) {
        fields.push(`is_active = $${paramCounter++}`);
        values.push(data.is_active);
      }

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(id, organizationId);

      const result = await pool.query(
        `UPDATE expense_categories
         SET ${fields.join(', ')}
         WHERE id = $${paramCounter} AND organization_id = $${paramCounter + 1}
         RETURNING *`,
        values
      );

      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error('Category name already exists');
      }
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
      const expenseCheck = await pool.query(
        'SELECT COUNT(*) as count FROM expenses WHERE category_id = $1',
        [id]
      );

      if (parseInt(expenseCheck.rows[0].count) > 0) {
        throw new Error('Cannot delete category that is used in expenses. Deactivate it instead.');
      }

      const result = await pool.query(
        'DELETE FROM expense_categories WHERE id = $1 AND organization_id = $2 RETURNING *',
        [id, organizationId]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error deleting expense category:', error);
      throw error;
    }
  }
};
