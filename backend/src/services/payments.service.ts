import { supabaseAdmin as supabase } from '../config/supabase';

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
}

export class PaymentsService {
  /**
   * Generate a new payment number
   */
  async generatePaymentNumber(): Promise<string> {
    try {
      const { data: latestPayment, error } = await supabase
        .from('payments_made')
        .select('payment_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!latestPayment) {
        return 'PAY-0001';
      }

      const match = latestPayment.payment_number.match(/PAY-(\d+)/);
      if (match) {
        const nextNumber = parseInt(match[1]) + 1;
        return `PAY-${nextNumber.toString().padStart(4, '0')}`;
      }

      return 'PAY-0001';
    } catch (error) {
      console.error('Error generating payment number:', error);
      throw error;
    }
  }

  /**
   * Create a new payment
   */
  async createPayment(data: CreatePaymentData) {
    try {
      const paymentNumber = await this.generatePaymentNumber();

      const { data: payment, error: paymentError } = await supabase
        .from('payments_made')
        .insert({
          organization_id: '00000000-0000-0000-0000-000000000000',
          payment_number: paymentNumber,
          vendor_id: data.vendor_id || null,
          vendor_name: data.vendor_name,
          payment_date: data.payment_date,
          payment_mode: data.payment_mode,
          reference_number: data.reference_number || null,
          amount: data.amount,
          bank_charges: data.bank_charges || 0,
          currency: data.currency || 'INR',
          exchange_rate: data.exchange_rate || 1,
          notes: data.notes || null,
          payment_account: data.payment_account || null,
          deposit_to: data.deposit_to || null,
          bill_id: data.bill_id || null,
          bill_number: data.bill_number || null,
          status: 'completed',
        })
        .select()
        .single();

      if (paymentError) {
        throw paymentError;
      }

      // Create payment allocations if provided
      if (data.allocations && data.allocations.length > 0) {
        const allocations = data.allocations.map((alloc) => ({
          payment_id: payment.id,
          bill_id: alloc.bill_id || null,
          bill_number: alloc.bill_number || null,
          amount_allocated: alloc.amount_allocated,
        }));

        const { error: allocError } = await supabase
          .from('payment_allocations')
          .insert(allocations);

        if (allocError) {
          await supabase.from('payments_made').delete().eq('id', payment.id);
          throw allocError;
        }
      }

      return payment;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  /**
   * Get all payments with optional filters
   */
  async getAllPayments(filters?: {
    status?: string;
    vendor_id?: string;
    from_date?: string;
    to_date?: string;
    search?: string;
  }) {
    try {
      let query = supabase
        .from('payments_made')
        .select('*')
        .order('payment_date', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.vendor_id) {
        query = query.eq('vendor_id', filters.vendor_id);
      }

      if (filters?.from_date) {
        query = query.gte('payment_date', filters.from_date);
      }

      if (filters?.to_date) {
        query = query.lte('payment_date', filters.to_date);
      }

      if (filters?.search) {
        query = query.or(
          `payment_number.ilike.%${filters.search}%,vendor_name.ilike.%${filters.search}%,reference_number.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  }

  /**
   * Get payment by ID with allocations
   */
  async getPaymentById(id: string) {
    try {
      const { data: payment, error: paymentError } = await supabase
        .from('payments_made')
        .select('*')
        .eq('id', id)
        .single();

      if (paymentError) throw paymentError;

      const { data: allocations, error: allocError } = await supabase
        .from('payment_allocations')
        .select('*')
        .eq('payment_id', id);

      if (allocError) throw allocError;

      return {
        ...payment,
        allocations: allocations || [],
      };
    } catch (error) {
      console.error('Error fetching payment:', error);
      throw error;
    }
  }

  /**
   * Update a payment
   */
  async updatePayment(id: string, data: Partial<CreatePaymentData>) {
    try {
      const { data: payment, error } = await supabase
        .from('payments_made')
        .update({
          vendor_id: data.vendor_id,
          vendor_name: data.vendor_name,
          payment_date: data.payment_date,
          payment_mode: data.payment_mode,
          reference_number: data.reference_number,
          amount: data.amount,
          bank_charges: data.bank_charges,
          currency: data.currency,
          exchange_rate: data.exchange_rate,
          notes: data.notes,
          payment_account: data.payment_account,
          deposit_to: data.deposit_to,
          bill_id: data.bill_id,
          bill_number: data.bill_number,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return payment;
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  }

  /**
   * Delete a payment
   */
  async deletePayment(id: string) {
    try {
      const { data, error } = await supabase
        .from('payments_made')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  }

  /**
   * Get payments summary
   */
  async getPaymentsSummary() {
    try {
      const { data: payments, error } = await supabase
        .from('payments_made')
        .select('amount, payment_mode, status, payment_date');

      if (error) throw error;

      const totalPaid = payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
      const paymentsByMode = payments?.reduce((acc: any, p) => {
        acc[p.payment_mode] = (acc[p.payment_mode] || 0) + parseFloat(p.amount);
        return acc;
      }, {});

      return {
        total_paid: totalPaid,
        payment_count: payments?.length || 0,
        by_payment_mode: paymentsByMode,
      };
    } catch (error) {
      console.error('Error fetching payments summary:', error);
      throw error;
    }
  }
}
