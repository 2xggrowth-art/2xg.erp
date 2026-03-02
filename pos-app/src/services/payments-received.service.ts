import { ipc } from './ipc-client';

export interface PaymentReceived {
  id?: string;
  payment_number?: string;
  customer_id?: string;
  customer_name: string;
  payment_date: string;
  payment_mode: string;
  amount_received: number;
  reference_number?: string;
  invoice_id?: string;
  invoice_number?: string;
  notes?: string;
  created_at?: string;
}

class PaymentsReceivedService {
  async createPaymentReceived(paymentData: PaymentReceived): Promise<{ success: boolean; data: PaymentReceived; message: string }> {
    const result = await ipc().createInvoice({ ...paymentData, _type: 'payment' } as any);
    if (!result.success) throw new Error(result.error || 'Failed to create payment');
    return result;
  }
}

export const paymentsReceivedService = new PaymentsReceivedService();
