import { supabaseAdmin as supabase } from '../config/supabase';
import { BatchesService } from './batches.service';
import { OrgSettingsService } from './org-settings.service';

const batchesService = new BatchesService();
const orgSettingsService = new OrgSettingsService();

export interface BinAllocation {
  bin_location_id: string;
  bin_code: string;
  warehouse: string;
  quantity: number;
}

export interface InvoiceItem {
  item_id?: string;
  item_name: string;
  account: string;
  description?: string;
  quantity: number;
  unit_of_measurement: string;
  rate: number;
  amount: number;
  bin_allocations?: BinAllocation[];
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
  cgst_rate?: number;
  cgst_amount?: number;
  sgst_rate?: number;
  sgst_amount?: number;
  igst_rate?: number;
  igst_amount?: number;
  cess_amount?: number;
  place_of_supply?: string;
  supply_type?: string;
  reverse_charge?: boolean;
  customer_gstin?: string;
  tds_tcs_type?: 'TDS' | 'TCS';
  tds_tcs_rate?: number;
  tds_tcs_amount?: number;
  shipping_charges?: number;
  adjustment?: number;
  total_amount: number;
  amount_paid?: number;
  balance_due?: number;
  payment_status?: string;
  customer_notes?: string;
  terms_and_conditions?: string;
  pos_session_id?: string;
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
   * Generate a new invoice number using org_settings.invoice_prefix
   */
  async generateInvoiceNumber(orgId?: string): Promise<string> {
    try {
      // Get invoice prefix from org settings (fallback to 'INV-')
      let prefix = 'INV-';
      const settings = await orgSettingsService.getOrgSettingsWithFallback(orgId);
      if (settings?.invoice_prefix) {
        prefix = settings.invoice_prefix;
      }

      // Fetch recent invoices to find the highest number with this prefix
      const { data, error } = await supabase
        .from('invoices')
        .select('invoice_number')
        .not('invoice_number', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (!data || data.length === 0) {
        return `${prefix}0001`;
      }

      // Find the highest invoice number matching prefix+NNNN format
      const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const prefixRegex = new RegExp(`^${escapedPrefix}(\\d+)$`);
      let maxNum = 0;
      for (const inv of data) {
        const match = inv.invoice_number?.match(prefixRegex);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxNum) maxNum = num;
        }
      }

      const nextNum = maxNum + 1;
      return `${prefix}${nextNum.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      throw error;
    }
  }

  /**
   * Create a new invoice with items
   */
  async createInvoice(data: CreateInvoiceData, organizationId?: string) {
    try {
      console.log('InvoicesService: Creating invoice with data:', JSON.stringify(data, null, 2));

      // Generate invoice number if not provided
      if (!data.invoice_number) {
        data.invoice_number = await this.generateInvoiceNumber(organizationId);
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

      // === NEW VALIDATION GUARDS ===

      // Test #18: Duplicate invoice number check
      const { data: existingInv } = await supabase
        .from('invoices')
        .select('id')
        .eq('invoice_number', data.invoice_number)
        .limit(1);

      if (existingInv && existingInv.length > 0) {
        throw new Error(`Invoice number "${data.invoice_number}" already exists. Please use a different number.`);
      }

      // Test #29: Validate item rates and quantities are positive
      for (const item of data.items) {
        if (Number(item.rate) < 0) {
          throw new Error(`Item "${item.item_name}" has negative rate (₹${item.rate}). Rate must be zero or positive.`);
        }
        if (Number(item.quantity) <= 0) {
          throw new Error(`Item "${item.item_name}" has invalid quantity (${item.quantity}). Quantity must be greater than zero.`);
        }
      }

      // Test #40: Discount cannot exceed 100%
      if (data.discount_type === 'percentage' && Number(data.discount_value) > 100) {
        throw new Error('Discount percentage cannot exceed 100%');
      }

      // Test #17: Full discount warning (discount >= subtotal)
      if (Number(data.discount_amount) > 0 && Number(data.discount_amount) >= Number(data.subtotal)) {
        console.warn(`InvoicesService: Full discount applied on ${data.invoice_number} — total is ₹0`);
      }

      // Test #22: Future date warning (logged, not blocking)
      const invoiceDate = new Date(data.invoice_date);
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      if (invoiceDate > sevenDaysFromNow) {
        console.warn(`InvoicesService: Invoice ${data.invoice_number} has future date: ${data.invoice_date}`);
      }

      // Test #35: Verify all item_ids still exist in the database
      for (const item of data.items) {
        if (item.item_id && this.isValidUUID(item.item_id)) {
          const { data: exists } = await supabase
            .from('items')
            .select('id')
            .eq('id', item.item_id)
            .limit(1);

          if (!exists || exists.length === 0) {
            throw new Error(`Item "${item.item_name}" no longer exists in the system. It may have been deleted.`);
          }
        }
      }

      // Test #20: Large invoice warning (50+ items)
      if (data.items.length > 40) {
        console.warn(`InvoicesService: Large invoice ${data.invoice_number} has ${data.items.length} items — PDF may need multiple pages`);
      }

      // Test #28: Decimal quantity warning for physical items
      for (const item of data.items) {
        if (Number(item.quantity) !== Math.floor(Number(item.quantity))) {
          console.warn(`InvoicesService: Item "${item.item_name}" has decimal quantity (${item.quantity}) — is this correct?`);
        }
      }

      // Test #34: Validate amount_paid does not exceed total_amount
      if (data.amount_paid !== undefined && Number(data.amount_paid) > Number(data.total_amount)) {
        throw new Error(`Amount paid (₹${data.amount_paid}) cannot exceed invoice total (₹${data.total_amount}).`);
      }

      // Test #50: Filter out ₹0 split payment entries and recalculate
      if (data.amount_paid !== undefined) {
        const amountPaid = Math.round(Number(data.amount_paid) * 100) / 100;
        const totalAmount = Math.round(Number(data.total_amount) * 100) / 100;
        data.amount_paid = amountPaid;
        data.balance_due = Math.round((totalAmount - amountPaid) * 100) / 100;
        if (amountPaid >= totalAmount && totalAmount > 0) {
          data.payment_status = 'paid';
        } else if (amountPaid > 0) {
          data.payment_status = 'partial';
        }
      }

      // Test #38/#41: Credit sale requires customer name
      if (data.status === 'credit' || (data as any).payment_mode === 'Credit') {
        if (!data.customer_name || data.customer_name.trim() === '' || data.customer_name.trim() === 'Walk-in Customer') {
          throw new Error('Customer name is required for credit sales. Cash sales can use "Walk-in Customer".');
        }
      }

      // Test #39: POS session validation — verify session is active
      if (data.pos_session_id) {
        const { data: session } = await supabase
          .from('pos_sessions')
          .select('id, status')
          .eq('id', data.pos_session_id)
          .single();

        if (!session) {
          throw new Error('POS session not found. Please start a new session.');
        }
        if (session.status !== 'In-Progress') {
          throw new Error(`POS session is "${session.status}". Only active sessions can create sales.`);
        }
      }

      // Test #93: Missing HSN warning when GST is applied
      if (Number(data.tax_amount) > 0 || Number(data.cgst_amount) > 0 || Number(data.sgst_amount) > 0) {
        for (const item of data.items) {
          if (!(item as any).hsn_code) {
            console.warn(`InvoicesService: Item "${item.item_name}" has no HSN code but GST is applied — GSTR-1 may be incomplete`);
          }
        }
      }

      // Extract items from the data
      const { items, ...invoiceData } = data;

      // Get organization_id from parameter or look up
      let defaultOrgId = organizationId;
      if (!defaultOrgId) {
        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .limit(1)
          .single();
        defaultOrgId = org?.id || '00000000-0000-0000-0000-000000000001';
      }

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
        cgst_rate: Number(invoiceData.cgst_rate) || 0,
        cgst_amount: Number(invoiceData.cgst_amount) || 0,
        sgst_rate: Number(invoiceData.sgst_rate) || 0,
        sgst_amount: Number(invoiceData.sgst_amount) || 0,
        igst_rate: Number(invoiceData.igst_rate) || 0,
        igst_amount: Number(invoiceData.igst_amount) || 0,
        cess_amount: Number(invoiceData.cess_amount) || 0,
        place_of_supply: invoiceData.place_of_supply || null,
        supply_type: invoiceData.supply_type || 'intra_state',
        reverse_charge: invoiceData.reverse_charge || false,
        customer_gstin: invoiceData.customer_gstin || null,
        tds_tcs_type: invoiceData.tds_tcs_type || null,
        tds_tcs_rate: invoiceData.tds_tcs_rate || null,
        tds_tcs_amount: Number(invoiceData.tds_tcs_amount) || 0,
        shipping_charges: Number(invoiceData.shipping_charges) || 0,
        adjustment: Number(invoiceData.adjustment) || 0,
        total_amount: Number(invoiceData.total_amount) || 0,
        balance_due: invoiceData.balance_due !== undefined ? Number(invoiceData.balance_due) : Number(invoiceData.total_amount) || 0,
        customer_notes: invoiceData.customer_notes || null,
        terms_and_conditions: invoiceData.terms_and_conditions || null,
        pos_session_id: invoiceData.pos_session_id || null
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
      const binAllocationWarnings: string[] = [];
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
            amount: Number(item.amount) || 0,
            hsn_code: (item as any).hsn_code || null,
            tax_rate: Number((item as any).tax_rate) || 0,
            cgst_rate: Number((item as any).cgst_rate) || 0,
            cgst_amount: Number((item as any).cgst_amount) || 0,
            sgst_rate: Number((item as any).sgst_rate) || 0,
            sgst_amount: Number((item as any).sgst_amount) || 0,
            igst_rate: Number((item as any).igst_rate) || 0,
            igst_amount: Number((item as any).igst_amount) || 0,
          };
        });

        console.log('InvoicesService: Inserting invoice items:', JSON.stringify(itemsToInsert, null, 2));

        const { data: insertedItems, error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsToInsert)
          .select();

        if (itemsError) {
          console.error('InvoicesService: Error inserting items:', itemsError);
          // Rollback: delete the invoice if items insertion fails
          await supabase.from('invoices').delete().eq('id', invoice.id);
          throw new Error(`Failed to create invoice items: ${itemsError.message}. ${itemsError.hint || ''}`);
        }

        console.log('InvoicesService: Invoice items created successfully');

        // Insert bin allocations if provided (for sales/invoices - tracking which bins stock is sold from)
        if (insertedItems && insertedItems.length > 0) {
          for (const item of items) {
            if (item.bin_allocations && item.bin_allocations.length > 0) {
              // Match inserted item by item_name to avoid index correlation issues
              const matchedItem = insertedItems.find(
                (inserted: any) => inserted.item_name === item.item_name && inserted.item_id === (item.item_id || null)
              );

              if (!matchedItem) {
                binAllocationWarnings.push(`Could not match inserted item for "${item.item_name}" — bin allocations skipped`);
                continue;
              }

              const binAllocations = item.bin_allocations.map((allocation) => ({
                invoice_item_id: matchedItem.id,
                bin_location_id: allocation.bin_location_id,
                quantity: allocation.quantity,
              }));

              const { error: binError } = await supabase
                .from('invoice_item_bin_allocations')
                .insert(binAllocations);

              if (binError) {
                console.error('Error inserting invoice bin allocations:', binError);
                binAllocationWarnings.push(`Bin allocation failed for "${item.item_name}": ${binError.message}`);
              }
            }
          }
        }

        // Update stock atomically for each item
        for (const item of items) {
          if (item.item_id && this.isValidUUID(item.item_id)) {
            try {
              const quantity = Number(item.quantity) || 0;
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
                const currentStock = Number(currentItem.current_stock) || 0;
                const newStock = currentStock - quantity;

                // Use .eq on both id AND current_stock to ensure atomic update
                const { data: updated, error: updateError } = await supabase
                  .from('items')
                  .update({ current_stock: newStock })
                  .eq('id', item.item_id)
                  .eq('current_stock', currentStock)
                  .select('current_stock')
                  .single();

                if (updateError) {
                  // Race condition detected - retry once
                  console.warn(`InvoicesService: Stock race condition for item ${item.item_id}, retrying...`);
                  const { data: retryItem } = await supabase
                    .from('items')
                    .select('current_stock')
                    .eq('id', item.item_id)
                    .single();

                  if (retryItem) {
                    const retryStock = Number(retryItem.current_stock) || 0;
                    await supabase
                      .from('items')
                      .update({ current_stock: retryStock - quantity })
                      .eq('id', item.item_id);
                  }
                } else {
                  console.log(`InvoicesService: Updated stock for item ${item.item_id}: ${currentStock} -> ${newStock}`);
                }
              }
            } catch (error) {
              console.error(`InvoicesService: Exception updating stock for item ${item.item_id}:`, error);
            }
          }
        }

        // Deduct from batches for batch-tracked items
        for (const item of items) {
          if (item.item_id && this.isValidUUID(item.item_id)) {
            try {
              const { data: itemRecord } = await supabase
                .from('items')
                .select('advanced_tracking_type')
                .eq('id', item.item_id)
                .single();

              if (itemRecord?.advanced_tracking_type === 'batches') {
                const matchedItem = insertedItems?.find(
                  (inserted: any) => inserted.item_name === item.item_name && inserted.item_id === (item.item_id || null)
                );

                await batchesService.deductFromBatches({
                  item_id: item.item_id,
                  quantity: Number(item.quantity),
                  invoice_id: invoice.id,
                  invoice_item_id: matchedItem?.id,
                  deduction_type: 'sale',
                });
              }
            } catch (batchError) {
              console.error(`InvoicesService: Error deducting from batches for item ${item.item_id}:`, batchError);
            }
          }
        }
      }

      // Fetch the complete invoice with items
      const completeInvoice = await this.getInvoiceById(invoice.id);
      console.log('InvoicesService: Complete invoice fetched:', completeInvoice.id);
      if (binAllocationWarnings.length > 0) {
        return { ...completeInvoice, _warnings: binAllocationWarnings };
      }
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
    pos_session_id?: string;
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
      if (filters?.pos_session_id) {
        query = query.eq('pos_session_id', filters.pos_session_id);
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
   * Test #16: Recalculate payment_status after total_amount changes
   */
  async updateInvoice(id: string, data: Partial<CreateInvoiceData>) {
    try {
      const { items, ...invoiceData } = data;

      // Test #16: If total_amount is being changed, recalculate payment status
      if (invoiceData.total_amount !== undefined) {
        const { data: currentInvoice } = await supabase
          .from('invoices')
          .select('amount_paid, total_amount')
          .eq('id', id)
          .single();

        if (currentInvoice) {
          const amountPaid = Number(currentInvoice.amount_paid) || 0;
          const newTotal = Number(invoiceData.total_amount) || 0;
          const newBalance = newTotal - amountPaid;

          // Test #72: Warn if already paid more than new total
          if (amountPaid > newTotal && newTotal > 0) {
            console.warn(`InvoicesService: Invoice ${id} — already paid ₹${amountPaid} exceeds new total ₹${newTotal}. Refund of ₹${amountPaid - newTotal} may be needed.`);
          }

          // Recalculate payment status
          let paymentStatus = 'unpaid';
          if (amountPaid >= newTotal && newTotal > 0) {
            paymentStatus = 'paid';
          } else if (amountPaid > 0) {
            paymentStatus = 'partial';
          }

          (invoiceData as any).payment_status = paymentStatus;
          (invoiceData as any).balance_due = Math.max(0, newBalance);
        }
      }

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
   * Test #19: Block delete if payments are linked
   */
  async deleteInvoice(id: string) {
    try {
      // Test #19: Check for linked payments before deleting
      const { data: linkedPayments } = await supabase
        .from('payments_received')
        .select('id, payment_number, amount_received')
        .eq('invoice_id', id);

      if (linkedPayments && linkedPayments.length > 0) {
        const totalPaid = linkedPayments.reduce((sum: number, p: any) => sum + (Number(p.amount_received) || 0), 0);
        throw new Error(`Cannot delete: ${linkedPayments.length} payment(s) totalling ₹${totalPaid} are linked to this invoice. Delete the payments first.`);
      }

      // Also check payment_invoice_allocations
      const { data: allocations } = await supabase
        .from('payment_invoice_allocations')
        .select('id')
        .eq('invoice_id', id)
        .limit(1);

      if (allocations && allocations.length > 0) {
        throw new Error('Cannot delete: this invoice has payment allocations. Remove them first.');
      }

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

  /**
   * Bulk delete invoices (Test #24)
   * Only deletes invoices with no linked payments
   */
  async bulkDeleteInvoices(ids: string[]) {
    const results = {
      deleted: [] as string[],
      failed: [] as { id: string; reason: string }[],
    };

    for (const id of ids) {
      try {
        // Check for linked payments
        const { data: linkedPayments } = await supabase
          .from('payments_received')
          .select('id')
          .eq('invoice_id', id)
          .limit(1);

        if (linkedPayments && linkedPayments.length > 0) {
          results.failed.push({ id, reason: 'Invoice has linked payments' });
          continue;
        }

        const { data: allocations } = await supabase
          .from('payment_invoice_allocations')
          .select('id')
          .eq('invoice_id', id)
          .limit(1);

        if (allocations && allocations.length > 0) {
          results.failed.push({ id, reason: 'Invoice has payment allocations' });
          continue;
        }

        await supabase.from('invoice_items').delete().eq('invoice_id', id);
        await supabase.from('invoices').delete().eq('id', id);
        results.deleted.push(id);
      } catch (error: any) {
        results.failed.push({ id, reason: error.message });
      }
    }

    return results;
  }

  /**
   * Bulk import invoices
   */
  async importInvoices(invoices: any[], mode: string = 'create') {
    const results = {
      success: [] as any[],
      failed: [] as any[],
      duplicates: [] as any[],
      updated: [] as any[]
    };

    // Get organization_id
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)
      .single();

    const organizationId = org?.id || '00000000-0000-0000-0000-000000000000';

    for (const invoiceData of invoices) {
      try {
        // Check for duplicates
        const { data: existing } = await supabase
          .from('invoices')
          .select('id, invoice_number')
          .eq('invoice_number', invoiceData.invoice_number)
          .single();

        if (existing) {
          if (mode === 'create') {
            results.duplicates.push({
              invoice_number: invoiceData.invoice_number,
              reason: 'Invoice number already exists'
            });
            continue;
          } else if (mode === 'update' || mode === 'upsert') {
            // Update existing invoice
            const { error } = await supabase
              .from('invoices')
              .update({
                ...invoiceData,
                organization_id: organizationId,
                updated_at: new Date().toISOString()
              })
              .eq('id', existing.id);

            if (error) {
              results.failed.push({
                invoice_number: invoiceData.invoice_number,
                reason: error.message
              });
            } else {
              results.updated.push({
                invoice_number: invoiceData.invoice_number,
                id: existing.id
              });
            }
            continue;
          }
        }

        // Create new invoice
        if (mode === 'create' || mode === 'upsert') {
          const { data: newInvoice, error } = await supabase
            .from('invoices')
            .insert({
              ...invoiceData,
              organization_id: organizationId
            })
            .select()
            .single();

          if (error) {
            results.failed.push({
              invoice_number: invoiceData.invoice_number,
              reason: error.message
            });
          } else {
            results.success.push({
              invoice_number: invoiceData.invoice_number,
              id: newInvoice.id
            });
          }
        }
      } catch (error: any) {
        results.failed.push({
          invoice_number: invoiceData.invoice_number || 'Unknown',
          reason: error.message
        });
      }
    }

    return results;
  }
}
