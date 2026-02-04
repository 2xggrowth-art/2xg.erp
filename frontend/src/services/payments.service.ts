import apiClient from './api.client';

export interface PaymentMade {
  id: string;
  organization_id: string;
  payment_number: string;
  vendor_id?: string;
  vendor_name: string;
  payment_date: string;
  payment_mode: string;
  reference_number?: string;
  amount: number;
  bank_charges: number;
  currency: string;
  exchange_rate: number;
  notes?: string;
  payment_account?: string;
  deposit_to?: string;
  bill_id?: string;
  bill_number?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentAllocation {
  bill_id?: string;
  bill_number?: string;
  amount_allocated: number;
}

export interface CreatePaymentData {
  vendor_id?: string;
  vendor_name: string;
  payment_date: string;
  payment_mode: string;
  reference_number?: string;
  amount: number;
  bank_charges?: number;
  currency?: string;
  exchange_rate?: number;
  notes?: string;
  payment_account?: string;
  deposit_to?: string;
  bill_id?: string;
  bill_number?: string;
  allocations?: PaymentAllocation[];
  status?: string;
}

interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const paymentsService = {
  /**
   * Generate a new payment number
   */
  generatePaymentNumber: async (): Promise<APIResponse<{ payment_number: string }>> => {
    try {
      const response = await apiClient.get<APIResponse<{ payment_number: string }>>(
        `/payments/generate-payment-number`
      );
      return response.data;
    } catch (error) {
      console.error('Error generating payment number:', error);
      throw error;
    }
  },

  /**
   * Create a new payment
   */
  createPayment: async (data: CreatePaymentData): Promise<APIResponse<PaymentMade>> => {
    try {
      const response = await apiClient.post<APIResponse<PaymentMade>>(
        `/payments`,
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  },

  /**
   * Get all payments with optional filters
   */
  getAllPayments: async (filters?: {
    status?: string;
    vendor_id?: string;
    from_date?: string;
    to_date?: string;
    search?: string;
  }): Promise<APIResponse<PaymentMade[]>> => {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.vendor_id) params.append('vendor_id', filters.vendor_id);
      if (filters?.from_date) params.append('from_date', filters.from_date);
      if (filters?.to_date) params.append('to_date', filters.to_date);
      if (filters?.search) params.append('search', filters.search);

      const response = await apiClient.get<APIResponse<PaymentMade[]>>(
        `/payments?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  },

  /**
   * Get payment by ID
   */
  getPaymentById: async (id: string): Promise<APIResponse<PaymentMade>> => {
    try {
      const response = await apiClient.get<APIResponse<PaymentMade>>(
        `/payments/${id}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching payment:', error);
      throw error;
    }
  },

  /**
   * Update an existing payment
   */
  updatePayment: async (id: string, data: Partial<CreatePaymentData>): Promise<APIResponse<PaymentMade>> => {
    try {
      const response = await apiClient.put<APIResponse<PaymentMade>>(
        `/payments/${id}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  },

  /**
   * Delete a payment
   */
  deletePayment: async (id: string): Promise<APIResponse<PaymentMade>> => {
    try {
      const response = await apiClient.delete<APIResponse<PaymentMade>>(
        `/payments/${id}`
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  },

  /**
   * Get payments summary
   */
  getPaymentsSummary: async (): Promise<APIResponse<any>> => {
    try {
      const response = await apiClient.get<APIResponse<any>>(
        `/payments/summary`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching payments summary:', error);
      throw error;
    }
  },
};
