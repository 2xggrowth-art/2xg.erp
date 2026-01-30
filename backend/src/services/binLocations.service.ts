import { supabaseAdmin } from '../config/supabase';

export class BinLocationsService {
  /**
   * Get all bin locations with optional filters
   */
  async getAllBinLocations(filters?: {
    warehouse?: string;
    status?: string;
    search?: string;
  }) {
    let query = supabaseAdmin
      .from('bin_locations')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.warehouse) {
      query = query.ilike('warehouse', `%${filters.warehouse}%`);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      query = query.or(`bin_code.ilike.%${filters.search}%,warehouse.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  /**
   * Get bin location by ID
   */
  async getBinLocationById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('bin_locations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Check if bin code already exists
   */
  async checkBinCodeExists(binCode: string, excludeId?: string) {
    let query = supabaseAdmin
      .from('bin_locations')
      .select('id')
      .eq('bin_code', binCode);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return !!data;
  }

  /**
   * Create a new bin location
   */
  async createBinLocation(binLocationData: {
    bin_code: string;
    warehouse: string;
    description?: string;
    status?: string;
  }) {
    // Check if bin code already exists
    const exists = await this.checkBinCodeExists(binLocationData.bin_code);
    if (exists) {
      throw new Error(`Bin code '${binLocationData.bin_code}' already exists`);
    }

    const newBinLocation = {
      bin_code: binLocationData.bin_code.trim(),
      warehouse: binLocationData.warehouse.trim(),
      description: binLocationData.description?.trim() || null,
      status: binLocationData.status || 'active'
    };

    const { data, error } = await supabaseAdmin
      .from('bin_locations')
      .insert(newBinLocation)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update an existing bin location
   */
  async updateBinLocation(id: string, binLocationData: {
    bin_code?: string;
    warehouse?: string;
    description?: string;
    status?: string;
  }) {
    // If updating bin code, check if new code already exists
    if (binLocationData.bin_code) {
      const exists = await this.checkBinCodeExists(binLocationData.bin_code, id);
      if (exists) {
        throw new Error(`Bin code '${binLocationData.bin_code}' already exists`);
      }
    }

    const updateData: any = {};

    if (binLocationData.bin_code !== undefined) {
      updateData.bin_code = binLocationData.bin_code.trim();
    }
    if (binLocationData.warehouse !== undefined) {
      updateData.warehouse = binLocationData.warehouse.trim();
    }
    if (binLocationData.description !== undefined) {
      updateData.description = binLocationData.description?.trim() || null;
    }
    if (binLocationData.status !== undefined) {
      updateData.status = binLocationData.status;
    }

    const { data, error } = await supabaseAdmin
      .from('bin_locations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a bin location (hard delete)
   */
  async deleteBinLocation(id: string) {
    const { data, error } = await supabaseAdmin
      .from('bin_locations')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get bin locations with their current NET stock (purchases minus sales)
   */
  async getBinLocationsWithStock() {
    try {
      // Get all bin locations
      const { data: bins, error: binsError } = await supabaseAdmin
        .from('bin_locations')
        .select('*')
        .order('bin_code', { ascending: true });

      if (binsError) throw binsError;

      // Get all bill item bin allocations (PURCHASES — adds stock)
      const { data: purchaseAllocations, error: purchaseError } = await supabaseAdmin
        .from('bill_item_bin_allocations')
        .select(`
          id,
          bin_location_id,
          quantity,
          created_at,
          bill_items!inner (
            id,
            item_id,
            item_name,
            unit_of_measurement,
            bill_id,
            bills!inner (
              bill_number,
              bill_date
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (purchaseError) throw purchaseError;

      // Get all invoice item bin allocations (SALES — deducts stock)
      const { data: salesAllocations, error: salesError } = await supabaseAdmin
        .from('invoice_item_bin_allocations')
        .select(`
          id,
          bin_location_id,
          quantity,
          created_at,
          invoice_items!inner (
            id,
            item_id,
            item_name,
            unit_of_measurement,
            invoice_id,
            invoices!inner (
              invoice_number,
              invoice_date
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;

      // Group allocations by bin_location_id and aggregate quantities
      const binStockMap = new Map();

      // Process PURCHASES (add to stock)
      if (purchaseAllocations) {
        purchaseAllocations.forEach((allocation: any) => {
          const binId = allocation.bin_location_id;
          const itemId = allocation.bill_items?.item_id || allocation.bill_items?.id;
          const itemName = allocation.bill_items?.item_name || 'Unknown Item';
          const quantity = parseFloat(allocation.quantity) || 0;
          const unitOfMeasurement = allocation.bill_items?.unit_of_measurement || 'pcs';

          if (!binStockMap.has(binId)) {
            binStockMap.set(binId, new Map());
          }

          const binItems = binStockMap.get(binId);

          if (binItems.has(itemId)) {
            const existing = binItems.get(itemId);
            existing.quantity += quantity;
            existing.transactions.push({
              type: 'purchase',
              reference: allocation.bill_items?.bills?.bill_number,
              date: allocation.bill_items?.bills?.bill_date,
              quantity: allocation.quantity,
              created_at: allocation.created_at
            });
          } else {
            binItems.set(itemId, {
              item_id: itemId,
              item_name: itemName,
              quantity: quantity,
              unit_of_measurement: unitOfMeasurement,
              transactions: [{
                type: 'purchase',
                reference: allocation.bill_items?.bills?.bill_number,
                date: allocation.bill_items?.bills?.bill_date,
                quantity: allocation.quantity,
                created_at: allocation.created_at
              }]
            });
          }
        });
      }

      // Process SALES (deduct from stock)
      if (salesAllocations) {
        salesAllocations.forEach((allocation: any) => {
          const binId = allocation.bin_location_id;
          const itemId = allocation.invoice_items?.item_id || allocation.invoice_items?.id;
          const itemName = allocation.invoice_items?.item_name || 'Unknown Item';
          const quantity = parseFloat(allocation.quantity) || 0;
          const unitOfMeasurement = allocation.invoice_items?.unit_of_measurement || 'pcs';

          if (!binStockMap.has(binId)) {
            binStockMap.set(binId, new Map());
          }

          const binItems = binStockMap.get(binId);

          if (binItems.has(itemId)) {
            const existing = binItems.get(itemId);
            existing.quantity -= quantity;
            existing.transactions.push({
              type: 'sale',
              reference: allocation.invoice_items?.invoices?.invoice_number,
              date: allocation.invoice_items?.invoices?.invoice_date,
              quantity: -quantity,
              created_at: allocation.created_at
            });
          } else {
            binItems.set(itemId, {
              item_id: itemId,
              item_name: itemName,
              quantity: -quantity,
              unit_of_measurement: unitOfMeasurement,
              transactions: [{
                type: 'sale',
                reference: allocation.invoice_items?.invoices?.invoice_number,
                date: allocation.invoice_items?.invoices?.invoice_date,
                quantity: -quantity,
                created_at: allocation.created_at
              }]
            });
          }
        });
      }

      // Combine bins with their stock information (filter out zero/negative items)
      const binsWithStock = bins?.map(bin => {
        const items = binStockMap.get(bin.id);
        const itemsArray = items
          ? Array.from(items.values()).filter((item: any) => item.quantity > 0)
          : [];
        const totalQuantity = itemsArray.reduce((sum, item: any) => sum + item.quantity, 0);

        return {
          ...bin,
          items: itemsArray,
          total_items: itemsArray.length,
          total_quantity: totalQuantity
        };
      }) || [];

      return binsWithStock;
    } catch (error) {
      console.error('Error fetching bin locations with stock:', error);
      throw error;
    }
  }

  /**
   * Get bin locations for a specific item
   */
  async getBinLocationsForItem(itemId: string) {
    try {
      // Get all bill item bin allocations for this item (PURCHASES - adds to bins)
      const { data: purchaseAllocations, error: purchaseError } = await supabaseAdmin
        .from('bill_item_bin_allocations')
        .select(`
          id,
          bin_location_id,
          quantity,
          created_at,
          bin_locations!inner (
            id,
            bin_code,
            warehouse,
            description,
            status
          ),
          bill_items!inner (
            id,
            item_id,
            item_name,
            unit_of_measurement,
            bill_id,
            bills (
              bill_number,
              bill_date
            )
          )
        `)
        .eq('bill_items.item_id', itemId)
        .order('created_at', { ascending: false });

      if (purchaseError) throw purchaseError;

      // Get all invoice item bin allocations for this item (SALES - deducts from bins)
      const { data: salesAllocations, error: salesError } = await supabaseAdmin
        .from('invoice_item_bin_allocations')
        .select(`
          id,
          bin_location_id,
          quantity,
          created_at,
          bin_locations!inner (
            id,
            bin_code,
            warehouse,
            description,
            status
          ),
          invoice_items!inner (
            id,
            item_id,
            item_name,
            unit_of_measurement,
            invoice_id,
            invoices (
              invoice_number,
              invoice_date
            )
          )
        `)
        .eq('invoice_items.item_id', itemId)
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;

      // Group by bin location and calculate NET quantities (purchases - sales)
      const binMap = new Map();

      // Process purchases (ADD to bin quantities)
      if (purchaseAllocations) {
        purchaseAllocations.forEach((allocation: any) => {
          const binId = allocation.bin_locations.id;
          const binCode = allocation.bin_locations.bin_code;
          const warehouse = allocation.bin_locations.warehouse;
          const description = allocation.bin_locations.description;
          const status = allocation.bin_locations.status;
          const quantity = parseFloat(allocation.quantity) || 0;
          const unitOfMeasurement = allocation.bill_items?.unit_of_measurement || 'pcs';

          if (!binMap.has(binId)) {
            binMap.set(binId, {
              bin_id: binId,
              bin_code: binCode,
              warehouse: warehouse,
              description: description,
              status: status,
              quantity: 0,
              unit_of_measurement: unitOfMeasurement,
              transactions: []
            });
          }

          const binData = binMap.get(binId);
          binData.quantity += quantity; // Add purchases
          binData.transactions.push({
            type: 'purchase',
            bill_number: allocation.bill_items?.bills?.bill_number,
            bill_date: allocation.bill_items?.bills?.bill_date,
            quantity: allocation.quantity,
            created_at: allocation.created_at
          });
        });
      }

      // Process sales (DEDUCT from bin quantities)
      if (salesAllocations) {
        salesAllocations.forEach((allocation: any) => {
          const binId = allocation.bin_locations.id;
          const binCode = allocation.bin_locations.bin_code;
          const warehouse = allocation.bin_locations.warehouse;
          const description = allocation.bin_locations.description;
          const status = allocation.bin_locations.status;
          const quantity = parseFloat(allocation.quantity) || 0;
          const unitOfMeasurement = allocation.invoice_items?.unit_of_measurement || 'pcs';

          if (!binMap.has(binId)) {
            binMap.set(binId, {
              bin_id: binId,
              bin_code: binCode,
              warehouse: warehouse,
              description: description,
              status: status,
              quantity: 0,
              unit_of_measurement: unitOfMeasurement,
              transactions: []
            });
          }

          const binData = binMap.get(binId);
          binData.quantity -= quantity; // Deduct sales
          binData.transactions.push({
            type: 'sale',
            invoice_number: allocation.invoice_items?.invoices?.invoice_number,
            invoice_date: allocation.invoice_items?.invoices?.invoice_date,
            quantity: -allocation.quantity, // Negative to show deduction
            created_at: allocation.created_at
          });
        });
      }

      // Convert map to array, filter out bins with zero or negative quantity, and sort by quantity descending
      const binLocations = Array.from(binMap.values())
        .filter((bin: any) => bin.quantity > 0) // Only show bins with positive quantities
        .sort((a: any, b: any) => b.quantity - a.quantity);

      return binLocations;
    } catch (error) {
      console.error('Error fetching bin locations for item:', error);
      throw error;
    }
  }
}
