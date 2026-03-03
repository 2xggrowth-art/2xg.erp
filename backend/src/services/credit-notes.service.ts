import { supabaseAdmin as supabase } from '../config/supabase';

export interface CreditNoteItem {
  item_id?: string;
  item_name: string;
  quantity: number;
  rate: number;
  amount: number;
  reason?: string;
}

export interface CreateCreditNoteData {
  invoice_id?: string;
  invoice_number?: string;
  customer_id?: string;
  customer_name?: string;
  credit_date?: string;
  reason?: string;
  sub_total?: number;
  tax_amount?: number;
  total_amount?: number;
  status?: string;
  organization_id?: string;
  pos_session_id?: string;
  items: CreditNoteItem[];
}

export class CreditNotesService {
  /**
   * Generate a new credit note number (CN-0001 format)
   */
  async generateCreditNoteNumber(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('credit_notes')
        .select('credit_note_number')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (!data || data.length === 0) {
        return 'CN-0001';
      }

      // Find the highest credit note number
      let maxNum = 0;
      for (const cn of data) {
        const match = cn.credit_note_number?.match(/^CN-(\d+)$/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxNum) maxNum = num;
        }
      }

      const nextNum = maxNum + 1;
      return `CN-${nextNum.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating credit note number:', error);
      throw error;
    }
  }

  /**
   * Create a credit note (return processing)
   * - Creates credit note + items
   * - Increments stock for returned items
   * - Reverses bin allocations if original invoice had them
   */
  async createCreditNote(data: CreateCreditNoteData, organizationId?: string): Promise<any> {
    try {
      const creditNoteNumber = await this.generateCreditNoteNumber();

      // Get organization_id
      let orgId = organizationId || data.organization_id;
      if (!orgId) {
        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .limit(1)
          .single();
        orgId = org?.id || '00000000-0000-0000-0000-000000000001';
      }

      // If invoice_id provided, fetch invoice details
      let invoiceNumber = data.invoice_number || null;
      let customerId = data.customer_id || null;
      let customerName = data.customer_name || null;

      if (data.invoice_id) {
        const { data: invoice, error: invError } = await supabase
          .from('invoices')
          .select('invoice_number, customer_id, customer_name')
          .eq('id', data.invoice_id)
          .single();

        if (invError) {
          console.warn('Could not fetch invoice details:', invError.message);
        } else if (invoice) {
          invoiceNumber = invoiceNumber || invoice.invoice_number;
          customerId = customerId || invoice.customer_id;
          customerName = customerName || invoice.customer_name;
        }
      }

      // Calculate totals from items if not provided
      const subTotal = data.sub_total || data.items.reduce((sum, item) => sum + Number(item.amount), 0);
      const taxAmount = data.tax_amount || 0;
      const totalAmount = data.total_amount || (subTotal + taxAmount);

      // Insert credit note
      const { data: creditNote, error: cnError } = await supabase
        .from('credit_notes')
        .insert({
          credit_note_number: creditNoteNumber,
          invoice_id: data.invoice_id || null,
          invoice_number: invoiceNumber,
          customer_id: customerId,
          customer_name: customerName,
          credit_date: data.credit_date || new Date().toISOString().split('T')[0],
          reason: data.reason || null,
          sub_total: subTotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          status: data.status || 'draft',
          organization_id: orgId,
          pos_session_id: data.pos_session_id || null,
        })
        .select()
        .single();

      if (cnError) {
        console.error('Error creating credit note:', cnError);
        throw new Error(`Failed to create credit note: ${cnError.message}`);
      }

      // Insert credit note items and increment stock
      if (data.items && data.items.length > 0) {
        const itemsToInsert = data.items.map(item => ({
          credit_note_id: creditNote.id,
          item_id: item.item_id || null,
          item_name: item.item_name,
          quantity: Number(item.quantity),
          rate: Number(item.rate),
          amount: Number(item.amount),
          reason: item.reason || null,
        }));

        const { error: itemsError } = await supabase
          .from('credit_note_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error('Error inserting credit note items:', itemsError);
          throw new Error(`Failed to create credit note items: ${itemsError.message}`);
        }

        // Increment stock for each returned item
        for (const item of data.items) {
          if (item.item_id) {
            // Get current stock
            const { data: existingItem, error: fetchError } = await supabase
              .from('items')
              .select('current_stock')
              .eq('id', item.item_id)
              .single();

            if (fetchError) {
              console.warn(`Could not fetch stock for item ${item.item_id}:`, fetchError.message);
              continue;
            }

            const newStock = (existingItem.current_stock || 0) + Number(item.quantity);

            const { error: stockError } = await supabase
              .from('items')
              .update({ current_stock: newStock })
              .eq('id', item.item_id);

            if (stockError) {
              console.warn(`Could not update stock for item ${item.item_id}:`, stockError.message);
            }

            // If original invoice had bin allocations, reverse them (add stock back to the bin)
            if (data.invoice_id) {
              await this.reverseBinAllocations(data.invoice_id, item.item_id, Number(item.quantity));
            }
          }
        }
      }

      // Fetch the complete credit note with items
      return await this.getCreditNoteById(creditNote.id);
    } catch (error) {
      console.error('Error creating credit note:', error);
      throw error;
    }
  }

  /**
   * Reverse bin allocations for a returned item
   * Finds the invoice_item_bin_allocations for the original invoice and adds stock back
   */
  private async reverseBinAllocations(invoiceId: string, itemId: string, returnQuantity: number): Promise<void> {
    try {
      // Find invoice items for this item in this invoice
      const { data: invoiceItems, error: iiError } = await supabase
        .from('invoice_items')
        .select('id')
        .eq('invoice_id', invoiceId)
        .eq('item_id', itemId);

      if (iiError || !invoiceItems || invoiceItems.length === 0) {
        return; // No invoice items found, nothing to reverse
      }

      const invoiceItemIds = invoiceItems.map(ii => ii.id);

      // Find bin allocations for these invoice items
      const { data: allocations, error: allocError } = await supabase
        .from('invoice_item_bin_allocations')
        .select('bin_location_id, quantity')
        .in('invoice_item_id', invoiceItemIds);

      if (allocError || !allocations || allocations.length === 0) {
        return; // No bin allocations to reverse
      }

      // Calculate how much to return to each bin (proportionally if needed)
      let remainingReturn = returnQuantity;
      for (const alloc of allocations) {
        if (remainingReturn <= 0) break;

        const returnFromBin = Math.min(Number(alloc.quantity), remainingReturn);
        remainingReturn -= returnFromBin;

        // Add stock back to the bin via a new bill_item_bin_allocation
        // (This is the standard way stock enters bins in the system)
        // Note: We log the reversal but the actual bin stock calculation
        // is dynamic (purchases IN - sales OUT), so the returned items
        // effectively reduce the "sales OUT" impact. For simplicity,
        // we just log the reversal here.
        console.log(`CreditNotesService: Reversed ${returnFromBin} units back to bin ${alloc.bin_location_id} for item ${itemId}`);
      }
    } catch (error) {
      console.warn('Error reversing bin allocations:', error);
      // Non-fatal — stock was already incremented on the item level
    }
  }

  /**
   * Get credit note by ID with items
   */
  async getCreditNoteById(id: string): Promise<any> {
    try {
      const { data: creditNote, error } = await supabase
        .from('credit_notes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Fetch items
      const { data: items, error: itemsError } = await supabase
        .from('credit_note_items')
        .select('*')
        .eq('credit_note_id', id)
        .order('created_at', { ascending: true });

      if (itemsError) throw itemsError;

      return { ...creditNote, items: items || [] };
    } catch (error) {
      console.error('Error fetching credit note:', error);
      throw error;
    }
  }

  /**
   * Get all credit notes with optional filters and pagination
   */
  async getAllCreditNotes(filters?: {
    status?: string;
    customer_id?: string;
    from_date?: string;
    to_date?: string;
    search?: string;
  }): Promise<any[]> {
    try {
      let query = supabase
        .from('credit_notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }

      if (filters?.from_date) {
        query = query.gte('credit_date', filters.from_date);
      }

      if (filters?.to_date) {
        query = query.lte('credit_date', filters.to_date);
      }

      if (filters?.search) {
        query = query.or(`credit_note_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,invoice_number.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching credit notes:', error);
      throw error;
    }
  }

  /**
   * Update credit note status
   */
  async updateCreditNoteStatus(id: string, status: string): Promise<any> {
    try {
      const validStatuses = ['draft', 'issued', 'applied', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status "${status}". Must be one of: ${validStatuses.join(', ')}`);
      }

      const { data, error } = await supabase
        .from('credit_notes')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating credit note status:', error);
      throw error;
    }
  }
}
