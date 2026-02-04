import { supabaseAdmin as supabase } from '../config/supabase';

export interface DeliveryChallanItem {
  item_id?: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit_of_measurement: string;
  rate: number;
  amount: number;
  stock_on_hand?: number;
}

export interface CreateDeliveryChallanData {
  customer_id?: string;
  customer_name: string;
  challan_number?: string;
  reference_number?: string;
  challan_date: string;
  challan_type: string;
  location?: string;
  status?: string;
  subtotal: number;
  adjustment?: number;
  total_amount: number;
  notes?: string;
  items?: DeliveryChallanItem[];
  // BCH-AFS specific fields
  invoice_id?: string;
  invoice_number?: string;
  alternate_phone?: string;
  delivery_location_type?: string;
  delivery_address?: string;
  product_name?: string;
  pincode?: string;
  free_accessories?: string;
  salesperson_id?: string;
  salesperson_name?: string;
  estimated_delivery_day?: string;
  reverse_pickup?: string;
}

export class DeliveryChallansService {
  /**
   * Validate if a string is a valid UUID
   */
  private isValidUUID(uuid: string | null | undefined): boolean {
    if (!uuid) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Generate a new delivery challan number
   */
  async generateChallanNumber(): Promise<string> {
    try {
      const { data: latestChallan, error } = await supabase
        .from('delivery_challans')
        .select('challan_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!latestChallan) {
        return 'DC-00001';
      }

      const match = latestChallan.challan_number.match(/DC-(\d+)/);
      if (match) {
        const nextNumber = parseInt(match[1]) + 1;
        return `DC-${nextNumber.toString().padStart(5, '0')}`;
      }

      return 'DC-00001';
    } catch (error) {
      console.error('Error generating challan number:', error);
      throw error;
    }
  }

  /**
   * Create a new delivery challan with items
   */
  async createDeliveryChallan(data: CreateDeliveryChallanData) {
    try {
      console.log('DeliveryChallansService: Creating delivery challan with data:', JSON.stringify(data, null, 2));

      if (!data.challan_number) {
        data.challan_number = await this.generateChallanNumber();
      }

      if (!data.customer_name || data.customer_name.trim() === '') {
        throw new Error('Customer name is required');
      }

      const { items, ...challanData } = data;
      const defaultOrgId = '00000000-0000-0000-0000-000000000001';

      const customerId = this.isValidUUID(challanData.customer_id) ? challanData.customer_id : null;

      const invoiceId = this.isValidUUID(challanData.invoice_id) ? challanData.invoice_id : null;
      const salespersonId = this.isValidUUID(challanData.salesperson_id) ? challanData.salesperson_id : null;

      const cleanChallanData: any = {
        organization_id: defaultOrgId,
        customer_id: customerId,
        customer_name: challanData.customer_name.trim(),
        challan_number: challanData.challan_number,
        reference_number: challanData.reference_number || null,
        challan_date: challanData.challan_date,
        challan_type: challanData.challan_type || 'Supply on Approval',
        location: challanData.location || null,
        status: challanData.status || 'draft',
        subtotal: Number(challanData.subtotal) || 0,
        adjustment: Number(challanData.adjustment) || 0,
        total_amount: Number(challanData.total_amount) || 0,
        notes: challanData.notes || null,
        // BCH-AFS specific fields
        invoice_id: invoiceId,
        invoice_number: challanData.invoice_number || null,
        alternate_phone: challanData.alternate_phone || null,
        delivery_location_type: challanData.delivery_location_type || null,
        delivery_address: challanData.delivery_address || null,
        product_name: challanData.product_name || null,
        pincode: challanData.pincode || null,
        free_accessories: challanData.free_accessories || null,
        salesperson_id: salespersonId,
        salesperson_name: challanData.salesperson_name || null,
        estimated_delivery_day: challanData.estimated_delivery_day || null,
        reverse_pickup: challanData.reverse_pickup || null
      };

      console.log('DeliveryChallansService: Cleaned challan data:', JSON.stringify(cleanChallanData, null, 2));

      const { data: deliveryChallan, error: challanError } = await supabase
        .from('delivery_challans')
        .insert([cleanChallanData])
        .select()
        .single();

      if (challanError) {
        console.error('DeliveryChallansService: Error inserting delivery challan:', challanError);
        throw new Error(`Failed to create delivery challan: ${challanError.message}. ${challanError.hint || ''}`);
      }

      console.log('DeliveryChallansService: Delivery challan created successfully:', deliveryChallan.id);

      if (items && items.length > 0) {
        const itemsToInsert = items.map(item => {
          const itemId = this.isValidUUID(item.item_id) ? item.item_id : null;

          return {
            delivery_challan_id: deliveryChallan.id,
            item_id: itemId,
            item_name: item.item_name || '',
            description: item.description || null,
            quantity: Number(item.quantity) || 0,
            unit_of_measurement: item.unit_of_measurement || 'pcs',
            rate: Number(item.rate) || 0,
            amount: Number(item.amount) || 0,
            stock_on_hand: Number(item.stock_on_hand) || 0
          };
        });

        console.log('DeliveryChallansService: Inserting items:', JSON.stringify(itemsToInsert, null, 2));

        const { error: itemsError } = await supabase
          .from('delivery_challan_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error('DeliveryChallansService: Error inserting items:', itemsError);
          await supabase.from('delivery_challans').delete().eq('id', deliveryChallan.id);
          throw new Error(`Failed to create delivery challan items: ${itemsError.message}. ${itemsError.hint || ''}`);
        }

        console.log('DeliveryChallansService: Items created successfully');
      }

      const completeChallan = await this.getDeliveryChallanById(deliveryChallan.id);
      console.log('DeliveryChallansService: Complete challan fetched:', completeChallan.id);
      return completeChallan;
    } catch (error: any) {
      console.error('DeliveryChallansService: Error creating delivery challan:', error);
      throw error;
    }
  }

  /**
   * Get all delivery challans with optional filters
   */
  async getAllDeliveryChallans(filters?: {
    status?: string;
    customer_id?: string;
    from_date?: string;
    to_date?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      let query = supabase
        .from('delivery_challans')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }
      if (filters?.from_date) {
        query = query.gte('challan_date', filters.from_date);
      }
      if (filters?.to_date) {
        query = query.lte('challan_date', filters.to_date);
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
        deliveryChallans: data || [],
        total: count || 0,
        page,
        limit
      };
    } catch (error) {
      console.error('Error fetching delivery challans:', error);
      throw error;
    }
  }

  /**
   * Get a single delivery challan by ID with items
   */
  async getDeliveryChallanById(id: string) {
    try {
      const { data: deliveryChallan, error: challanError } = await supabase
        .from('delivery_challans')
        .select('*')
        .eq('id', id)
        .single();

      if (challanError) {
        throw challanError;
      }

      const { data: items, error: itemsError } = await supabase
        .from('delivery_challan_items')
        .select('*')
        .eq('delivery_challan_id', id);

      if (itemsError) {
        throw itemsError;
      }

      return {
        ...deliveryChallan,
        items: items || []
      };
    } catch (error) {
      console.error('Error fetching delivery challan:', error);
      throw error;
    }
  }

  /**
   * Update an existing delivery challan
   */
  async updateDeliveryChallan(id: string, data: Partial<CreateDeliveryChallanData>) {
    try {
      const { items, ...challanData } = data;

      const { data: deliveryChallan, error: challanError } = await supabase
        .from('delivery_challans')
        .update(challanData)
        .eq('id', id)
        .select()
        .single();

      if (challanError) {
        throw challanError;
      }

      if (items) {
        await supabase.from('delivery_challan_items').delete().eq('delivery_challan_id', id);

        if (items.length > 0) {
          const itemsToInsert = items.map(item => ({
            ...item,
            delivery_challan_id: id
          }));

          const { error: itemsError } = await supabase
            .from('delivery_challan_items')
            .insert(itemsToInsert);

          if (itemsError) {
            throw itemsError;
          }
        }
      }

      return await this.getDeliveryChallanById(id);
    } catch (error) {
      console.error('Error updating delivery challan:', error);
      throw error;
    }
  }

  /**
   * Delete a delivery challan
   */
  async deleteDeliveryChallan(id: string) {
    try {
      await supabase.from('delivery_challan_items').delete().eq('delivery_challan_id', id);

      const { error } = await supabase
        .from('delivery_challans')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting delivery challan:', error);
      throw error;
    }
  }
}
