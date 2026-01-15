import { supabaseAdmin as supabase } from '../config/supabase';

export interface CreateCustomerData {
  customer_name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  billing_address?: string;
  shipping_address?: string;
  payment_terms?: string;
  credit_limit?: number;
  notes?: string;
  is_active?: boolean;
}

export class CustomersService {
  /**
   * Get all customers with optional filters
   */
  async getAllCustomers(filters?: {
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }
      if (filters?.search) {
        query = query.or(`customer_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      // Apply pagination
      const page = filters?.page || 1;
      const limit = filters?.limit || 50;
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        customers: data || [],
        total: count || 0,
        page,
        limit
      };
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }

  /**
   * Get a single customer by ID
   */
  async getCustomerById(id: string) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  }

  /**
   * Create a new customer
   */
  async createCustomer(data: CreateCustomerData) {
    try {
      const { data: customer, error } = await supabase
        .from('customers')
        .insert([data])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return customer;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  /**
   * Update an existing customer
   */
  async updateCustomer(id: string, data: Partial<CreateCustomerData>) {
    try {
      const { data: customer, error } = await supabase
        .from('customers')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return customer;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  /**
   * Delete a customer
   */
  async deleteCustomer(id: string) {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }
}
