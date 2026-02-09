import apiClient from './api.client';

export interface Bill {
  id: string;
  organization_id: string;
  bill_number: string;
  vendor_id?: string;
  vendor_name: string;
  vendor_email?: string;
  vendor_phone?: string;
  bill_date: string;
  due_date?: string;
  payment_date?: string;
  status: 'draft' | 'open' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  payment_status?: 'unpaid' | 'partially_paid' | 'paid';
  subtotal: number;
  tax_amount: number;
  discount_amount?: number;
  adjustment?: number;
  total_amount: number;
  amount_paid?: number;
  balance_due?: number;
  notes?: string;
  terms_and_conditions?: string;
  reference_number?: string;
  purchase_order_id?: string;
  po_number?: string;
  attachment_urls?: string[];
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BinAllocation {
  bin_location_id: string;
  bin_code: string;
  location_name: string;
  quantity: number;
}

export interface BillItem {
  id: string;
  bill_id: string;
  item_id?: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit_of_measurement?: string;
  unit_price: number;
  tax_rate: number;
  discount: number;
  total: number;
  account?: string;
  serial_numbers?: string[];
  bin_allocations?: BinAllocation[];
  created_at: string;
}

export interface CreateBillData {
  vendor_id?: string;
  vendor_name: string;
  vendor_email?: string;
  vendor_phone?: string;
  bill_number?: string;
  bill_date: string;
  due_date?: string;
  status?: string;
  subtotal: number;
  tax_amount: number;
  discount_amount?: number;
  adjustment?: number;
  total_amount: number;
  notes?: string;
  terms_and_conditions?: string;
  reference_number?: string;
  purchase_order_id?: string;
  attachment_urls?: string[];
  items: Omit<BillItem, 'id' | 'bill_id' | 'created_at'>[];
}

export interface BillsFilters {
  status?: string;
  vendor_id?: string;
  from_date?: string;
  to_date?: string;
  search?: string;
}

export interface BillsSummary {
  total_bills: number;
  draft_count: number;
  open_count: number;
  paid_count: number;
  overdue_count: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
}

interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const billsService = {
  /**
   * Get all bills with optional filters
   */
  getAllBills: async (filters?: BillsFilters): Promise<APIResponse<Bill[]>> => {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.vendor_id) params.append('vendor_id', filters.vendor_id);
      if (filters?.from_date) params.append('from_date', filters.from_date);
      if (filters?.to_date) params.append('to_date', filters.to_date);
      if (filters?.search) params.append('search', filters.search);

      const response = await apiClient.get<APIResponse<Bill[]>>(
        `/bills?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching bills:', error);
      throw error;
    }
  },

  /**
   * Get a single bill by ID
   */
  getBillById: async (id: string): Promise<APIResponse<Bill & { items: BillItem[] }>> => {
    try {
      const response = await apiClient.get<APIResponse<Bill & { items: BillItem[] }>>(
        `/bills/${id}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching bill:', error);
      throw error;
    }
  },

  /**
   * Generate a new bill number
   */
  generateBillNumber: async (): Promise<APIResponse<{ bill_number: string }>> => {
    try {
      const response = await apiClient.get<APIResponse<{ bill_number: string }>>(
        `/bills/generate-bill-number`
      );
      return response.data;
    } catch (error) {
      console.error('Error generating bill number:', error);
      throw error;
    }
  },

  /**
   * Create a new bill
   */
  createBill: async (data: CreateBillData): Promise<APIResponse<Bill>> => {
    try {
      const response = await apiClient.post<APIResponse<Bill>>(
        `/bills`,
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error creating bill:', error);
      throw error;
    }
  },

  /**
   * Update an existing bill
   */
  updateBill: async (id: string, data: Partial<CreateBillData>): Promise<APIResponse<Bill>> => {
    try {
      const response = await apiClient.put<APIResponse<Bill>>(
        `/bills/${id}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error updating bill:', error);
      throw error;
    }
  },

  /**
   * Delete a bill
   */
  deleteBill: async (id: string): Promise<APIResponse<Bill>> => {
    try {
      const response = await apiClient.delete<APIResponse<Bill>>(
        `/bills/${id}`
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting bill:', error);
      throw error;
    }
  },

  /**
   * Get bills summary/statistics
   */
  getBillsSummary: async (): Promise<APIResponse<BillsSummary>> => {
    try {
      const response = await apiClient.get<APIResponse<BillsSummary>>(
        `/bills/summary`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching bills summary:', error);
      throw error;
    }
  },

  /**
   * Record payment for a bill
   */
  recordPayment: async (
    billId: string,
    paymentData: {
      amount: number;
      payment_date: string;
      payment_method?: string;
      reference_number?: string;
      notes?: string;
    }
  ): Promise<APIResponse<Bill>> => {
    try {
      const response = await apiClient.post<APIResponse<Bill>>(
        `/bills/${billId}/payments`,
        paymentData
      );
      return response.data;
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  },

  /**
   * Convert purchase order to bill
   */
  convertPOToBill: async (poId: string): Promise<APIResponse<Bill>> => {
    try {
      const response = await apiClient.post<APIResponse<Bill>>(
        `/bills/convert-from-po/${poId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error converting PO to bill:', error);
      throw error;
    }
  },

  /**
   * Apply vendor credit to bill
   */
  applyCreditToBill: async (
    billId: string,
    creditData: {
      credit_id: string;
      amount: number;
    }
  ): Promise<APIResponse<Bill>> => {
    try {
      const response = await apiClient.post<APIResponse<Bill>>(
        `/bills/${billId}/apply-credit`,
        creditData
      );
      return response.data;
    } catch (error) {
      console.error('Error applying credit to bill:', error);
      throw error;
    }
  },
  getLastSerialNumber: async (itemId: string): Promise<number> => {
    try {
      const response = await apiClient.get<APIResponse<{ last_serial: number }>>(`/bills/last-serial/${itemId}`);
      return response.data?.data?.last_serial || 0;
    } catch (error) {
      console.error('Error fetching last serial number:', error);
      return 0;
    }
  },
};

export default billsService;
