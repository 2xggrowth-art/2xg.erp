import { supabaseAdmin as supabase } from '../config/supabase';

export class BatchesService {
  /**
   * Generate next batch number for an item
   * Format: BATCH-YYYYMM-NNN (sequential per item)
   */
  async generateBatchNumber(itemId: string): Promise<string> {
    const now = new Date();
    const prefix = `BATCH-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Get highest existing batch number for this item with the same prefix
    const { data, error } = await supabase
      .from('item_batches')
      .select('batch_number')
      .eq('item_id', itemId)
      .like('batch_number', `${prefix}-%`)
      .order('batch_number', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching last batch number:', error);
    }

    let nextSeq = 1;
    if (data && data.length > 0) {
      const match = data[0].batch_number.match(/-(\d+)$/);
      if (match) {
        nextSeq = parseInt(match[1]) + 1;
      }
    }

    return `${prefix}-${String(nextSeq).padStart(3, '0')}`;
  }

  /**
   * Create a batch record (called during bill creation for batch-tracked items)
   */
  async createBatch(data: {
    item_id: string;
    bill_id: string;
    bill_item_id?: string;
    quantity: number;
    bin_location_id?: string;
    notes?: string;
  }) {
    const batchNumber = await this.generateBatchNumber(data.item_id);

    const { data: batch, error } = await supabase
      .from('item_batches')
      .insert({
        item_id: data.item_id,
        bill_id: data.bill_id,
        bill_item_id: data.bill_item_id || null,
        batch_number: batchNumber,
        initial_quantity: data.quantity,
        remaining_quantity: data.quantity,
        bin_location_id: data.bin_location_id || null,
        status: 'active',
        notes: data.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating batch:', error);
      throw error;
    }

    return batch;
  }

  /**
   * Get all batches for an item
   */
  async getBatchesForItem(itemId: string, includeEmpty: boolean = false) {
    let query = supabase
      .from('item_batches')
      .select('*')
      .eq('item_id', itemId)
      .order('created_at', { ascending: true });

    if (!includeEmpty) {
      query = query.gt('remaining_quantity', 0);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching batches for item:', error);
      throw error;
    }

    // Enrich with bill number
    if (data && data.length > 0) {
      const billIds = [...new Set(data.filter(b => b.bill_id).map(b => b.bill_id))];
      let billMap: Record<string, string> = {};

      if (billIds.length > 0) {
        const { data: bills } = await supabase
          .from('bills')
          .select('id, bill_number')
          .in('id', billIds);

        if (bills) {
          billMap = Object.fromEntries(bills.map(b => [b.id, b.bill_number]));
        }
      }

      // Enrich with bin code
      const binIds = [...new Set(data.filter(b => b.bin_location_id).map(b => b.bin_location_id))];
      let binMap: Record<string, string> = {};

      if (binIds.length > 0) {
        const { data: bins } = await supabase
          .from('bin_locations')
          .select('id, bin_code')
          .in('id', binIds);

        if (bins) {
          binMap = Object.fromEntries(bins.map(b => [b.id, b.bin_code]));
        }
      }

      return data.map(batch => ({
        ...batch,
        bill_number: batch.bill_id ? billMap[batch.bill_id] || null : null,
        bin_code: batch.bin_location_id ? binMap[batch.bin_location_id] || null : null,
      }));
    }

    return data || [];
  }

  /**
   * Deduct quantity from batches using FIFO (oldest first)
   * Returns the deductions that were made
   */
  async deductFromBatches(data: {
    item_id: string;
    quantity: number;
    invoice_id?: string;
    invoice_item_id?: string;
    transfer_order_id?: string;
    deduction_type: 'sale' | 'transfer' | 'adjustment';
  }) {
    // Get active batches ordered by creation date (FIFO)
    const { data: batches, error: fetchError } = await supabase
      .from('item_batches')
      .select('*')
      .eq('item_id', data.item_id)
      .eq('status', 'active')
      .gt('remaining_quantity', 0)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching batches for deduction:', fetchError);
      throw fetchError;
    }

    if (!batches || batches.length === 0) {
      console.warn(`No active batches found for item ${data.item_id}, skipping batch deduction`);
      return [];
    }

    let remainingToDeduct = data.quantity;
    const deductions: any[] = [];

    for (const batch of batches) {
      if (remainingToDeduct <= 0) break;

      const deductAmount = Math.min(remainingToDeduct, Number(batch.remaining_quantity));
      const newRemaining = Number(batch.remaining_quantity) - deductAmount;
      const newStatus = newRemaining <= 0 ? 'depleted' : 'active';

      // Update batch
      const { error: updateError } = await supabase
        .from('item_batches')
        .update({
          remaining_quantity: newRemaining,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', batch.id);

      if (updateError) {
        console.error('Error updating batch:', updateError);
        throw updateError;
      }

      // Create deduction record
      const deductionRecord: any = {
        batch_id: batch.id,
        quantity: deductAmount,
        deduction_type: data.deduction_type,
      };

      if (data.invoice_id) deductionRecord.invoice_id = data.invoice_id;
      if (data.invoice_item_id) deductionRecord.invoice_item_id = data.invoice_item_id;
      if (data.transfer_order_id) deductionRecord.transfer_order_id = data.transfer_order_id;

      const { data: deduction, error: deductError } = await supabase
        .from('batch_deductions')
        .insert(deductionRecord)
        .select()
        .single();

      if (deductError) {
        console.error('Error creating batch deduction:', deductError);
        throw deductError;
      }

      deductions.push(deduction);
      remainingToDeduct -= deductAmount;
    }

    if (remainingToDeduct > 0) {
      console.warn(`Insufficient batch quantity for item ${data.item_id}. Short by ${remainingToDeduct}`);
    }

    return deductions;
  }

  /**
   * Get batch by ID
   */
  async getBatchById(id: string) {
    const { data, error } = await supabase
      .from('item_batches')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching batch:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get deductions for a batch (audit trail)
   */
  async getBatchDeductions(batchId: string) {
    const { data, error } = await supabase
      .from('batch_deductions')
      .select('*')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching batch deductions:', error);
      throw error;
    }

    // Enrich with invoice/transfer numbers
    if (data && data.length > 0) {
      const invoiceIds = [...new Set(data.filter(d => d.invoice_id).map(d => d.invoice_id))];
      let invoiceMap: Record<string, string> = {};

      if (invoiceIds.length > 0) {
        const { data: invoices } = await supabase
          .from('invoices')
          .select('id, invoice_number')
          .in('id', invoiceIds);

        if (invoices) {
          invoiceMap = Object.fromEntries(invoices.map(i => [i.id, i.invoice_number]));
        }
      }

      return data.map(d => ({
        ...d,
        invoice_number: d.invoice_id ? invoiceMap[d.invoice_id] || null : null,
      }));
    }

    return data || [];
  }
}
