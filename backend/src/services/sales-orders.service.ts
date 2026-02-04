import { supabaseAdmin as supabase } from '../config/supabase';

export interface SalesOrderItem {
  item_id?: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit_of_measurement: string;
  rate: number;
  amount: number;
  stock_on_hand?: number;
}

export interface CreateSalesOrderData {
  customer_id?: string;
  customer_name: string;
  customer_email?: string;
  sales_order_number?: string;
  order_date: string;
  expected_shipment_date?: string;
  status?: string;
  subtotal: number;
  discount_type?: 'percentage' | 'amount';
  discount_value?: number;
  discount_amount?: number;
  cgst_rate?: number;
  cgst_amount?: number;
  sgst_rate?: number;
  sgst_amount?: number;
  igst_rate?: number;
  igst_amount?: number;
  tax_amount?: number;
  shipping_charges?: number;
  adjustment?: number;
  total_amount: number;
  notes?: string;
  terms_and_conditions?: string;
  items: SalesOrderItem[];
}

export class SalesOrdersService {
  /**
   * Validate if a string is a valid UUID
   */
  private isValidUUID(uuid: string | null | undefined): boolean {
    if (!uuid) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Generate a new sales order number
   */
  async generateSalesOrderNumber(): Promise<string> {
    try {
      const { data: latestOrder, error } = await supabase
        .from('sales_orders')
        .select('sales_order_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!latestOrder) {
        return 'SO-00001';
      }

      const match = latestOrder.sales_order_number.match(/SO-(\d+)/);
      if (match) {
        const nextNumber = parseInt(match[1]) + 1;
        return `SO-${nextNumber.toString().padStart(5, '0')}`;
      }

      return 'SO-00001';
    } catch (error) {
      console.error('Error generating sales order number:', error);
      throw error;
    }
  }

  /**
   * Create a new sales order with items
   */
  async createSalesOrder(data: CreateSalesOrderData) {
    try {
      console.log('SalesOrdersService: Creating sales order with data:', JSON.stringify(data, null, 2));

      if (!data.sales_order_number) {
        data.sales_order_number = await this.generateSalesOrderNumber();
      }

      if (!data.customer_name || data.customer_name.trim() === '') {
        throw new Error('Customer name is required');
      }

      if (!data.order_date) {
        throw new Error('Order date is required');
      }

      if (!data.items || data.items.length === 0) {
        throw new Error('At least one sales order item is required');
      }

      const { items, ...orderData } = data;

      const customerId = this.isValidUUID(orderData.customer_id) ? orderData.customer_id : null;

      // Only include columns that exist in the database
      const cleanOrderData: any = {
        customer_id: customerId,
        customer_name: orderData.customer_name.trim(),
        customer_email: orderData.customer_email || null,
        sales_order_number: orderData.sales_order_number,
        order_date: orderData.order_date,
        expected_shipment_date: orderData.expected_shipment_date || null,
        status: orderData.status || 'draft',
        subtotal: Number(orderData.subtotal) || 0,
        discount_type: orderData.discount_type || 'percentage',
        discount_value: Number(orderData.discount_value) || 0,
        discount_amount: Number(orderData.discount_amount) || 0,
        cgst_rate: Number(orderData.cgst_rate) || 0,
        cgst_amount: Number(orderData.cgst_amount) || 0,
        sgst_rate: Number(orderData.sgst_rate) || 0,
        sgst_amount: Number(orderData.sgst_amount) || 0,
        igst_rate: Number(orderData.igst_rate) || 0,
        igst_amount: Number(orderData.igst_amount) || 0,
        tax_amount: Number(orderData.tax_amount) || 0,
        shipping_charges: Number(orderData.shipping_charges) || 0,
        adjustment: Number(orderData.adjustment) || 0,
        total_amount: Number(orderData.total_amount) || 0,
        notes: orderData.notes || null,
        terms_and_conditions: orderData.terms_and_conditions || null
      };

      console.log('SalesOrdersService: Cleaned sales order data:', JSON.stringify(cleanOrderData, null, 2));

      const { data: salesOrder, error: orderError } = await supabase
        .from('sales_orders')
        .insert([cleanOrderData])
        .select()
        .single();

      if (orderError) {
        console.error('SalesOrdersService: Error inserting sales order:', orderError);
        throw new Error(`Failed to create sales order: ${orderError.message}. ${orderError.hint || ''}`);
      }

      console.log('SalesOrdersService: Sales order created successfully:', salesOrder.id);

      if (items && items.length > 0) {
        const itemsToInsert = items.map(item => {
          const itemId = this.isValidUUID(item.item_id) ? item.item_id : null;

          return {
            sales_order_id: salesOrder.id,
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

        console.log('SalesOrdersService: Inserting sales order items:', JSON.stringify(itemsToInsert, null, 2));

        const { error: itemsError } = await supabase
          .from('sales_order_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error('SalesOrdersService: Error inserting items:', itemsError);
          await supabase.from('sales_orders').delete().eq('id', salesOrder.id);
          throw new Error(`Failed to create sales order items: ${itemsError.message}. ${itemsError.hint || ''}`);
        }

        console.log('SalesOrdersService: Sales order items created successfully');
      }

      const completeSalesOrder = await this.getSalesOrderById(salesOrder.id);
      console.log('SalesOrdersService: Complete sales order fetched:', completeSalesOrder.id);
      return completeSalesOrder;
    } catch (error: any) {
      console.error('SalesOrdersService: Error creating sales order:', error);
      throw error;
    }
  }

  /**
   * Get all sales orders with optional filters
   */
  async getAllSalesOrders(filters?: {
    status?: string;
    customer_id?: string;
    from_date?: string;
    to_date?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      let query = supabase
        .from('sales_orders')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }
      if (filters?.from_date) {
        query = query.gte('order_date', filters.from_date);
      }
      if (filters?.to_date) {
        query = query.lte('order_date', filters.to_date);
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
        salesOrders: data || [],
        total: count || 0,
        page,
        limit
      };
    } catch (error) {
      console.error('Error fetching sales orders:', error);
      throw error;
    }
  }

  /**
   * Get a single sales order by ID with items
   */
  async getSalesOrderById(id: string) {
    try {
      const { data: salesOrder, error: orderError } = await supabase
        .from('sales_orders')
        .select('*')
        .eq('id', id)
        .single();

      if (orderError) {
        throw orderError;
      }

      const { data: items, error: itemsError } = await supabase
        .from('sales_order_items')
        .select('*')
        .eq('sales_order_id', id);

      if (itemsError) {
        throw itemsError;
      }

      return {
        ...salesOrder,
        items: items || []
      };
    } catch (error) {
      console.error('Error fetching sales order:', error);
      throw error;
    }
  }

  /**
   * Update an existing sales order
   */
  async updateSalesOrder(id: string, data: Partial<CreateSalesOrderData>) {
    try {
      const { items, ...orderData } = data;

      // Build update object with only valid columns
      const updateData: any = {};
      if (orderData.customer_name !== undefined) updateData.customer_name = orderData.customer_name;
      if (orderData.customer_email !== undefined) updateData.customer_email = orderData.customer_email;
      if (orderData.order_date !== undefined) updateData.order_date = orderData.order_date;
      if (orderData.expected_shipment_date !== undefined) updateData.expected_shipment_date = orderData.expected_shipment_date;
      if (orderData.status !== undefined) updateData.status = orderData.status;
      if (orderData.subtotal !== undefined) updateData.subtotal = Number(orderData.subtotal);
      if (orderData.discount_type !== undefined) updateData.discount_type = orderData.discount_type;
      if (orderData.discount_value !== undefined) updateData.discount_value = Number(orderData.discount_value);
      if (orderData.discount_amount !== undefined) updateData.discount_amount = Number(orderData.discount_amount);
      if (orderData.cgst_rate !== undefined) updateData.cgst_rate = Number(orderData.cgst_rate);
      if (orderData.cgst_amount !== undefined) updateData.cgst_amount = Number(orderData.cgst_amount);
      if (orderData.sgst_rate !== undefined) updateData.sgst_rate = Number(orderData.sgst_rate);
      if (orderData.sgst_amount !== undefined) updateData.sgst_amount = Number(orderData.sgst_amount);
      if (orderData.igst_rate !== undefined) updateData.igst_rate = Number(orderData.igst_rate);
      if (orderData.igst_amount !== undefined) updateData.igst_amount = Number(orderData.igst_amount);
      if (orderData.tax_amount !== undefined) updateData.tax_amount = Number(orderData.tax_amount);
      if (orderData.shipping_charges !== undefined) updateData.shipping_charges = Number(orderData.shipping_charges);
      if (orderData.adjustment !== undefined) updateData.adjustment = Number(orderData.adjustment);
      if (orderData.total_amount !== undefined) updateData.total_amount = Number(orderData.total_amount);
      if (orderData.notes !== undefined) updateData.notes = orderData.notes;
      if (orderData.terms_and_conditions !== undefined) updateData.terms_and_conditions = orderData.terms_and_conditions;

      const { data: salesOrder, error: orderError } = await supabase
        .from('sales_orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      if (items) {
        await supabase.from('sales_order_items').delete().eq('sales_order_id', id);

        if (items.length > 0) {
          const itemsToInsert = items.map(item => ({
            sales_order_id: id,
            item_id: this.isValidUUID(item.item_id) ? item.item_id : null,
            item_name: item.item_name || '',
            description: item.description || null,
            quantity: Number(item.quantity) || 0,
            unit_of_measurement: item.unit_of_measurement || 'pcs',
            rate: Number(item.rate) || 0,
            amount: Number(item.amount) || 0,
            stock_on_hand: Number(item.stock_on_hand) || 0
          }));

          const { error: itemsError } = await supabase
            .from('sales_order_items')
            .insert(itemsToInsert);

          if (itemsError) {
            throw itemsError;
          }
        }
      }

      return await this.getSalesOrderById(id);
    } catch (error) {
      console.error('Error updating sales order:', error);
      throw error;
    }
  }

  /**
   * Delete a sales order
   */
  async deleteSalesOrder(id: string) {
    try {
      await supabase.from('sales_order_items').delete().eq('sales_order_id', id);

      const { error } = await supabase
        .from('sales_orders')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting sales order:', error);
      throw error;
    }
  }
}
