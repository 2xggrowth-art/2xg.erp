import apiClient from './api.client';

export interface PaymentReceived {
  id?: string;
  organization_id?: string;
  payment_number?: string;
  customer_id?: string;
  customer_name: string;
  reference_number?: string;
  payment_date: string;
  payment_mode: string;
  amount_received: number;
  bank_charges?: number;
  deposit_to?: string;
  location?: string;
  invoice_id?: string;
  invoice_number?: string;
  amount_used?: number;
  amount_excess?: number;
  status?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentReceivedFilters {
  customer_id?: string;
  payment_mode?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}

class PaymentsReceivedService {
  private readonly basePath = '/payments-received';

  /**
   * Generate a new payment number
   */
  async generatePaymentNumber(): Promise<{ success: boolean; data: { payment_number: string } }> {
    try {
      const response = await apiClient.get(`${this.basePath}/generate-number`);
      return response.data;
    } catch (error: any) {
      console.error('Error generating payment number:', error);
      throw error;
    }
  }

  /**
   * Create a new payment received
   */
  async createPaymentReceived(paymentData: PaymentReceived): Promise<{ success: boolean; data: PaymentReceived; message: string }> {
    try {
      const response = await apiClient.post(this.basePath, paymentData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating payment:', error);
      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.message ||
                          error.message ||
                          'Failed to create payment';
      const errorDetails = error.response?.data?.details;
      const fullMessage = errorDetails ? `${errorMessage}\n${errorDetails}` : errorMessage;
      throw new Error(fullMessage);
    }
  }

  /**
   * Get all payments received
   */
  async getAllPaymentsReceived(filters?: PaymentReceivedFilters): Promise<{
    success: boolean;
    data: {
      payments: PaymentReceived[];
      total: number;
      page: number;
      limit: number;
    }
  }> {
    try {
      const params = new URLSearchParams();
      if (filters?.customer_id) params.append('customer_id', filters.customer_id);
      if (filters?.payment_mode) params.append('payment_mode', filters.payment_mode);
      if (filters?.from_date) params.append('from_date', filters.from_date);
      if (filters?.to_date) params.append('to_date', filters.to_date);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const url = params.toString() ? `${this.basePath}?${params.toString()}` : this.basePath;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  }

  /**
   * Get a single payment by ID
   */
  async getPaymentReceivedById(id: string): Promise<{ success: boolean; data: PaymentReceived }> {
    try {
      const response = await apiClient.get(`${this.basePath}/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching payment:', error);
      throw error;
    }
  }

  /**
   * Update a payment
   */
  async updatePaymentReceived(id: string, paymentData: Partial<PaymentReceived>): Promise<{ success: boolean; data: PaymentReceived; message: string }> {
    try {
      const response = await apiClient.put(`${this.basePath}/${id}`, paymentData);
      return response.data;
    } catch (error: any) {
      console.error('Error updating payment:', error);
      throw error;
    }
  }

  /**
   * Delete a payment
   */
  async deletePaymentReceived(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(`${this.basePath}/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  }
}

export const paymentsReceivedService = new PaymentsReceivedService();
