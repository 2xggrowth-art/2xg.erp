import { supabaseAdmin } from '../config/supabase';

export interface TransferOrderItem {
  id?: string;
  transfer_order_id?: string;
  item_id?: string;
  item_name: string;
  description?: string;
  source_availability?: number;
  destination_availability?: number;
  transfer_quantity: number;
  unit_of_measurement?: string;
}

export interface TransferOrder {
  id?: string;
  organization_id?: string;
  transfer_order_number: string;
  transfer_date: string;
  source_location: string;
  destination_location: string;
  reason?: string;
  status?: string;
  total_items?: number;
  total_quantity?: number;
  notes?: string;
  attachment_urls?: string[];
  items?: TransferOrderItem[];
}

export class TransferOrdersService {
  private organizationId = '00000000-0000-0000-0000-000000000000';

  /**
   * Generate a new transfer order number
   */
  async generateTransferOrderNumber(): Promise<string> {
    try {
      const { data, error } = await supabaseAdmin
        .from('transfer_orders')
        .select('transfer_order_number')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.warn('Transfer orders table may not exist:', error);
        return 'TO-0001';
      }

      if (data && data.length > 0) {
        const lastNumber = data[0].transfer_order_number;
        const match = lastNumber.match(/TO-(\d+)/);
        if (match) {
          const nextNumber = parseInt(match[1]) + 1;
          return `TO-${nextNumber.toString().padStart(4, '0')}`;
        }
      }

      return 'TO-0001';
    } catch (error) {
      console.error('Error generating transfer order number:', error);
      return 'TO-0001';
    }
  }

  /**
   * Create a new transfer order
   */
  async createTransferOrder(orderData: TransferOrder): Promise<any> {
    try {
      const { items, ...mainData } = orderData;

      // Validate: source and destination cannot be the same
      if (mainData.source_location === mainData.destination_location) {
        throw new Error('Transfers cannot be made within the same location. Please choose a different one and proceed.');
      }

      // Validate: items must have positive quantities
      if (items && items.length > 0) {
        const hasZeroQuantity = items.some(item => item.transfer_quantity <= 0);
        if (hasZeroQuantity) {
          throw new Error('Transactions cannot be proceed with Zero Quantity.');
        }
      } else {
        throw new Error('Transfer order must contain at least one item.');
      }

      // Calculate totals
      const total_items = items?.length || 0;
      const total_quantity = items?.reduce((sum, item) => sum + item.transfer_quantity, 0) || 0;

      // Insert main transfer order record
      const { data: order, error: orderError } = await supabaseAdmin
        .from('transfer_orders')
        .insert([{
          ...mainData,
          organization_id: this.organizationId,
          total_items,
          total_quantity,
          status: mainData.status || 'draft'
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert transfer order items if provided
      if (items && items.length > 0) {
        const itemsToInsert = items.map(item => ({
          transfer_order_id: order.id,
          item_id: item.item_id,
          item_name: item.item_name,
          description: item.description,
          source_availability: item.source_availability,
          destination_availability: item.destination_availability,
          transfer_quantity: item.transfer_quantity,
          unit_of_measurement: item.unit_of_measurement
        }));

        const { error: itemsError } = await supabaseAdmin
          .from('transfer_order_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      return order;
    } catch (error) {
      console.error('Error creating transfer order:', error);
      throw error;
    }
  }

  /**
   * Get all transfer orders with optional filters
   */
  async getAllTransferOrders(filters?: {
    status?: string;
    source_location?: string;
    destination_location?: string;
    from_date?: string;
    to_date?: string;
    search?: string;
  }): Promise<any[]> {
    try {
      let query = supabaseAdmin
        .from('transfer_orders')
        .select('*')
        .eq('organization_id', this.organizationId);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.source_location) {
        query = query.eq('source_location', filters.source_location);
      }

      if (filters?.destination_location) {
        query = query.eq('destination_location', filters.destination_location);
      }

      if (filters?.from_date) {
        query = query.gte('transfer_date', filters.from_date);
      }

      if (filters?.to_date) {
        query = query.lte('transfer_date', filters.to_date);
      }

      if (filters?.search) {
        query = query.or(`transfer_order_number.ilike.%${filters.search}%,reason.ilike.%${filters.search}%`);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching transfer orders:', error);
      throw error;
    }
  }

  /**
   * Get a single transfer order by ID with its items
   */
  async getTransferOrderById(id: string): Promise<any> {
    try {
      // Get order details
      const { data: order, error: orderError } = await supabaseAdmin
        .from('transfer_orders')
        .select('*')
        .eq('id', id)
        .single();

      if (orderError) throw orderError;

      // Get order items
      const { data: items, error: itemsError } = await supabaseAdmin
        .from('transfer_order_items')
        .select('*')
        .eq('transfer_order_id', id);

      if (itemsError) throw itemsError;

      return {
        ...order,
        items: items || []
      };
    } catch (error) {
      console.error('Error fetching transfer order:', error);
      throw error;
    }
  }

  /**
   * Update a transfer order
   */
  async updateTransferOrder(id: string, orderData: Partial<TransferOrder>): Promise<any> {
    try {
      const { items, ...mainData } = orderData;

      // Validate if locations are being updated
      if (mainData.source_location && mainData.destination_location) {
        if (mainData.source_location === mainData.destination_location) {
          throw new Error('Transfers cannot be made within the same location. Please choose a different one and proceed.');
        }
      }

      // Recalculate totals if items changed
      if (items) {
        mainData.total_items = items.length;
        mainData.total_quantity = items.reduce((sum, item) => sum + item.transfer_quantity, 0);
      }

      // Update main transfer order record
      const { data: order, error: orderError } = await supabaseAdmin
        .from('transfer_orders')
        .update(mainData)
        .eq('id', id)
        .select()
        .single();

      if (orderError) throw orderError;

      // Update items if provided
      if (items) {
        // Delete existing items
        await supabaseAdmin
          .from('transfer_order_items')
          .delete()
          .eq('transfer_order_id', id);

        // Insert new items
        if (items.length > 0) {
          const itemsToInsert = items.map(item => ({
            transfer_order_id: id,
            item_id: item.item_id,
            item_name: item.item_name,
            description: item.description,
            source_availability: item.source_availability,
            destination_availability: item.destination_availability,
            transfer_quantity: item.transfer_quantity,
            unit_of_measurement: item.unit_of_measurement
          }));

          const { error: itemsError } = await supabaseAdmin
            .from('transfer_order_items')
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }
      }

      return order;
    } catch (error) {
      console.error('Error updating transfer order:', error);
      throw error;
    }
  }

  /**
   * Delete a transfer order
   */
  async deleteTransferOrder(id: string): Promise<any> {
    try {
      const { data, error } = await supabaseAdmin
        .from('transfer_orders')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error deleting transfer order:', error);
      throw error;
    }
  }

  /**
   * Get transfer orders summary/statistics
   */
  async getTransferOrdersSummary(): Promise<any> {
    try {
      const { data, error } = await supabaseAdmin
        .from('transfer_orders')
        .select('status, total_items, total_quantity')
        .eq('organization_id', this.organizationId);

      if (error) throw error;

      const summary = {
        total_orders: data?.length || 0,
        draft_count: data?.filter(o => o.status === 'draft').length || 0,
        initiated_count: data?.filter(o => o.status === 'initiated').length || 0,
        in_transit_count: data?.filter(o => o.status === 'in_transit').length || 0,
        received_count: data?.filter(o => o.status === 'received').length || 0,
        cancelled_count: data?.filter(o => o.status === 'cancelled').length || 0,
        total_items: data?.reduce((sum, o) => sum + (o.total_items || 0), 0) || 0,
        total_quantity: data?.reduce((sum, o) => sum + parseFloat(o.total_quantity || 0), 0) || 0,
      };

      return summary;
    } catch (error) {
      console.error('Error fetching transfer orders summary:', error);
      throw error;
    }
  }

  /**
   * Update transfer order status
   */
  async updateTransferOrderStatus(id: string, status: string): Promise<any> {
    try {
      const { data, error } = await supabaseAdmin
        .from('transfer_orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating transfer order status:', error);
      throw error;
    }
  }
}
