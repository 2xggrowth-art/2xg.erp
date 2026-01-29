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
  customer_phone?: string;
  sales_order_number?: string;
  reference_number?: string;
  sales_order_date: string;
  expected_shipment_date?: string;
  payment_terms?: string;
  salesperson_id?: string;
  salesperson_name?: string;
  delivery_method?: string;
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

      if (!data.sales_order_date) {
        throw new Error('Sales order date is required');
      }

      if (!data.items || data.items.length === 0) {
        throw new Error('At least one sales order item is required');
      }

      const { items, ...orderData } = data;
      const defaultOrgId = '00000000-0000-0000-0000-000000000001';

      const customerId = this.isValidUUID(orderData.customer_id) ? orderData.customer_id : null;
      const salespersonId = this.isValidUUID(orderData.salesperson_id) ? orderData.salesperson_id : null;

      const cleanOrderData: any = {
        organization_id: defaultOrgId,
        customer_id: customerId,
        customer_name: orderData.customer_name.trim(),
        customer_email: orderData.customer_email || null,
        customer_phone: orderData.customer_phone || null,
        sales_order_number: orderData.sales_order_number,
        reference_number: orderData.reference_number || null,
        sales_order_date: orderData.sales_order_date,
        expected_shipment_date: orderData.expected_shipment_date || null,
        payment_terms: orderData.payment_terms || 'due_on_receipt',
        salesperson_id: salespersonId,
        salesperson_name: orderData.salesperson_name || null,
        delivery_method: orderData.delivery_method || null,
        status: orderData.status || 'draft',
        subtotal: Number(orderData.subtotal) || 0,
        discount_type: orderData.discount_type || 'percentage',
        discount_value: Number(orderData.discount_value) || 0,
        discount_amount: Number(orderData.discount_amount) || 0,
        tax_amount: Number(orderData.tax_amount) || 0,
        tds_tcs_type: orderData.tds_tcs_type || null,
        tds_tcs_rate: orderData.tds_tcs_rate || null,
        tds_tcs_amount: Number(orderData.tds_tcs_amount) || 0,
        shipping_charges: Number(orderData.shipping_charges) || 0,
        adjustment: Number(orderData.adjustment) || 0,
        total_amount: Number(orderData.total_amount) || 0,
        customer_notes: orderData.customer_notes || null,
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
        query = query.gte('sales_order_date', filters.from_date);
      }
      if (filters?.to_date) {
        query = query.lte('sales_order_date', filters.to_date);
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

      const { data: salesOrder, error: orderError } = await supabase
        .from('sales_orders')
        .update(orderData)
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
            ...item,
            sales_order_id: id
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
