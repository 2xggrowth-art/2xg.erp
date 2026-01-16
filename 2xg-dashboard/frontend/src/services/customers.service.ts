import apiClient, { APIResponse } from './api.client';
import { AxiosPromise } from 'axios';

export interface Customer {
  id: string;
  customer_name: string;
  company_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  work_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  gst_treatment?: string;
  gstin?: string;
  pan?: string;
  source_of_supply?: string;
  payment_terms?: string;
  currency?: string;
  credit_limit?: number;
  current_balance?: number;
  rating?: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerData {
  salutation?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  display_name: string;
  email?: string;
  work_phone?: string;
  mobile?: string;
  gst_treatment?: string;
  source_of_supply?: string;
  gstin?: string;
  pan?: string;
  currency?: string;
  payment_terms?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  notes?: string;
}

export const customersService = {
  getAllCustomers: (filters?: {
    isActive?: boolean;
    search?: string;
  }): AxiosPromise<APIResponse<Customer[]>> =>
    apiClient.get('/customers', { params: filters }),

  getCustomerById: (id: string): AxiosPromise<APIResponse<Customer>> =>
    apiClient.get(`/customers/${id}`),

  createCustomer: (customerData: CreateCustomerData): AxiosPromise<APIResponse<Customer>> =>
    apiClient.post('/customers', customerData),

  updateCustomer: (id: string, customerData: Partial<CreateCustomerData>): AxiosPromise<APIResponse<Customer>> =>
    apiClient.put(`/customers/${id}`, customerData),

  deleteCustomer: (id: string): AxiosPromise<APIResponse<Customer>> =>
    apiClient.delete(`/customers/${id}`),

  getCustomersSummary: (): AxiosPromise<APIResponse<{
    totalCustomers: number;
    activeCustomers: number;
    totalReceivables: number;
    currency: string;
  }>> =>
    apiClient.get('/customers/summary')
};
