import { ipc } from './ipc-client';

export interface Customer {
  id: string;
  customer_name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  billing_address?: string;
  shipping_address?: string;
  gstin?: string;
  pan?: string;
  state_code?: string;
  payment_terms?: string;
  current_balance?: number;
  is_active: boolean;
}

export interface CreateCustomerData {
  display_name: string;
  company_name?: string;
  email?: string;
  mobile?: string;
  gstin?: string;
  pan?: string;
  payment_terms?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
}

export const customersService = {
  async getAllCustomers(filters?: { isActive?: boolean; search?: string }): Promise<{ data: Customer[] }> {
    const result = await ipc().getAllCustomers(filters);
    return { data: result.success ? result.data : [] };
  },

  async getCustomerById(id: string): Promise<{ data: Customer | null }> {
    const result = await ipc().getCustomerById(id);
    return { data: result.success ? result.data : null };
  },

  async createCustomer(customerData: CreateCustomerData): Promise<{ data: Customer }> {
    const result = await ipc().createCustomer(customerData);
    if (!result.success) throw new Error(result.error || 'Failed to create customer');
    return { data: result.data };
  },
};
