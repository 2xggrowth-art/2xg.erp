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
  destination_bin_id?: string;
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
   * Get item stock grouped by location (for transfer order form)
   */
  async getItemStockByLocation(itemId: string): Promise<{ location_name: string; available_quantity: number }[]> {
    try {
      // Get purchase allocations for this item (adds stock)
      const { data: purchaseAllocations, error: purchaseError } = await supabaseAdmin
        .from('bill_item_bin_allocations')
        .select(`
          quantity,
          bin_locations!inner (
            location_id,
            warehouse,
            locations(name)
          ),
          bill_items!inner (
            item_id
          )
        `)
        .eq('bill_items.item_id', itemId);

      if (purchaseError) throw purchaseError;

      // Get sale allocations for this item (deducts stock)
      const { data: salesAllocations, error: salesError } = await supabaseAdmin
        .from('invoice_item_bin_allocations')
        .select(`
          quantity,
          bin_locations!inner (
            location_id,
            warehouse,
            locations(name)
          ),
          invoice_items!inner (
            item_id
          )
        `)
        .eq('invoice_items.item_id', itemId);

      if (salesError) throw salesError;

      // Aggregate by location
      const locationMap = new Map<string, number>();

      purchaseAllocations?.forEach((alloc: any) => {
        const locationName = alloc.bin_locations?.locations?.name || alloc.bin_locations?.warehouse || 'Unknown';
        const qty = parseFloat(alloc.quantity) || 0;
        locationMap.set(locationName, (locationMap.get(locationName) || 0) + qty);
      });

      salesAllocations?.forEach((alloc: any) => {
        const locationName = alloc.bin_locations?.locations?.name || alloc.bin_locations?.warehouse || 'Unknown';
        const qty = parseFloat(alloc.quantity) || 0;
        locationMap.set(locationName, (locationMap.get(locationName) || 0) - qty);
      });

      // Get transfer allocations for this item
      const { data: transferAllocations } = await supabaseAdmin
        .from('transfer_order_allocations')
        .select('source_bin_location_id, destination_bin_location_id, quantity')
        .eq('item_id', itemId);

      if (transferAllocations && transferAllocations.length > 0) {
        // Get all bin IDs involved in transfers
        const binIds = new Set<string>();
        transferAllocations.forEach((a: any) => {
          binIds.add(a.source_bin_location_id);
          binIds.add(a.destination_bin_location_id);
        });

        // Fetch bin → location mapping
        const { data: bins } = await supabaseAdmin
          .from('bin_locations')
          .select('id, location_id, warehouse, locations(name)')
          .in('id', Array.from(binIds));

        const binLocationMap = new Map<string, string>();
        bins?.forEach((bin: any) => {
          binLocationMap.set(bin.id, bin.locations?.name || bin.warehouse || 'Unknown');
        });

        // Deduct from source locations
        transferAllocations.forEach((alloc: any) => {
          const locationName = binLocationMap.get(alloc.source_bin_location_id) || 'Unknown';
          const qty = parseFloat(alloc.quantity) || 0;
          locationMap.set(locationName, (locationMap.get(locationName) || 0) - qty);
        });

        // Add to destination locations
        transferAllocations.forEach((alloc: any) => {
          const locationName = binLocationMap.get(alloc.destination_bin_location_id) || 'Unknown';
          const qty = parseFloat(alloc.quantity) || 0;
          locationMap.set(locationName, (locationMap.get(locationName) || 0) + qty);
        });
      }

      // Return locations with positive stock
      return Array.from(locationMap.entries())
        .filter(([_, qty]) => qty > 0)
        .map(([name, qty]) => ({ location_name: name, available_quantity: qty }))
        .sort((a, b) => b.available_quantity - a.available_quantity);
    } catch (error) {
      console.error('Error fetching item stock by location:', error);
      throw error;
    }
  }

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
      const { items, destination_bin_id, ...mainData } = orderData;

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

      // If created with 'initiated' status, process stock movement
      if ((mainData.status || 'draft') === 'initiated') {
        await this.processTransferStockMovement(order.id, destination_bin_id);
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
      // If initiating, process stock movement
      if (status === 'initiated') {
        await this.processTransferStockMovement(id);
      }

      // If cancelling, reverse stock movement (delete allocations)
      if (status === 'cancelled') {
        await supabaseAdmin
          .from('transfer_order_allocations')
          .delete()
          .eq('transfer_order_id', id);
      }

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

  /**
   * Process stock movement for a transfer order.
   * Creates allocation records that move stock from source bins to destination bins.
   */
  private async processTransferStockMovement(transferOrderId: string, destinationBinId?: string): Promise<void> {
    const order = await this.getTransferOrderById(transferOrderId);

    if (!order.items || order.items.length === 0) {
      throw new Error('Transfer order has no items');
    }

    // Find location records by name
    const { data: sourceLocation } = await supabaseAdmin
      .from('locations')
      .select('id')
      .eq('name', order.source_location)
      .single();

    const { data: destLocation } = await supabaseAdmin
      .from('locations')
      .select('id')
      .eq('name', order.destination_location)
      .single();

    if (!sourceLocation) throw new Error(`Source location '${order.source_location}' not found`);
    if (!destLocation) throw new Error(`Destination location '${order.destination_location}' not found`);

    // Get active bins at source location
    const { data: sourceBins } = await supabaseAdmin
      .from('bin_locations')
      .select('id, bin_code')
      .eq('location_id', sourceLocation.id)
      .eq('status', 'active');

    if (!sourceBins || sourceBins.length === 0) {
      throw new Error(`No active bins at source location '${order.source_location}'`);
    }

    // Get active bins at destination location
    const { data: destBins } = await supabaseAdmin
      .from('bin_locations')
      .select('id, bin_code')
      .eq('location_id', destLocation.id)
      .eq('status', 'active');

    if (!destBins || destBins.length === 0) {
      throw new Error(`No active bins at destination location '${order.destination_location}'`);
    }

    // Use the user-selected destination bin if provided and valid, otherwise fall back to first bin
    let destBinId = destBins[0].id;
    if (destinationBinId) {
      const validBin = destBins.find((b: any) => b.id === destinationBinId);
      if (validBin) {
        destBinId = validBin.id;
      }
    }

    for (const item of order.items) {
      if (!item.item_id || !item.transfer_quantity) continue;

      // Find which source bin has stock for this item
      // Check bill_item_bin_allocations for each source bin
      let bestSourceBinId = sourceBins[0].id;
      let bestStock = 0;

      for (const bin of sourceBins) {
        // Sum purchases for this item in this bin
        const { data: purchases } = await supabaseAdmin
          .from('bill_item_bin_allocations')
          .select('quantity, bill_items!inner(item_id)')
          .eq('bin_location_id', bin.id)
          .eq('bill_items.item_id', item.item_id);

        const purchaseQty = purchases?.reduce((sum: number, p: any) => sum + (parseFloat(p.quantity) || 0), 0) || 0;

        // Sum sales for this item in this bin
        const { data: sales } = await supabaseAdmin
          .from('invoice_item_bin_allocations')
          .select('quantity, invoice_items!inner(item_id)')
          .eq('bin_location_id', bin.id)
          .eq('invoice_items.item_id', item.item_id);

        const salesQty = sales?.reduce((sum: number, s: any) => sum + (parseFloat(s.quantity) || 0), 0) || 0;

        // Sum existing transfer deductions from this bin
        const { data: transfersOut } = await supabaseAdmin
          .from('transfer_order_allocations')
          .select('quantity')
          .eq('source_bin_location_id', bin.id)
          .eq('item_id', item.item_id);

        const transferOutQty = transfersOut?.reduce((sum: number, t: any) => sum + (parseFloat(t.quantity) || 0), 0) || 0;

        // Sum existing transfer additions to this bin
        const { data: transfersIn } = await supabaseAdmin
          .from('transfer_order_allocations')
          .select('quantity')
          .eq('destination_bin_location_id', bin.id)
          .eq('item_id', item.item_id);

        const transferInQty = transfersIn?.reduce((sum: number, t: any) => sum + (parseFloat(t.quantity) || 0), 0) || 0;

        const netStock = purchaseQty - salesQty - transferOutQty + transferInQty;

        if (netStock > bestStock) {
          bestStock = netStock;
          bestSourceBinId = bin.id;
        }
      }

      // Create the allocation record
      const { error: allocError } = await supabaseAdmin
        .from('transfer_order_allocations')
        .insert({
          transfer_order_id: transferOrderId,
          transfer_order_item_id: item.id,
          item_id: item.item_id,
          source_bin_location_id: bestSourceBinId,
          destination_bin_location_id: destBinId,
          quantity: item.transfer_quantity,
        });

      if (allocError) throw allocError;
    }
  }
}
