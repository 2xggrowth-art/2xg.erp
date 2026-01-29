import { supabaseAdmin as supabase } from '../config/supabase';

export interface InvoiceItem {
  item_id?: string;
  item_name: string;
  account: string;
  description?: string;
  quantity: number;
  unit_of_measurement: string;
  rate: number;
  amount: number;
}

export interface CreateInvoiceData {
  customer_id?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  invoice_number?: string;
  order_number?: string;
  invoice_date: string;
  due_date?: string;
  payment_terms?: string;
  salesperson_id?: string;
  salesperson_name?: string;
  subject?: string;
  status?: string;
  subtotal: number;
  discount_type?: 'percentage' | 'amount';
  discount_value?: number;
  discount_amount?: number;
  tax_amount?: number;
  tds_tcs_type?: 'TDS' | 'TCS';
  tds_tcs_rate?: number;
  tds_tcs_amount?: number;
  shipping_charges?: number;
  adjustment?: number;
  total_amount: number;
  customer_notes?: string;
  terms_and_conditions?: string;
  items: InvoiceItem[];
}

export class InvoicesService {
  /**
   * Validate if a string is a valid UUID
   */
  private isValidUUID(uuid: string | null | undefined): boolean {
    if (!uuid) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
  /**
   * Generate a new invoice number
   */
  async generateInvoiceNumber(): Promise<string> {
    try {
      // Get the latest invoice number
      const { data: latestInvoice, error } = await supabase
        .from('invoices')
        .select('invoice_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is okay
        throw error;
      }

      if (!latestInvoice) {
        return 'INV-0001';
      }

      // Extract number from invoice_number (e.g., "INV-0001" -> 1)
      const match = latestInvoice.invoice_number.match(/INV-(\d+)/);
      if (match) {
        const nextNumber = parseInt(match[1]) + 1;
        return `INV-${nextNumber.toString().padStart(4, '0')}`;
      }

      return 'INV-0001';
    } catch (error) {
      console.error('Error generating invoice number:', error);
      throw error;
    }
  }

  /**
   * Create a new invoice with items
   */
  async createInvoice(data: CreateInvoiceData) {
    try {
      console.log('InvoicesService: Creating invoice with data:', JSON.stringify(data, null, 2));

      // Generate invoice number if not provided
      if (!data.invoice_number) {
        data.invoice_number = await this.generateInvoiceNumber();
      }

      // Validate required fields
      if (!data.customer_name || data.customer_name.trim() === '') {
        throw new Error('Customer name is required');
      }

      if (!data.invoice_date) {
        throw new Error('Invoice date is required');
      }

      if (!data.items || data.items.length === 0) {
        throw new Error('At least one invoice item is required');
      }

      // Extract items from the data
      const { items, ...invoiceData } = data;

      // Get or create default organization_id
      // For now, we'll use a default UUID. In production, this should come from the authenticated user's organization
      const defaultOrgId = '00000000-0000-0000-0000-000000000001';

      // Validate and clean UUID fields - only use valid UUIDs, otherwise set to null
      const customerId = this.isValidUUID(invoiceData.customer_id) ? invoiceData.customer_id : null;
      const salespersonId = this.isValidUUID(invoiceData.salesperson_id) ? invoiceData.salesperson_id : null;

      // Clean up the invoice data - remove undefined/null values where appropriate
      const cleanInvoiceData: any = {
        organization_id: defaultOrgId,
        customer_id: customerId,
        customer_name: invoiceData.customer_name.trim(),
        customer_email: invoiceData.customer_email || null,
        customer_phone: invoiceData.customer_phone || null,
        invoice_number: invoiceData.invoice_number,
        order_number: invoiceData.order_number || null,
        invoice_date: invoiceData.invoice_date,
        due_date: invoiceData.due_date || null,
        payment_terms: invoiceData.payment_terms || 'due_on_receipt',
        salesperson_id: salespersonId,
        salesperson_name: invoiceData.salesperson_name || null,
        subject: invoiceData.subject || null,
        status: invoiceData.status || 'draft',
        subtotal: Number(invoiceData.subtotal) || 0,
        discount_type: invoiceData.discount_type || 'percentage',
        discount_value: Number(invoiceData.discount_value) || 0,
        discount_amount: Number(invoiceData.discount_amount) || 0,
        tax_amount: Number(invoiceData.tax_amount) || 0,
        tds_tcs_type: invoiceData.tds_tcs_type || null,
        tds_tcs_rate: invoiceData.tds_tcs_rate || null,
        tds_tcs_amount: Number(invoiceData.tds_tcs_amount) || 0,
        shipping_charges: Number(invoiceData.shipping_charges) || 0,
        adjustment: Number(invoiceData.adjustment) || 0,
        total_amount: Number(invoiceData.total_amount) || 0,
        balance_due: Number(invoiceData.total_amount) || 0,
        customer_notes: invoiceData.customer_notes || null,
        terms_and_conditions: invoiceData.terms_and_conditions || null
      };

      console.log('InvoicesService: Cleaned invoice data:', JSON.stringify(cleanInvoiceData, null, 2));

      // Insert the invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([cleanInvoiceData])
        .select()
        .single();

      if (invoiceError) {
        console.error('InvoicesService: Error inserting invoice:', invoiceError);
        throw new Error(`Failed to create invoice: ${invoiceError.message}. ${invoiceError.hint || ''}`);
      }

      console.log('InvoicesService: Invoice created successfully:', invoice.id);

      // Insert invoice items
      if (items && items.length > 0) {
        const itemsToInsert = items.map(item => {
          // Validate item_id is a proper UUID
          const itemId = this.isValidUUID(item.item_id) ? item.item_id : null;

          return {
            invoice_id: invoice.id,
            item_id: itemId,
            item_name: item.item_name || '',
            account: item.account || 'Sales',
            description: item.description || null,
            quantity: Number(item.quantity) || 0,
            unit_of_measurement: item.unit_of_measurement || 'pcs',
            rate: Number(item.rate) || 0,
            amount: Number(item.amount) || 0
          };
        });

        console.log('InvoicesService: Inserting invoice items:', JSON.stringify(itemsToInsert, null, 2));

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error('InvoicesService: Error inserting items:', itemsError);
          // Rollback: delete the invoice if items insertion fails
          await supabase.from('invoices').delete().eq('id', invoice.id);
          throw new Error(`Failed to create invoice items: ${itemsError.message}. ${itemsError.hint || ''}`);
        }

        console.log('InvoicesService: Invoice items created successfully');

        // Update stock for each item
        for (const item of items) {
          if (item.item_id && this.isValidUUID(item.item_id)) {
            try {
              // Get current stock
              const { data: currentItem, error: fetchError } = await supabase
                .from('items')
                .select('current_stock')
                .eq('id', item.item_id)
                .single();

              if (fetchError) {
                console.error(`InvoicesService: Error fetching stock for item ${item.item_id}:`, fetchError);
                continue;
              }

              if (currentItem) {
                const quantity = Number(item.quantity) || 0;
                const currentStock = Number(currentItem.current_stock) || 0;
                const newStock = currentStock - quantity;

                // Update stock
                const { error: updateError } = await supabase
                  .from('items')
                  .update({ current_stock: newStock })
                  .eq('id', item.item_id);

                if (updateError) {
                  console.error(`InvoicesService: Error updating stock for item ${item.item_id}:`, updateError);
                } else {
                  console.log(`InvoicesService: Updated stock for item ${item.item_id}: ${currentStock} -> ${newStock}`);
                }
              }
            } catch (error) {
              console.error(`InvoicesService: Exception updating stock for item ${item.item_id}:`, error);
            }
          }
        }
      }

      // Fetch the complete invoice with items
      const completeInvoice = await this.getInvoiceById(invoice.id);
      console.log('InvoicesService: Complete invoice fetched:', completeInvoice.id);
      return completeInvoice;
    } catch (error: any) {
      console.error('InvoicesService: Error creating invoice:', error);
      throw error;
    }
  }

  /**
   * Get all invoices with optional filters
   */
  async getAllInvoices(filters?: {
    status?: string;
    customer_id?: string;
    from_date?: string;
    to_date?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      let query = supabase
        .from('invoices')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }
      if (filters?.from_date) {
        query = query.gte('invoice_date', filters.from_date);
      }
      if (filters?.to_date) {
        query = query.lte('invoice_date', filters.to_date);
      }

      // Apply pagination
      const page = filters?.page || 1;
      const limit = filters?.limit || 50;
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        invoices: data || [],
        total: count || 0,
        page,
        limit
      };
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  }

  /**
   * Get a single invoice by ID with items
   */
  async getInvoiceById(id: string) {
    try {
      // Fetch invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

      if (invoiceError) {
        throw invoiceError;
      }

      // Fetch invoice items
      const { data: items, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id);

      if (itemsError) {
        throw itemsError;
      }

      return {
        ...invoice,
        items: items || []
      };
    } catch (error) {
      console.error('Error fetching invoice:', error);
      throw error;
    }
  }

  /**
   * Update an existing invoice
   */
  async updateInvoice(id: string, data: Partial<CreateInvoiceData>) {
    try {
      const { items, ...invoiceData } = data;

      // Update the invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .update(invoiceData)
        .eq('id', id)
        .select()
        .single();

      if (invoiceError) {
        throw invoiceError;
      }

      // If items are provided, update them
      if (items) {
        // Delete existing items
        await supabase.from('invoice_items').delete().eq('invoice_id', id);

        // Insert new items
        if (items.length > 0) {
          const itemsToInsert = items.map(item => ({
            ...item,
            invoice_id: id
          }));

          const { error: itemsError } = await supabase
            .from('invoice_items')
            .insert(itemsToInsert);

          if (itemsError) {
            throw itemsError;
          }
        }
      }

      // Fetch the complete invoice with items
      return await this.getInvoiceById(id);
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  /**
   * Delete an invoice
   */
  async deleteInvoice(id: string) {
    try {
      // Delete invoice items first (due to foreign key constraint)
      await supabase.from('invoice_items').delete().eq('invoice_id', id);

      // Delete the invoice
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }

  /**
   * Get invoice summary statistics
   */
  async getInvoiceSummary() {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('status, total_amount');

      if (error) {
        throw error;
      }

      const summary = {
        total_invoices: data.length,
        draft: 0,
        sent: 0,
        paid: 0,
        overdue: 0,
        total_amount: 0,
        paid_amount: 0,
        outstanding_amount: 0
      };

      data.forEach(invoice => {
        summary.total_amount += invoice.total_amount || 0;

        if (invoice.status === 'Draft') summary.draft++;
        else if (invoice.status === 'Sent') summary.sent++;
        else if (invoice.status === 'Paid') {
          summary.paid++;
          summary.paid_amount += invoice.total_amount || 0;
        } else if (invoice.status === 'Overdue') {
          summary.overdue++;
          summary.outstanding_amount += invoice.total_amount || 0;
        }
      });

      return summary;
    } catch (error) {
      console.error('Error fetching invoice summary:', error);
      throw error;
    }
  }
}
