import { supabaseAdmin } from '../config/supabase';

export interface VendorCreditItem {
  id?: string;
  credit_id?: string;
  item_id?: string;
  item_name: string;
  description?: string;
  account?: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface VendorCredit {
  id?: string;
  organization_id?: string;
  credit_note_number: string;
  vendor_id?: string;
  vendor_name: string;
  vendor_email?: string;
  vendor_phone?: string;
  credit_date: string;
  location?: string;
  order_number?: string;
  reference_number?: string;
  subject?: string;
  status?: string;
  subtotal: number;
  discount_type?: string;
  discount_value?: number;
  discount_amount?: number;
  cgst_rate?: number;
  cgst_amount?: number;
  sgst_rate?: number;
  sgst_amount?: number;
  igst_rate?: number;
  igst_amount?: number;
  tax_amount?: number;
  adjustment?: number;
  total_amount: number;
  amount_used?: number;
  balance?: number;
  notes?: string;
  attachment_urls?: string[];
  items?: VendorCreditItem[];
}

export class VendorCreditsService {
  private organizationId = '00000000-0000-0000-0000-000000000000';

  /**
   * Generate a new credit number
   */
  async generateCreditNumber(): Promise<string> {
    try {
      const { data, error } = await supabaseAdmin
        .from('vendor_credits')
        .select('credit_note_number')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        // If table doesn't exist, return default number
        console.warn('Vendor credits table may not exist:', error);
        return 'VC-0001';
      }

      if (data && data.length > 0) {
        const lastNumber = data[0].credit_note_number;
        const match = lastNumber.match(/VC-(\d+)/);
        if (match) {
          const nextNumber = parseInt(match[1]) + 1;
          return `VC-${nextNumber.toString().padStart(4, '0')}`;
        }
      }

      return 'VC-0001';
    } catch (error) {
      console.error('Error generating credit number:', error);
      // Return default instead of throwing to prevent server crash
      return 'VC-0001';
    }
  }

  /**
   * Create a new vendor credit
   */
  async createVendorCredit(creditData: VendorCredit): Promise<any> {
    try {
      const { items, ...mainData } = creditData;

      // Calculate balance (total - amount_used)
      const balance = mainData.total_amount - (mainData.amount_used || 0);

      // Insert main vendor credit record
      const { data: credit, error: creditError } = await supabaseAdmin
        .from('vendor_credits')
        .insert([{
          ...mainData,
          organization_id: this.organizationId,
          balance,
          status: mainData.status || 'open'
        }])
        .select()
        .single();

      if (creditError) throw creditError;

      // Insert credit items if provided
      if (items && items.length > 0) {
        const itemsToInsert = items.map(item => ({
          credit_id: credit.id,
          item_id: item.item_id,
          item_name: item.item_name,
          description: item.description,
          account: item.account,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount
        }));

        const { error: itemsError } = await supabaseAdmin
          .from('vendor_credit_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      return credit;
    } catch (error) {
      console.error('Error creating vendor credit:', error);
      throw error;
    }
  }

  /**
   * Get all vendor credits with optional filters
   */
  async getAllVendorCredits(filters?: {
    status?: string;
    vendor_id?: string;
    from_date?: string;
    to_date?: string;
    search?: string;
  }): Promise<any[]> {
    try {
      let query = supabaseAdmin
        .from('vendor_credits')
        .select('*')
        .eq('organization_id', this.organizationId);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.vendor_id) {
        query = query.eq('vendor_id', filters.vendor_id);
      }

      if (filters?.from_date) {
        query = query.gte('credit_date', filters.from_date);
      }

      if (filters?.to_date) {
        query = query.lte('credit_date', filters.to_date);
      }

      if (filters?.search) {
        query = query.or(`credit_note_number.ilike.%${filters.search}%,vendor_name.ilike.%${filters.search}%,reference_number.ilike.%${filters.search}%`);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching vendor credits:', error);
      throw error;
    }
  }

  /**
   * Get a single vendor credit by ID with its items
   */
  async getVendorCreditById(id: string): Promise<any> {
    try {
      // Get credit details
      const { data: credit, error: creditError } = await supabaseAdmin
        .from('vendor_credits')
        .select('*')
        .eq('id', id)
        .single();

      if (creditError) throw creditError;

      // Get credit items
      const { data: items, error: itemsError } = await supabaseAdmin
        .from('vendor_credit_items')
        .select('*')
        .eq('credit_id', id);

      if (itemsError) throw itemsError;

      return {
        ...credit,
        items: items || []
      };
    } catch (error) {
      console.error('Error fetching vendor credit:', error);
      throw error;
    }
  }

  /**
   * Update a vendor credit
   */
  async updateVendorCredit(id: string, creditData: Partial<VendorCredit>): Promise<any> {
    try {
      const { items, ...mainData } = creditData;

      // Recalculate balance if total_amount or amount_used changed
      if (mainData.total_amount !== undefined || mainData.amount_used !== undefined) {
        const { data: existing } = await supabaseAdmin
          .from('vendor_credits')
          .select('total_amount, amount_used')
          .eq('id', id)
          .single();

        if (existing) {
          const total = mainData.total_amount ?? existing.total_amount;
          const used = mainData.amount_used ?? existing.amount_used;
          mainData.balance = total - used;
        }
      }

      // Update main vendor credit record
      const { data: credit, error: creditError } = await supabaseAdmin
        .from('vendor_credits')
        .update(mainData)
        .eq('id', id)
        .select()
        .single();

      if (creditError) throw creditError;

      // Update items if provided
      if (items) {
        // Delete existing items
        await supabaseAdmin
          .from('vendor_credit_items')
          .delete()
          .eq('credit_id', id);

        // Insert new items
        if (items.length > 0) {
          const itemsToInsert = items.map(item => ({
            credit_id: id,
            item_id: item.item_id,
            item_name: item.item_name,
            description: item.description,
            account: item.account,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.amount
          }));

          const { error: itemsError } = await supabaseAdmin
            .from('vendor_credit_items')
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }
      }

      return credit;
    } catch (error) {
      console.error('Error updating vendor credit:', error);
      throw error;
    }
  }

  /**
   * Delete a vendor credit
   */
  async deleteVendorCredit(id: string): Promise<any> {
    try {
      const { data, error } = await supabaseAdmin
        .from('vendor_credits')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error deleting vendor credit:', error);
      throw error;
    }
  }

  /**
   * Get vendor credits summary
   */
  async getVendorCreditsSummary(): Promise<any> {
    try {
      const { data, error } = await supabaseAdmin
        .from('vendor_credits')
        .select('status, total_amount, balance')
        .eq('organization_id', this.organizationId);

      if (error) throw error;

      const summary = {
        total_credits: data?.length || 0,
        open_count: data?.filter(c => c.status === 'open').length || 0,
        closed_count: data?.filter(c => c.status === 'closed').length || 0,
        draft_count: data?.filter(c => c.status === 'draft').length || 0,
        total_amount: data?.reduce((sum, c) => sum + parseFloat(c.total_amount || 0), 0) || 0,
        total_balance: data?.reduce((sum, c) => sum + parseFloat(c.balance || 0), 0) || 0,
      };

      return summary;
    } catch (error) {
      console.error('Error fetching vendor credits summary:', error);
      throw error;
    }
  }

  /**
   * Apply credit to a bill
   */
  async applyCreditToBill(creditId: string, billId: string, amount: number): Promise<any> {
    try {
      // Get current credit
      const { data: credit, error: creditError } = await supabaseAdmin
        .from('vendor_credits')
        .select('balance, amount_used, total_amount')
        .eq('id', creditId)
        .single();

      if (creditError) throw creditError;

      if (!credit || credit.balance < amount) {
        throw new Error('Insufficient credit balance');
      }

      // Update credit
      const newAmountUsed = parseFloat(credit.amount_used || 0) + amount;
      const newBalance = parseFloat(credit.total_amount) - newAmountUsed;

      const { error: updateError } = await supabaseAdmin
        .from('vendor_credits')
        .update({
          amount_used: newAmountUsed,
          balance: newBalance,
          status: newBalance <= 0 ? 'closed' : 'open'
        })
        .eq('id', creditId);

      if (updateError) throw updateError;

      return { success: true, applied_amount: amount, remaining_balance: newBalance };
    } catch (error) {
      console.error('Error applying credit to bill:', error);
      throw error;
    }
  }
}