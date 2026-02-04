import apiClient from './api.client';

export interface VendorCreditItem {
  id?: string;
  credit_id?: string;
  item_id?: string;
  item_name: string;
  description?: string;
  account?: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface VendorCredit {
  id: string;
  organization_id: string;
  credit_note_number: string;
  vendor_id?: string;
  vendor_name: string;
  vendor_email?: string;
  vendor_phone?: string;
  credit_date: string;
  location?: string;
  order_number?: string;
  reference_number?: string;
  subject?: string;
  status: 'draft' | 'open' | 'closed' | 'cancelled';
  subtotal: number;
  discount_type?: string;
  discount_value?: number;
  discount_amount: number;
  cgst_rate?: number;
  cgst_amount?: number;
  sgst_rate?: number;
  sgst_amount?: number;
  igst_rate?: number;
  igst_amount?: number;
  tax_amount: number;
  adjustment: number;
  total_amount: number;
  amount_used: number;
  balance: number;
  notes?: string;
  attachment_urls?: string[];
  created_at: string;
  updated_at: string;
  items?: VendorCreditItem[];
}

export interface CreateVendorCreditData {
  vendor_id?: string;
  vendor_name: string;
  vendor_email?: string;
  vendor_phone?: string;
  credit_note_number?: string;
  credit_date: string;
  location?: string;
  order_number?: string;
  reference_number?: string;
  subject?: string;
  status?: string;
  subtotal: number;
  discount_type?: string;
  discount_value?: number;
  discount_amount?: number;
  cgst_rate?: number;
  cgst_amount?: number;
  sgst_rate?: number;
  sgst_amount?: number;
  igst_rate?: number;
  igst_amount?: number;
  tax_amount?: number;
  adjustment?: number;
  total_amount: number;
  notes?: string;
  attachment_urls?: string[];
  items: Omit<VendorCreditItem, 'id' | 'credit_id'>[];
}

export interface VendorCreditsFilters {
  status?: string;
  vendor_id?: string;
  from_date?: string;
  to_date?: string;
  search?: string;
}

export interface VendorCreditsSummary {
  total_credits: number;
  open_count: number;
  closed_count: number;
  draft_count: number;
  total_amount: number;
  total_balance: number;
}

interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const vendorCreditsService = {
  /**
   * Get all vendor credits with optional filters
   */
  getAllVendorCredits: async (filters?: VendorCreditsFilters): Promise<APIResponse<VendorCredit[]>> => {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.vendor_id) params.append('vendor_id', filters.vendor_id);
      if (filters?.from_date) params.append('from_date', filters.from_date);
      if (filters?.to_date) params.append('to_date', filters.to_date);
      if (filters?.search) params.append('search', filters.search);

      const response = await apiClient.get<APIResponse<VendorCredit[]>>(
        `/vendor-credits?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching vendor credits:', error);
      throw error;
    }
  },

  /**
   * Get a single vendor credit by ID
   */
  getVendorCreditById: async (id: string): Promise<APIResponse<VendorCredit>> => {
    try {
      const response = await apiClient.get<APIResponse<VendorCredit>>(
        `/vendor-credits/${id}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching vendor credit:', error);
      throw error;
    }
  },

  /**
   * Generate a new credit number
   */
  generateCreditNumber: async (): Promise<APIResponse<{ credit_note_number: string }>> => {
    try {
      const response = await apiClient.get<APIResponse<{ credit_note_number: string }>>(
        `/vendor-credits/generate-credit-number`
      );
      return response.data;
    } catch (error) {
      console.error('Error generating credit number:', error);
      throw error;
    }
  },

  /**
   * Create a new vendor credit
   */
  createVendorCredit: async (data: CreateVendorCreditData): Promise<APIResponse<VendorCredit>> => {
    try {
      const response = await apiClient.post<APIResponse<VendorCredit>>(
        `/vendor-credits`,
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error creating vendor credit:', error);
      throw error;
    }
  },

  /**
   * Update an existing vendor credit
   */
  updateVendorCredit: async (id: string, data: Partial<CreateVendorCreditData>): Promise<APIResponse<VendorCredit>> => {
    try {
      const response = await apiClient.put<APIResponse<VendorCredit>>(
        `/vendor-credits/${id}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error updating vendor credit:', error);
      throw error;
    }
  },

  /**
   * Delete a vendor credit
   */
  deleteVendorCredit: async (id: string): Promise<APIResponse<VendorCredit>> => {
    try {
      const response = await apiClient.delete<APIResponse<VendorCredit>>(
        `/vendor-credits/${id}`
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting vendor credit:', error);
      throw error;
    }
  },

  /**
   * Get vendor credits summary/statistics
   */
  getVendorCreditsSummary: async (): Promise<APIResponse<VendorCreditsSummary>> => {
    try {
      const response = await apiClient.get<APIResponse<VendorCreditsSummary>>(
        `/vendor-credits/summary`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching vendor credits summary:', error);
      throw error;
    }
  },

  /**
   * Apply credit to a bill
   */
  applyCreditToBill: async (
    creditId: string,
    billData: {
      bill_id: string;
      amount: number;
    }
  ): Promise<APIResponse<any>> => {
    try {
      const response = await apiClient.post<APIResponse<any>>(
        `/vendor-credits/${creditId}/apply-to-bill`,
        billData
      );
      return response.data;
    } catch (error) {
      console.error('Error applying credit to bill:', error);
      throw error;
    }
  },
};

export default vendorCreditsService;
