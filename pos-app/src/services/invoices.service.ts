import { ipc } from './ipc-client';

export interface InvoiceItem {
  item_id: string;
  item_name: string;
  quantity: number;
  rate: number;
  amount: number;
  unit_of_measurement?: string;
  hsn_code?: string;
  bin_location_id?: string;
  bin_allocations?: Array<{ bin_location_id: string; quantity: number }>;
}

export interface Invoice {
  id: string;
  customer_id?: string | null;
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  invoice_number: string;
  invoice_date: string;
  due_date?: string | null;
  payment_terms?: string | null;
  salesperson_id?: string | null;
  salesperson_name?: string | null;
  subject?: string | null;
  discount_type: 'percentage' | 'amount';
  discount_value: number;
  discount_amount?: number;
  sub_total: number;
  subtotal?: number;
  total_amount: number;
  amount_paid?: number;
  balance_due?: number;
  status: string;
  payment_status?: string;
  pos_session_id?: string | null;
  items: InvoiceItem[];
  customer_notes?: string | null;
  created_at?: string;
  order_number?: string | null;
  [key: string]: any;
}

export interface InvoiceFilters {
  status?: string;
  customer_id?: string;
  from_date?: string;
  to_date?: string;
  pos_session_id?: string;
}

class InvoicesService {
  async getAllInvoices(filters?: InvoiceFilters) {
    const result = await ipc().getAllInvoices(filters);
    return {
      success: result.success,
      data: result.success ? { invoices: result.data, total: result.data?.length || 0 } : null,
      message: result.error || '',
    };
  }

  async getInvoiceById(id: string) {
    const result = await ipc().getInvoiceById(id);
    return {
      success: result.success,
      data: result.data,
    };
  }

  async createInvoice(invoiceData: Partial<Invoice>) {
    const result = await ipc().createInvoice(invoiceData);
    if (!result.success) {
      throw new Error(result.error || 'Failed to create invoice');
    }
    return {
      success: true,
      data: result.data,
      message: 'Invoice created successfully',
    };
  }

  async getInvoicesBySession(sessionId: string) {
    const result = await ipc().getInvoicesBySession(sessionId);
    return {
      success: result.success,
      data: result.success ? { invoices: result.data, total: result.data?.length || 0 } : null,
    };
  }
}

export const invoicesService = new InvoicesService();
