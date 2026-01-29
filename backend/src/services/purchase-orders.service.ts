import { supabaseAdmin } from '../config/supabase';

export class PurchaseOrdersService {
  /**
   * Get all purchase orders with optional filters
   */
  async getAllPurchaseOrders(filters?: {
    status?: string;
    vendorId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    let query = supabaseAdmin
      .from('purchase_orders')
      .select(`
        *,
        purchase_order_items (*)
      `)
      .order('created_at', { ascending: false});

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.vendorId) {
      query = query.eq('supplier_id', filters.vendorId);
    }
    if (filters?.dateFrom) {
      query = query.gte('order_date', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('order_date', filters.dateTo);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /**
   * Get PO by ID with items
   */
  async getPurchaseOrderById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('purchase_orders')
      .select(`
        *,
        purchase_order_items (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Generate next PO number
   */
  async generatePONumber() {
    const { data, error } = await supabaseAdmin
      .from('purchase_orders')
      .select('po_number')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!data || data.length === 0) {
      return 'PO-00001';
    }

    const lastPONumber = data[0].po_number;
    const match = lastPONumber.match(/PO-(\d+)/);

    if (match) {
      const nextNum = parseInt(match[1]) + 1;
      return `PO-${nextNum.toString().padStart(5, '0')}`;
    }

    return 'PO-00001';
  }

  /**
   * Create new purchase order with items
   */
  async createPurchaseOrder(poData: any) {
    // Validate required fields - vendor_name is required, vendor_id is optional (for manual entries)
    if (!poData.vendor_name) {
      throw new Error('Vendor name is required');
    }

    if (!poData.items || poData.items.length === 0) {
      throw new Error('At least one item is required');
    }

    // Get organization_id
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .limit(1)
      .single();

    // Calculate totals
    const subtotal = poData.items.reduce((sum: number, item: any) => {
      const itemTotal = (item.quantity || 0) * (item.rate || 0);
      return sum + itemTotal;
    }, 0);

    let discountAmount = 0;
    if (poData.discount_type === 'percentage') {
      discountAmount = (subtotal * (poData.discount_value || 0)) / 100;
    } else {
      discountAmount = poData.discount_value || 0;
    }

    const afterDiscount = subtotal - discountAmount;

    let taxAmount = 0;
    if (poData.tds_tcs_type && poData.tds_tcs_rate) {
      taxAmount = (afterDiscount * poData.tds_tcs_rate) / 100;
    }

    const adjustment = parseFloat(poData.adjustment) || 0;
    const totalAmount = afterDiscount + taxAmount + adjustment;

    // Create PO
    const newPO = {
      organization_id: org?.id,
      po_number: poData.po_number,
      auto_po_number: poData.auto_po_number !== false,
      supplier_id: poData.vendor_id || null,
      supplier_name: poData.vendor_name,
      supplier_email: poData.vendor_email || null,
      location_id: poData.location_id || null,
      delivery_address_type: poData.delivery_address_type || 'location',
      delivery_address: poData.delivery_address || null,
      order_date: poData.order_date || new Date().toISOString().split('T')[0],
      expected_delivery_date: poData.expected_delivery_date || null,
      status: poData.status || 'draft',
      subtotal,
      discount_type: poData.discount_type || 'percentage',
      discount_value: poData.discount_value || 0,
      tax_amount: taxAmount,
      tds_tcs_type: poData.tds_tcs_type || null,
      tds_tcs_rate: poData.tds_tcs_rate || 0,
      tds_tcs_amount: taxAmount,
      adjustment,
      total_amount: totalAmount,
      // Order Details
      payment_terms: poData.payment_terms || null,
      other_references: poData.other_references || null,
      terms_of_delivery: poData.terms_of_delivery || null,
      // Receipt Details
      dispatch_through: poData.dispatch_through || null,
      destination: poData.destination || null,
      carrier_name_agent: poData.carrier_name_agent || null,
      bill_of_lading_no: poData.bill_of_lading_no || null,
      bill_of_lading_date: poData.bill_of_lading_date || null,
      motor_vehicle_no: poData.motor_vehicle_no || null,
      terms_and_conditions: poData.terms_and_conditions || null,
      attachment_urls: poData.attachment_urls || [],
      created_by: poData.created_by || null,
    };

    const { data: purchaseOrder, error: poError } = await supabaseAdmin
      .from('purchase_orders')
      .insert(newPO)
      .select()
      .single();

    if (poError) throw poError;

    // Create PO Items
    const items = poData.items.map((item: any) => ({
      purchase_order_id: purchaseOrder.id,
      item_id: item.item_id || null,
      item_name: item.item_name || '',
      description: item.description || null,
      account: item.account || 'Cost of Goods Sold',
      quantity: item.quantity || 0,
      unit_price: item.rate || 0,
      unit_of_measurement: item.unit_of_measurement || item.unit || 'pcs',
      tax_rate: item.tax_rate || 0,
      discount: item.discount || 0,
      total: (item.quantity || 0) * (item.rate || 0)
    }));

    const { data: poItems, error: itemsError } = await supabaseAdmin
      .from('purchase_order_items')
      .insert(items)
      .select();

    if (itemsError) throw itemsError;

    return {
      ...purchaseOrder,
      items: poItems
    };
  }

  /**
   * Update purchase order
   */
  async updatePurchaseOrder(id: string, poData: any) {
    const { data, error } = await supabaseAdmin
      .from('purchase_orders')
      .update(poData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete purchase order
   */
  async deletePurchaseOrder(id: string) {
    const { data, error } = await supabaseAdmin
      .from('purchase_orders')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get PO summary/statistics
   */
  async getPurchaseOrdersSummary() {
    const { data, error } = await supabaseAdmin
      .from('purchase_orders')
      .select('status, total_amount');

    if (error) throw error;

    const draftCount = data.filter(po => po.status === 'draft').length;
    const sentCount = data.filter(po => po.status === 'sent').length;
    const receivedCount = data.filter(po => po.status === 'received').length;
    const totalValue = data.reduce((sum, po) => sum + (po.total_amount || 0), 0);

    return {
      draftCount,
      sentCount,
      receivedCount,
      totalValue,
      totalCount: data.length,
      currency: 'INR'
    };
  }
}
