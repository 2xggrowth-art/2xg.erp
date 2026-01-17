import { supabaseAdmin } from '../config/supabase';

export class CustomersService {
  /**
   * Get all customers with optional filters
   */
  async getAllCustomers(filters?: {
    isActive?: boolean;
    search?: string;
  }) {
    let query = supabaseAdmin
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    if (filters?.search) {
      query = query.or(`customer_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
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
      .select('current_balance, is_active');

    if (error) throw error;

    const totalCustomers = data.length;
    const activeCustomers = data.filter(customer => customer.is_active).length;
    const totalReceivables = data.reduce((sum, customer) => sum + (customer.current_balance || 0), 0);

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
    // Get organization_id (default to first organization)
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .limit(1)
      .single();

    // Build full name for customer_name
    let customerName = customerData.display_name;
    if (!customerName) {
      if (customerData.company_name) {
        customerName = customerData.company_name;
      } else if (customerData.first_name || customerData.last_name) {
        customerName = `${customerData.first_name || ''} ${customerData.last_name || ''}`.trim();
      }
    }

    // Build contact_person with all info
    let contactPerson = '';
    if (customerData.salutation || customerData.first_name || customerData.last_name) {
      contactPerson = `${customerData.salutation || ''} ${customerData.first_name || ''} ${customerData.last_name || ''}`.trim();
    }
    if (customerData.company_name) {
      contactPerson = contactPerson ? `${contactPerson} (${customerData.company_name})` : customerData.company_name;
    }

    // Store additional info in notes field
    let notesText = customerData.notes || '';
    if (customerData.pan) {
      notesText += `\nPAN: ${customerData.pan}`;
    }
    if (customerData.currency) {
      notesText += `\nCurrency: ${customerData.currency}`;
    }
    if (customerData.work_phone) {
      notesText += `\nWork Phone: ${customerData.work_phone}`;
    }
    notesText = notesText.trim();

    // Create customer object
    const newCustomer = {
      organization_id: org?.id,
      customer_name: customerName,
      company_name: customerData.company_name || null,
      contact_person: contactPerson || null,
      email: customerData.email || null,
      phone: customerData.mobile || customerData.work_phone || null,
      mobile: customerData.mobile || null,
      work_phone: customerData.work_phone || null,
      address: customerData.address || null,
      city: customerData.city || null,
      state: customerData.state || null,
      country: customerData.country || null,
      postal_code: customerData.postal_code || null,
      gstin: customerData.gstin || null,
      pan: customerData.pan || null,
      tax_id: customerData.pan || null,
      currency: customerData.currency ? customerData.currency.split('-')[0].trim() : 'INR',
      payment_terms: customerData.payment_terms || 'Due on Receipt',
      credit_limit: customerData.credit_limit ? parseFloat(customerData.credit_limit) : null,
      current_balance: 0,
      is_active: true,
      notes: notesText || null
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
    const updateData: any = {};

    if (customerData.display_name) updateData.customer_name = customerData.display_name;
    if (customerData.company_name !== undefined) updateData.company_name = customerData.company_name;
    if (customerData.email !== undefined) updateData.email = customerData.email;
    if (customerData.mobile !== undefined) updateData.mobile = customerData.mobile;
    if (customerData.work_phone !== undefined) updateData.work_phone = customerData.work_phone;
    if (customerData.mobile !== undefined || customerData.work_phone !== undefined) {
      updateData.phone = customerData.mobile || customerData.work_phone;
    }
    if (customerData.address !== undefined) updateData.address = customerData.address;
    if (customerData.city !== undefined) updateData.city = customerData.city;
    if (customerData.state !== undefined) updateData.state = customerData.state;
    if (customerData.country !== undefined) updateData.country = customerData.country;
    if (customerData.postal_code !== undefined) updateData.postal_code = customerData.postal_code;
    if (customerData.gstin !== undefined) updateData.gstin = customerData.gstin;
    if (customerData.pan !== undefined) {
      updateData.pan = customerData.pan;
      updateData.tax_id = customerData.pan;
    }
    if (customerData.payment_terms !== undefined) updateData.payment_terms = customerData.payment_terms;
    if (customerData.notes !== undefined) updateData.notes = customerData.notes;

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
   * Delete a customer (soft delete by marking as inactive)
   */
  async deleteCustomer(id: string) {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

