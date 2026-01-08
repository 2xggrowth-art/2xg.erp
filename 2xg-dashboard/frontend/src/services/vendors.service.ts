import apiClient, { APIResponse } from './api.client';

export interface Vendor {
  id: string;
  supplier_name: string;
  company_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
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
  is_msme_registered?: boolean;
  credit_limit?: number;
  current_balance?: number;
  rating?: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateVendorData {
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
  pan?: string;
  is_msme_registered?: boolean;
  currency?: string;
  payment_terms?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  notes?: string;
}

export const vendorsService = {
  getAllVendors: (filters?: {
    isActive?: boolean;
    search?: string;
  }): Promise<APIResponse<Vendor[]>> =>
    apiClient.get('/vendors', { params: filters }),

  getVendorById: (id: string): Promise<APIResponse<Vendor>> =>
    apiClient.get(`/vendors/${id}`),

  createVendor: (vendorData: CreateVendorData): Promise<APIResponse<Vendor>> =>
    apiClient.post('/vendors', vendorData),

  updateVendor: (id: string, vendorData: Partial<CreateVendorData>): Promise<APIResponse<Vendor>> =>
    apiClient.put(`/vendors/${id}`, vendorData),

  deleteVendor: (id: string): Promise<APIResponse<Vendor>> =>
    apiClient.delete(`/vendors/${id}`),

  getVendorsSummary: (): Promise<APIResponse<{
    totalVendors: number;
    activeVendors: number;
    totalPayables: number;
    currency: string;
  }>> =>
    apiClient.get('/vendors/summary')
};
