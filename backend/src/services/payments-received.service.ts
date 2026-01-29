import { supabaseAdmin as supabase } from '../config/supabase';

export interface CreatePaymentReceivedData {
  customer_id?: string;
  customer_name: string;
  payment_number?: string;
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
}

export class PaymentsReceivedService {
  /**
   * Validate if a string is a valid UUID
   */
  private isValidUUID(uuid: string | null | undefined): boolean {
    if (!uuid) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Generate a new payment number
   */
  async generatePaymentNumber(): Promise<string> {
    try {
      const { data: latestPayment, error } = await supabase
        .from('payments_received')
        .select('payment_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!latestPayment) {
        return 'PAY-00001';
      }

      const match = latestPayment.payment_number.match(/PAY-(\d+)/);
      if (match) {
        const nextNumber = parseInt(match[1]) + 1;
        return `PAY-${nextNumber.toString().padStart(5, '0')}`;
      }

      return 'PAY-00001';
    } catch (error) {
      console.error('Error generating payment number:', error);
      throw error;
    }
  }

  /**
   * Create a new payment received record
   */
  async createPaymentReceived(data: CreatePaymentReceivedData) {
    try {
      console.log('PaymentsReceivedService: Creating payment with data:', JSON.stringify(data, null, 2));

      if (!data.payment_number) {
        data.payment_number = await this.generatePaymentNumber();
      }

      if (!data.customer_name || data.customer_name.trim() === '') {
        throw new Error('Customer name is required');
      }

      if (!data.payment_date) {
        throw new Error('Payment date is required');
      }

      if (!data.amount_received || data.amount_received <= 0) {
        throw new Error('Amount received must be greater than zero');
      }

      const defaultOrgId = '00000000-0000-0000-0000-000000000001';
      const customerId = this.isValidUUID(data.customer_id) ? data.customer_id : null;
      const invoiceId = this.isValidUUID(data.invoice_id) ? data.invoice_id : null;

      const cleanPaymentData: any = {
        organization_id: defaultOrgId,
        customer_id: customerId,
        customer_name: data.customer_name.trim(),
        payment_number: data.payment_number,
        reference_number: data.reference_number || null,
        payment_date: data.payment_date,
        payment_mode: data.payment_mode || 'Cash',
        amount_received: Number(data.amount_received) || 0,
        bank_charges: Number(data.bank_charges) || 0,
        deposit_to: data.deposit_to || null,
        location: data.location || null,
        invoice_id: invoiceId,
        invoice_number: data.invoice_number || null,
        amount_used: Number(data.amount_used) || 0,
        amount_excess: Number(data.amount_excess) || 0,
        status: data.status || 'recorded',
        notes: data.notes || null
      };

      console.log('PaymentsReceivedService: Cleaned payment data:', JSON.stringify(cleanPaymentData, null, 2));

      const { data: payment, error: paymentError } = await supabase
        .from('payments_received')
        .insert([cleanPaymentData])
        .select()
        .single();

      if (paymentError) {
        console.error('PaymentsReceivedService: Error inserting payment:', paymentError);
        throw new Error(`Failed to create payment: ${paymentError.message}. ${paymentError.hint || ''}`);
      }

      console.log('PaymentsReceivedService: Payment created successfully:', payment.id);

      // Update linked invoice if exists
      if (invoiceId) {
        try {
          const { data: invoice, error: invoiceFetchError } = await supabase
            .from('invoices')
            .select('start_total_amount:total_amount, start_amount_paid:amount_paid')
            .eq('id', invoiceId)
            .single();

          if (!invoiceFetchError && invoice) {
            const paymentAmount = Number(data.amount_received) || 0;
            // We assume amount_used is what reduces the balance. If amount_used is 0/null, we use amount_received
            const amountToApply = Number(data.amount_used) > 0 ? Number(data.amount_used) : paymentAmount;

            const currentPaid = Number(invoice.start_amount_paid) || 0;
            const totalAmount = Number(invoice.start_total_amount) || 0;

            const newPaid = currentPaid + amountToApply;
            const newBalance = Math.max(0, totalAmount - newPaid);

            let newStatus = 'partial';
            if (newBalance <= 0) {
              newStatus = 'paid';
            } else if (newPaid > 0) {
              newStatus = 'partial'; // backend uses 'partial' or 'partially_paid'? front expects 'partial' based on typical logic, check getStatusConfig if needed.
            }

            // Update invoice
            await supabase
              .from('invoices')
              .update({
                amount_paid: newPaid,
                balance_due: newBalance,
                status: newStatus
              })
              .eq('id', invoiceId);

            console.log(`PaymentsReceivedService: Updated invoice ${invoiceId} - Status: ${newStatus}, Balance: ${newBalance}`);
          }
        } catch (updateError) {
          console.error('PaymentsReceivedService: Error updating linked invoice:', updateError);
          // Don't fail the payment creation just because invoice update failed, but log it
        }
      }

      return payment;
    } catch (error: any) {
      console.error('PaymentsReceivedService: Error creating payment:', error);
      throw error;
    }
  }

  /**
   * Get all payments received with optional filters
   */
  async getAllPaymentsReceived(filters?: {
    customer_id?: string;
    payment_mode?: string;
    from_date?: string;
    to_date?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      let query = supabase
        .from('payments_received')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filters?.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }
      if (filters?.payment_mode) {
        query = query.eq('payment_mode', filters.payment_mode);
      }
      if (filters?.from_date) {
        query = query.gte('payment_date', filters.from_date);
      }
      if (filters?.to_date) {
        query = query.lte('payment_date', filters.to_date);
      }

      const page = filters?.page || 1;
      const limit = filters?.limit || 50;
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        payments: data || [],
        total: count || 0,
        page,
        limit
      };
    } catch (error) {
      console.error('Error fetching payments received:', error);
      throw error;
    }
  }

  /**
   * Get a single payment by ID
   */
  async getPaymentReceivedById(id: string) {
    try {
      const { data: payment, error } = await supabase
        .from('payments_received')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return payment;
    } catch (error) {
      console.error('Error fetching payment:', error);
      throw error;
    }
  }

  /**
   * Update an existing payment
   */
  async updatePaymentReceived(id: string, data: Partial<CreatePaymentReceivedData>) {
    try {
      const { data: payment, error } = await supabase
        .from('payments_received')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return payment;
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  }

  /**
   * Delete a payment
   */
  async deletePaymentReceived(id: string) {
    try {
      const { error } = await supabase
        .from('payments_received')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  }
}
