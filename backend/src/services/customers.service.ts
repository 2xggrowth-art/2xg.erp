import { supabaseAdmin } from '../config/supabase';

// Indian tax ID format validators
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

function validateGSTIN(gstin: string): boolean {
  return GSTIN_REGEX.test(gstin.toUpperCase());
}

function validatePAN(pan: string): boolean {
  return PAN_REGEX.test(pan.toUpperCase());
}

export class CustomersService {
  /**
   * Get all customers with optional filters
   */
  async getAllCustomers(filters?: {
    search?: string;
  }) {
    let query = supabaseAdmin
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.search) {
      query = query.or(`customer_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get customers summary
   */
  async getCustomersSummary() {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .select('opening_balance');

    if (error) throw error;

    const totalCustomers = data.length;
    const activeCustomers = data.length; // All customers are considered active (no is_active column)
    const totalReceivables = data.reduce((sum, customer) => sum + (customer.opening_balance || 0), 0);

    return {
      totalCustomers,
      activeCustomers,
      totalReceivables,
      currency: 'INR'
    };
  }

  /**
   * Create a new customer
   */
  async createCustomer(customerData: any) {
    // Build customer_name from available fields
    let customerName = customerData.display_name || customerData.customer_name;
    if (!customerName) {
      if (customerData.company_name) {
        customerName = customerData.company_name;
      } else if (customerData.first_name || customerData.last_name) {
        customerName = `${customerData.first_name || ''} ${customerData.last_name || ''}`.trim();
      }
    }

    if (!customerName) {
      throw new Error('Customer name is required');
    }

    // Validate GSTIN format if provided
    if (customerData.gstin && !validateGSTIN(customerData.gstin)) {
      throw new Error('Invalid GSTIN format. Expected: 22AAAAA0000A1Z5 (15 characters)');
    }

    // Validate PAN format if provided
    if (customerData.pan && !validatePAN(customerData.pan)) {
      throw new Error('Invalid PAN format. Expected: ABCDE1234F (10 characters)');
    }

    // Build billing address from address fields if provided
    let billingAddress = customerData.billing_address || customerData.address || '';
    if (!billingAddress && (customerData.city || customerData.state || customerData.country)) {
      billingAddress = [customerData.city, customerData.state, customerData.country, customerData.postal_code]
        .filter(Boolean)
        .join(', ');
    }

    // Extract state code from GSTIN (first 2 digits)
    let stateCode = customerData.state_code || null;
    if (!stateCode && customerData.gstin && customerData.gstin.length >= 2) {
      stateCode = customerData.gstin.substring(0, 2);
    }

    // Create customer object with columns that exist in DB (including GST columns from migration 037)
    const newCustomer: any = {
      customer_name: customerName,
      company_name: customerData.company_name || null,
      email: customerData.email || null,
      phone: customerData.phone || customerData.mobile || customerData.work_phone || null,
      website: customerData.website || null,
      billing_address: billingAddress || null,
      shipping_address: customerData.shipping_address || null,
      gstin: customerData.gstin || null,
      pan: customerData.pan || null,
      gst_treatment: customerData.gst_treatment || 'consumer',
      state_code: stateCode,
      payment_terms: customerData.payment_terms || 'Net 30',
      opening_balance: customerData.opening_balance ? parseFloat(customerData.opening_balance) : 0,
    };

    const { data, error } = await supabaseAdmin
      .from('customers')
      .insert(newCustomer)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update an existing customer
   */
  async updateCustomer(id: string, customerData: any) {
    // Validate GSTIN format if provided
    if (customerData.gstin && !validateGSTIN(customerData.gstin)) {
      throw new Error('Invalid GSTIN format. Expected: 22AAAAA0000A1Z5 (15 characters)');
    }

    // Validate PAN format if provided
    if (customerData.pan && !validatePAN(customerData.pan)) {
      throw new Error('Invalid PAN format. Expected: ABCDE1234F (10 characters)');
    }

    // Test #25: Warn if state changes on customer with existing invoices
    if (customerData.state_code) {
      const { count } = await supabaseAdmin
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', id);

      if (count && count > 0) {
        console.warn(`CustomersService: Customer ${id} state changed to "${customerData.state_code}" — has ${count} existing invoices with potentially different tax type (IGST vs CGST/SGST)`);
      }
    }

    const updateData: any = {};

    // Map display_name to customer_name
    if (customerData.display_name) updateData.customer_name = customerData.display_name;
    if (customerData.customer_name) updateData.customer_name = customerData.customer_name;
    if (customerData.company_name !== undefined) updateData.company_name = customerData.company_name;
    if (customerData.email !== undefined) updateData.email = customerData.email;
    if (customerData.phone !== undefined) updateData.phone = customerData.phone;
    if (customerData.mobile !== undefined) updateData.phone = customerData.mobile;
    if (customerData.website !== undefined) updateData.website = customerData.website;
    if (customerData.billing_address !== undefined) updateData.billing_address = customerData.billing_address;
    if (customerData.address !== undefined) updateData.billing_address = customerData.address;
    if (customerData.shipping_address !== undefined) updateData.shipping_address = customerData.shipping_address;
    if (customerData.gstin !== undefined) updateData.gstin = customerData.gstin;
    if (customerData.pan !== undefined) updateData.pan = customerData.pan;
    if (customerData.gst_treatment !== undefined) updateData.gst_treatment = customerData.gst_treatment;
    if (customerData.state_code !== undefined) updateData.state_code = customerData.state_code;
    if (customerData.payment_terms !== undefined) updateData.payment_terms = customerData.payment_terms;
    if (customerData.opening_balance !== undefined) updateData.opening_balance = parseFloat(customerData.opening_balance);

    if (Object.keys(updateData).length === 0) {
      throw new Error('No valid fields to update');
    }

    const { data, error } = await supabaseAdmin
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get customer outstanding balance
   * Sums balance_due from invoices where customer_id matches and balance_due > 0
   */
  async getCustomerOutstanding(customerId: string) {
    const { data, error } = await supabaseAdmin
      .from('invoices')
      .select('balance_due')
      .eq('customer_id', customerId)
      .gt('balance_due', 0);

    if (error) throw error;

    const invoices = data || [];
    const outstanding = invoices.reduce((sum, inv) => sum + (Number(inv.balance_due) || 0), 0);

    return {
      outstanding: Math.round(outstanding * 100) / 100,
      unpaid_invoices: invoices.length,
    };
  }

  /**
   * Delete a customer (hard delete since there's no is_active column)
   * Test #57: Block delete if customer has invoices or payments
   */
  async deleteCustomer(id: string) {
    // Test #57: Check for linked invoices
    const { data: invoices } = await supabaseAdmin
      .from('invoices')
      .select('id')
      .eq('customer_id', id)
      .limit(1);

    if (invoices && invoices.length > 0) {
      const { count } = await supabaseAdmin
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', id);

      throw new Error(`Cannot delete: customer has ${count || 'some'} invoice(s). Deactivate the customer instead.`);
    }

    // Check for linked payments
    const { data: payments } = await supabaseAdmin
      .from('payments_received')
      .select('id')
      .eq('customer_id', id)
      .limit(1);

    if (payments && payments.length > 0) {
      throw new Error('Cannot delete: customer has payment records. Deactivate the customer instead.');
    }

    const { data, error } = await supabaseAdmin
      .from('customers')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
