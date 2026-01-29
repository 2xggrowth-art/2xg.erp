import { supabaseAdmin as supabase } from '../config/supabase';

export interface BillItem {
  item_id?: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit_of_measurement?: string;
  unit_price: number;
  tax_rate: number;
  discount: number;
  total: number;
  account?: string;
}

export interface CreateBillData {
  vendor_id?: string;
  vendor_name: string;
  vendor_email?: string;
  vendor_phone?: string;
  bill_number?: string;
  bill_date: string;
  due_date?: string;
  status?: string;
  subtotal: number;
  tax_amount: number;
  discount_amount?: number;
  adjustment?: number;
  total_amount: number;
  notes?: string;
  terms_and_conditions?: string;
  reference_number?: string;
  purchase_order_id?: string;
  attachment_urls?: string[];
  items: BillItem[];
}

export class BillsService {
  /**
   * Generate a new bill number
   */
  async generateBillNumber(): Promise<string> {
    try {
      // Get the latest bill number
      const { data: latestBill, error } = await supabase
        .from('bills')
        .select('bill_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is okay
        throw error;
      }

      if (!latestBill) {
        return 'BILL-0001';
      }

      // Extract number from bill_number (e.g., "BILL-0001" -> 1)
      const match = latestBill.bill_number.match(/BILL-(\d+)/);
      if (match) {
        const nextNumber = parseInt(match[1]) + 1;
        return `BILL-${nextNumber.toString().padStart(4, '0')}`;
      }

      return 'BILL-0001';
    } catch (error) {
      console.error('Error generating bill number:', error);
      throw error;
    }
  }

  /**
   * Create a new bill with items
   */
  async createBill(data: CreateBillData) {
    try {
      // Generate bill number if not provided
      const billNumber = data.bill_number || await this.generateBillNumber();

      // Calculate balance due
      const balanceDue = data.total_amount;

      // Create the bill
      const { data: bill, error: billError } = await supabase
        .from('bills')
        .insert({
          organization_id: '00000000-0000-0000-0000-000000000000', // Default org ID
          bill_number: billNumber,
          vendor_id: data.vendor_id || null,
          vendor_name: data.vendor_name,
          vendor_email: data.vendor_email || null,
          vendor_phone: data.vendor_phone || null,
          bill_date: data.bill_date,
          due_date: data.due_date || null,
          status: data.status || 'draft',
          payment_status: 'unpaid',
          subtotal: data.subtotal,
          tax_amount: data.tax_amount,
          discount_amount: data.discount_amount || 0,
          adjustment: data.adjustment || 0,
          total_amount: data.total_amount,
          amount_paid: 0,
          balance_due: balanceDue,
          notes: data.notes || null,
          terms_and_conditions: data.terms_and_conditions || null,
          reference_number: data.reference_number || null,
          purchase_order_id: data.purchase_order_id || null,
          attachment_urls: data.attachment_urls || null,
        })
        .select()
        .single();

      if (billError) {
        throw billError;
      }

      // Create bill items
      if (data.items && data.items.length > 0) {
        const billItems = data.items.map((item) => ({
          bill_id: bill.id,
          item_id: item.item_id || null,
          item_name: item.item_name,
          description: item.description || null,
          quantity: item.quantity,
          unit_of_measurement: item.unit_of_measurement || null,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
          discount: item.discount,
          total: item.total,
          account: item.account || null,
        }));

        const { error: itemsError } = await supabase
          .from('bill_items')
          .insert(billItems);

        if (itemsError) {
          // Rollback: delete the bill
          await supabase.from('bills').delete().eq('id', bill.id);
          throw itemsError;
        }

        // Update item stock
        for (const item of data.items) {
          if (item.item_id && item.quantity > 0) {
            // Get current stock
            const { data: currentItem } = await supabase
              .from('items')
              .select('current_stock')
              .eq('id', item.item_id)
              .single();

            if (currentItem) {
              const newStock = (currentItem.current_stock || 0) + item.quantity;
              await supabase
                .from('items')
                .update({ current_stock: newStock })
                .eq('id', item.item_id);
            }
          }
        }
      }

      return bill;
    } catch (error) {
      console.error('Error creating bill:', error);
      throw error;
    }
  }

  /**
   * Get all bills with optional filters
   */
  async getAllBills(filters?: any) {
    try {
      let query = supabase
        .from('bills')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.vendor_id) {
        query = query.eq('vendor_id', filters.vendor_id);
      }

      if (filters?.from_date) {
        query = query.gte('bill_date', filters.from_date);
      }

      if (filters?.to_date) {
        query = query.lte('bill_date', filters.to_date);
      }

      if (filters?.search) {
        query = query.or(`bill_number.ilike.%${filters.search}%,vendor_name.ilike.%${filters.search}%,reference_number.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching bills:', error);
      throw error;
    }
  }

  /**
   * Get a single bill by ID with items
   */
  async getBillById(id: string) {
    try {
      // Get bill
      const { data: bill, error: billError } = await supabase
        .from('bills')
        .select('*')
        .eq('id', id)
        .single();

      if (billError) {
        throw billError;
      }

      // Get bill items
      const { data: items, error: itemsError } = await supabase
        .from('bill_items')
        .select('*')
        .eq('bill_id', id);

      if (itemsError) {
        throw itemsError;
      }

      return {
        ...bill,
        items: items || [],
      };
    } catch (error) {
      console.error('Error fetching bill:', error);
      throw error;
    }
  }

  /**
   * Update a bill
   */
  async updateBill(id: string, data: Partial<CreateBillData>) {
    try {
      const updateData: any = {};

      if (data.vendor_id !== undefined) updateData.vendor_id = data.vendor_id;
      if (data.vendor_name !== undefined) updateData.vendor_name = data.vendor_name;
      if (data.vendor_email !== undefined) updateData.vendor_email = data.vendor_email;
      if (data.vendor_phone !== undefined) updateData.vendor_phone = data.vendor_phone;
      if (data.bill_date !== undefined) updateData.bill_date = data.bill_date;
      if (data.due_date !== undefined) updateData.due_date = data.due_date;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.subtotal !== undefined) updateData.subtotal = data.subtotal;
      if (data.tax_amount !== undefined) updateData.tax_amount = data.tax_amount;
      if (data.discount_amount !== undefined) updateData.discount_amount = data.discount_amount;
      if (data.adjustment !== undefined) updateData.adjustment = data.adjustment;
      if (data.total_amount !== undefined) {
        updateData.total_amount = data.total_amount;
        updateData.balance_due = data.total_amount; // Recalculate balance
      }
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.terms_and_conditions !== undefined) updateData.terms_and_conditions = data.terms_and_conditions;
      if (data.reference_number !== undefined) updateData.reference_number = data.reference_number;
      if (data.attachment_urls !== undefined) updateData.attachment_urls = data.attachment_urls;

      const { data: bill, error } = await supabase
        .from('bills')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update items if provided
      if (data.items) {
        // Delete existing items
        await supabase.from('bill_items').delete().eq('bill_id', id);

        // Insert new items
        if (data.items.length > 0) {
          const billItems = data.items.map((item: BillItem) => ({
            bill_id: id,
            item_id: item.item_id || null,
            item_name: item.item_name,
            description: item.description || null,
            quantity: item.quantity,
            unit_of_measurement: item.unit_of_measurement || null,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate,
            discount: item.discount,
            total: item.total,
            account: item.account || null,
          }));

          await supabase.from('bill_items').insert(billItems);
        }
      }

      return bill;
    } catch (error) {
      console.error('Error updating bill:', error);
      throw error;
    }
  }

  /**
   * Delete a bill
   */
  async deleteBill(id: string) {
    try {
      // Delete bill items first (foreign key constraint)
      await supabase.from('bill_items').delete().eq('bill_id', id);

      // Delete bill
      const { data, error } = await supabase
        .from('bills')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error deleting bill:', error);
      throw error;
    }
  }

  /**
   * Get bills summary
   */
  async getBillsSummary() {
    try {
      const { data: bills, error } = await supabase
        .from('bills')
        .select('status, total_amount, amount_paid, balance_due');

      if (error) {
        throw error;
      }

      const summary = {
        total_bills: bills.length,
        draft_count: bills.filter((b: any) => b.status === 'draft').length,
        open_count: bills.filter((b: any) => b.status === 'open').length,
        paid_count: bills.filter((b: any) => b.status === 'paid').length,
        overdue_count: bills.filter((b: any) => b.status === 'overdue').length,
        total_amount: bills.reduce((sum: number, b: any) => sum + b.total_amount, 0),
        amount_paid: bills.reduce((sum: number, b: any) => sum + (b.amount_paid || 0), 0),
        balance_due: bills.reduce((sum: number, b: any) => sum + (b.balance_due || 0), 0),
      };

      return summary;
    } catch (error) {
      console.error('Error fetching bills summary:', error);
      throw error;
    }
  }
}
