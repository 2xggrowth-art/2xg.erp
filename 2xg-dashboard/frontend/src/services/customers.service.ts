import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

export interface Customer {
  id: string;
  customer_name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  billing_address?: string;
  billing_city?: string;
  billing_state?: string;
  billing_country?: string;
  billing_pincode?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_country?: string;
  shipping_pincode?: string;
  payment_terms?: string;
  credit_limit?: number;
  tax_treatment?: string;
  tax_id?: string;
  is_active?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerFilters {
  isActive?: boolean;
  search?: string;
}

class CustomersService {
  async getAllCustomers(filters?: CustomerFilters) {
    try {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters?.search) params.append('search', filters.search);

      const response = await axios.get(`${API_BASE_URL}/customers?${params.toString()}`);
      const result = response.data.data || response.data;
      return {
        success: true,
        data: result.customers || result,
        message: 'Customers retrieved successfully'
      };
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to fetch customers'
      };
    }
  }

  async getCustomerById(id: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/customers/${id}`);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Customer retrieved successfully'
      };
    } catch (error: any) {
      console.error('Error fetching customer:', error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to fetch customer'
      };
    }
  }

  async createCustomer(customerData: Partial<Customer>) {
    try {
      const response = await axios.post(`${API_BASE_URL}/customers`, customerData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Customer created successfully'
      };
    } catch (error: any) {
      console.error('Error creating customer:', error);
      throw new Error(error.response?.data?.message || 'Failed to create customer');
    }
  }

  async updateCustomer(id: string, customerData: Partial<Customer>) {
    try {
      const response = await axios.put(`${API_BASE_URL}/customers/${id}`, customerData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Customer updated successfully'
      };
    } catch (error: any) {
      console.error('Error updating customer:', error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to update customer'
      };
    }
  }

  async deleteCustomer(id: string) {
    try {
      await axios.delete(`${API_BASE_URL}/customers/${id}`);
      return {
        success: true,
        message: 'Customer deleted successfully'
      };
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete customer'
      };
    }
  }
}

export const customersService = new CustomersService();
