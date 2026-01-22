import apiClient from './api.client';

export interface InvoiceItem {
  item_id: string;
  item_name: string;
  account: string;
  description?: string;
  quantity: number;
  unit_of_measurement: string;
  rate: number;
  amount: number;
  stock_on_hand?: number;
}

export interface Invoice {
  id: string;
  customer_id?: string;
  customer_name: string;
  customer_email?: string;
  invoice_number: string;
  order_number?: string;
  invoice_date: string;
  due_date?: string;
  payment_terms?: string;
  salesperson_id?: string;
  salesperson_name?: string;
  location_id?: string;
  subject?: string;
  discount_type: 'percentage' | 'amount';
  discount_value: number;
  tds_tcs_type?: string;
  tds_tcs_rate?: number;
  adjustment: number;
  sub_total: number;
  total_amount: number;
  amount_paid?: number;
  balance_due?: number;
  status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  payment_status?: 'Paid' | 'Partially Paid' | 'Unpaid';
  customer_notes?: string;
  notes?: string;
  terms_and_conditions?: string;
  items: InvoiceItem[];
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceFilters {
  status?: string;
  customer_id?: string;
  from_date?: string;
  to_date?: string;
}

class InvoicesService {
  async getAllInvoices(filters?: InvoiceFilters) {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.customer_id) params.append('customer_id', filters.customer_id);
      if (filters?.from_date) params.append('from_date', filters.from_date);
      if (filters?.to_date) params.append('to_date', filters.to_date);

      const response = await apiClient.get(`/invoices?${params.toString()}`);

      // Return the response as-is since backend returns {success: true, data: {invoices: [...], total: 5}}
      return response.data;
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to fetch invoices'
      };
    }
  }

  async getInvoiceById(id: string) {
    try {
      const response = await apiClient.get(`/invoices/${id}`);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Invoice retrieved successfully'
      };
    } catch (error: any) {
      console.error('Error fetching invoice:', error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to fetch invoice'
      };
    }
  }

  async createInvoice(invoiceData: Partial<Invoice>) {
    try {
      console.log('InvoicesService: Sending request to create invoice');
      const response = await apiClient.post(`/invoices`, invoiceData);
      console.log('InvoicesService: Invoice created successfully', response.data);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Invoice created successfully'
      };
    } catch (error: any) {
      console.error('InvoicesService: Error creating invoice:', error);
      console.error('InvoicesService: Error response:', error.response?.data);

      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.message ||
                          error.message ||
                          'Failed to create invoice';

      const errorDetails = error.response?.data?.details;
      const fullMessage = errorDetails ? `${errorMessage}\n${errorDetails}` : errorMessage;

      throw new Error(fullMessage);
    }
  }

  async updateInvoice(id: string, invoiceData: Partial<Invoice>) {
    try {
      const response = await apiClient.put(`/invoices/${id}`, invoiceData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Invoice updated successfully'
      };
    } catch (error: any) {
      console.error('Error updating invoice:', error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to update invoice'
      };
    }
  }

  async deleteInvoice(id: string) {
    try {
      await apiClient.delete(`/invoices/${id}`);
      return {
        success: true,
        message: 'Invoice deleted successfully'
      };
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete invoice'
      };
    }
  }

  async generateInvoiceNumber() {
    try {
      const response = await apiClient.get(`/invoices/generate-number`);
      return {
        success: true,
        data: response.data,
        message: 'Invoice number generated successfully'
      };
    } catch (error: any) {
      console.error('Error generating invoice number:', error);
      return {
        success: false,
        data: { invoice_number: `INV-${Date.now()}` },
        message: 'Using fallback invoice number'
      };
    }
  }

  async sendInvoice(id: string, emailData?: { to?: string; subject?: string; body?: string }) {
    try {
      const response = await apiClient.post(`/invoices/${id}/send`, emailData);
      return {
        success: true,
        data: response.data,
        message: 'Invoice sent successfully'
      };
    } catch (error: any) {
      console.error('Error sending invoice:', error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to send invoice'
      };
    }
  }
}

export const invoicesService = new InvoicesService();
