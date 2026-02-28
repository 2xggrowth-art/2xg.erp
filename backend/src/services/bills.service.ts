import { supabaseAdmin as supabase } from '../config/supabase';
import { BatchesService } from './batches.service';
import { placementTasksService } from './placementTasks.service';
import { AssemblyService } from './assembly.service';

const batchesService = new BatchesService();
const assemblyService = new AssemblyService();

export interface BinAllocation {
  bin_location_id: string;
  bin_code: string;
  warehouse: string;
  quantity: number;
}

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
  serial_numbers?: string[];
  bin_allocations?: BinAllocation[];
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
  cgst_rate?: number;
  cgst_amount?: number;
  sgst_rate?: number;
  sgst_amount?: number;
  igst_rate?: number;
  igst_amount?: number;
  cess_amount?: number;
  place_of_supply?: string;
  supply_type?: string;
  reverse_charge?: boolean;
  vendor_gstin?: string;
  tds_tcs_type?: string;
  tds_tcs_rate?: number;
  tds_tcs_amount?: number;
  itc_eligible?: boolean;
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
      // Get the highest BILL-XXXX number (filter by prefix, not just latest by date)
      const { data: bills, error } = await supabase
        .from('bills')
        .select('bill_number')
        .like('bill_number', 'BILL-%')
        .order('bill_number', { ascending: false })
        .limit(1);

      if (error) {
        throw error;
      }

      if (!bills || bills.length === 0) {
        return 'BILL-0001';
      }

      // Extract number from bill_number (e.g., "BILL-0002" -> 2)
      const match = bills[0].bill_number.match(/BILL-(\d+)/);
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

      // === VALIDATION GUARDS ===

      // Test #55: Duplicate bill number per vendor
      if (data.vendor_id) {
        const { data: existingBill } = await supabase
          .from('bills')
          .select('id')
          .eq('bill_number', billNumber)
          .eq('vendor_id', data.vendor_id)
          .limit(1);

        if (existingBill && existingBill.length > 0) {
          throw new Error(`Bill number "${billNumber}" already exists for this vendor.`);
        }
      }

      // Test #51: If linked to PO, warn if bill qty > PO qty
      if (data.purchase_order_id && data.items) {
        try {
          const { data: poItems } = await supabase
            .from('purchase_order_items')
            .select('item_id, item_name, quantity')
            .eq('purchase_order_id', data.purchase_order_id);

          if (poItems && poItems.length > 0) {
            for (const billItem of data.items) {
              const poItem = poItems.find((p: any) => p.item_id === billItem.item_id);
              if (poItem && Number(billItem.quantity) > Number(poItem.quantity)) {
                console.warn(`BillsService: Item "${billItem.item_name}" bill qty (${billItem.quantity}) exceeds PO qty (${poItem.quantity})`);
              }
            }
          }
        } catch (poErr) {
          console.warn('BillsService: Could not validate PO quantities:', poErr);
        }
      }

      // Test #62: Block creating a bill if total is zero or negative
      if (Number(data.total_amount) <= 0) {
        throw new Error('Bill total amount must be greater than zero');
      }

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
          cgst_rate: Number(data.cgst_rate) || 0,
          cgst_amount: Number(data.cgst_amount) || 0,
          sgst_rate: Number(data.sgst_rate) || 0,
          sgst_amount: Number(data.sgst_amount) || 0,
          igst_rate: Number(data.igst_rate) || 0,
          igst_amount: Number(data.igst_amount) || 0,
          cess_amount: Number(data.cess_amount) || 0,
          place_of_supply: data.place_of_supply || null,
          supply_type: data.supply_type || 'intra_state',
          reverse_charge: data.reverse_charge || false,
          vendor_gstin: data.vendor_gstin || null,
          tds_tcs_type: data.tds_tcs_type || null,
          tds_tcs_rate: Number(data.tds_tcs_rate) || 0,
          tds_tcs_amount: Number(data.tds_tcs_amount) || 0,
          itc_eligible: data.itc_eligible !== false,
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
      const binAllocationWarnings: string[] = [];
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
          serial_numbers: item.serial_numbers || [],
          hsn_code: (item as any).hsn_code || null,
          cgst_rate: Number((item as any).cgst_rate) || 0,
          cgst_amount: Number((item as any).cgst_amount) || 0,
          sgst_rate: Number((item as any).sgst_rate) || 0,
          sgst_amount: Number((item as any).sgst_amount) || 0,
          igst_rate: Number((item as any).igst_rate) || 0,
          igst_amount: Number((item as any).igst_amount) || 0,
        }));

        const { data: insertedItems, error: itemsError } = await supabase
          .from('bill_items')
          .insert(billItems)
          .select();

        if (itemsError) {
          // Rollback: delete the bill
          await supabase.from('bills').delete().eq('id', bill.id);
          throw itemsError;
        }

        // Insert bin allocations if provided, distributing serial numbers across bins
        if (insertedItems && insertedItems.length > 0) {
          for (const item of data.items) {
            if (item.bin_allocations && item.bin_allocations.length > 0) {
              // Match inserted item by item_name to avoid index correlation issues
              const matchedItem = insertedItems.find(
                (inserted: any) => inserted.item_name === item.item_name && inserted.item_id === (item.item_id || null)
              );

              if (!matchedItem) {
                binAllocationWarnings.push(`Could not match inserted item for "${item.item_name}" — bin allocations skipped`);
                continue;
              }

              // Distribute serial numbers across bin allocations in order
              const allSerials = item.serial_numbers || [];
              let serialIndex = 0;

              const binAllocations = item.bin_allocations.map((allocation) => {
                const qty = Math.floor(allocation.quantity);
                const binSerials = allSerials.slice(serialIndex, serialIndex + qty);
                serialIndex += qty;

                return {
                  bill_item_id: matchedItem.id,
                  bin_location_id: allocation.bin_location_id,
                  quantity: allocation.quantity,
                  serial_numbers: binSerials,
                };
              });

              const { error: binError } = await supabase
                .from('bill_item_bin_allocations')
                .insert(binAllocations);

              if (binError) {
                console.error('Error inserting bin allocations:', binError);
                binAllocationWarnings.push(`Bin allocation failed for "${item.item_name}": ${binError.message}`);
              }
            }
          }
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

        // Create batch records for batch-tracked items
        for (const item of data.items) {
          if (item.item_id && item.quantity > 0) {
            const { data: itemRecord } = await supabase
              .from('items')
              .select('advanced_tracking_type')
              .eq('id', item.item_id)
              .single();

            if (itemRecord?.advanced_tracking_type === 'batches') {
              const matchedItem = insertedItems?.find(
                (inserted: any) => inserted.item_name === item.item_name && inserted.item_id === (item.item_id || null)
              );

              if (matchedItem) {
                // If bin allocations exist, create one batch per bin allocation
                if (item.bin_allocations && item.bin_allocations.length > 0) {
                  for (const allocation of item.bin_allocations) {
                    try {
                      await batchesService.createBatch({
                        item_id: item.item_id,
                        bill_id: bill.id,
                        bill_item_id: matchedItem.id,
                        quantity: allocation.quantity,
                        bin_location_id: allocation.bin_location_id,
                      });
                    } catch (batchErr) {
                      console.error('Error creating batch for bin allocation:', batchErr);
                    }
                  }
                } else {
                  // Single batch for the entire quantity
                  try {
                    await batchesService.createBatch({
                      item_id: item.item_id,
                      bill_id: bill.id,
                      bill_item_id: matchedItem.id,
                      quantity: item.quantity,
                    });
                  } catch (batchErr) {
                    console.error('Error creating batch:', batchErr);
                  }
                }
              }
            }
          }
        }
      }

      // Auto-create placement tasks for mobile app putaway workflow
      try {
        for (const item of data.items) {
          if (!item.item_id || item.quantity <= 0) continue;

          // Get item details for colour/size/variant
          const { data: itemDetails } = await supabase
            .from('items')
            .select('sku, color, size, variant')
            .eq('id', item.item_id)
            .single();

          if (item.bin_allocations && item.bin_allocations.length > 0) {
            // One task per bin allocation
            for (const alloc of item.bin_allocations) {
              await placementTasksService.create({
                item_id: item.item_id,
                item_name: item.item_name,
                sku: itemDetails?.sku || '',
                colour: itemDetails?.color || '',
                size: itemDetails?.size || '',
                variant: itemDetails?.variant || '',
                source_po: bill.bill_number,
                suggested_bin_id: alloc.bin_location_id,
                suggested_bin_code: alloc.bin_code,
                suggested_bin_reason: 'Assigned in bill',
              });
            }
          } else {
            // No bin specified — create task without suggested bin
            await placementTasksService.create({
              item_id: item.item_id,
              item_name: item.item_name,
              sku: itemDetails?.sku || '',
              colour: itemDetails?.color || '',
              size: itemDetails?.size || '',
              variant: itemDetails?.variant || '',
              source_po: bill.bill_number,
            });
          }
        }
      } catch (placementErr) {
        console.error('Error creating placement tasks (non-blocking):', placementErr);
      }

      // Auto-create assembly journeys for serial-tracked items (non-blocking)
      try {
        for (const item of data.items) {
          if (!item.item_id || !item.serial_numbers || item.serial_numbers.length === 0) continue;

          const { data: itemRecord } = await supabase
            .from('items')
            .select('advanced_tracking_type, sku, item_name, color, size')
            .eq('id', item.item_id)
            .single();

          if (itemRecord?.advanced_tracking_type === 'serial' && itemRecord.sku) {
            const result = await assemblyService.bulkCreateJourneysFromBill({
              serials: item.serial_numbers,
              model_sku: itemRecord.sku,
              grn_reference: bill.bill_number,
              item_name: itemRecord.item_name || undefined,
              item_color: itemRecord.color || undefined,
              item_size: itemRecord.size || undefined,
            });
            if (result.errors.length > 0) {
              console.warn(`Assembly journey warnings for ${item.item_name}:`, result.errors);
            }
          }
        }
      } catch (assemblyErr) {
        console.error('Error creating assembly journeys (non-blocking):', assemblyErr);
      }

      if (binAllocationWarnings.length > 0) {
        return { ...bill, _warnings: binAllocationWarnings };
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

      // Test #56: Add overdue flag to bills past due date
      const today = new Date().toISOString().split('T')[0];
      const enrichedBills = (data || []).map((bill: any) => ({
        ...bill,
        is_overdue: bill.due_date && bill.due_date < today && bill.payment_status !== 'paid',
      }));

      return enrichedBills;
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

      // Get bin allocations for all bill items
      const itemIds = (items || []).map((item: any) => item.id);
      let allocationsMap: Record<string, any[]> = {};

      if (itemIds.length > 0) {
        const { data: allocations, error: allocError } = await supabase
          .from('bill_item_bin_allocations')
          .select('*, bin_locations(id, bin_code, location_id, locations(name))')
          .in('bill_item_id', itemIds);

        if (!allocError && allocations) {
          for (const alloc of allocations) {
            const key = alloc.bill_item_id;
            if (!allocationsMap[key]) allocationsMap[key] = [];
            allocationsMap[key].push({
              id: alloc.id,
              bin_location_id: alloc.bin_location_id,
              bin_code: alloc.bin_locations?.bin_code || '',
              location_name: alloc.bin_locations?.locations?.name || '',
              quantity: alloc.quantity,
            });
          }
        }
      }

      // Attach bin_allocations to each item
      const itemsWithAllocations = (items || []).map((item: any) => ({
        ...item,
        bin_allocations: allocationsMap[item.id] || [],
      }));

      return {
        ...bill,
        items: itemsWithAllocations,
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
      if (data.cgst_rate !== undefined) updateData.cgst_rate = data.cgst_rate;
      if (data.cgst_amount !== undefined) updateData.cgst_amount = data.cgst_amount;
      if (data.sgst_rate !== undefined) updateData.sgst_rate = data.sgst_rate;
      if (data.sgst_amount !== undefined) updateData.sgst_amount = data.sgst_amount;
      if (data.igst_rate !== undefined) updateData.igst_rate = data.igst_rate;
      if (data.igst_amount !== undefined) updateData.igst_amount = data.igst_amount;
      if (data.cess_amount !== undefined) updateData.cess_amount = data.cess_amount;
      if (data.place_of_supply !== undefined) updateData.place_of_supply = data.place_of_supply;
      if (data.supply_type !== undefined) updateData.supply_type = data.supply_type;
      if (data.reverse_charge !== undefined) updateData.reverse_charge = data.reverse_charge;
      if (data.vendor_gstin !== undefined) updateData.vendor_gstin = data.vendor_gstin;
      if (data.tds_tcs_type !== undefined) updateData.tds_tcs_type = data.tds_tcs_type;
      if (data.tds_tcs_rate !== undefined) updateData.tds_tcs_rate = data.tds_tcs_rate;
      if (data.tds_tcs_amount !== undefined) updateData.tds_tcs_amount = data.tds_tcs_amount;
      if (data.itc_eligible !== undefined) updateData.itc_eligible = data.itc_eligible;
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
        // 1. Fetch old bill items to reverse their stock impact
        const { data: oldItems } = await supabase
          .from('bill_items')
          .select('item_id, quantity')
          .eq('bill_id', id);

        // 2. Reverse old stock (subtract old quantities)
        if (oldItems && oldItems.length > 0) {
          for (const oldItem of oldItems) {
            if (oldItem.item_id && oldItem.quantity > 0) {
              const { data: currentItem } = await supabase
                .from('items')
                .select('current_stock')
                .eq('id', oldItem.item_id)
                .single();

              if (currentItem) {
                const newStock = (currentItem.current_stock || 0) - oldItem.quantity;
                await supabase
                  .from('items')
                  .update({ current_stock: Math.max(0, newStock) })
                  .eq('id', oldItem.item_id);
              }
            }
          }
        }

        // 3. Delete existing bill items (cascades to bin allocations)
        await supabase.from('bill_items').delete().eq('bill_id', id);

        // 4. Insert new items
        let insertedItems: any[] = [];
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
            serial_numbers: item.serial_numbers || [],
          }));

          const { data: inserted } = await supabase.from('bill_items').insert(billItems).select();
          insertedItems = inserted || [];
        }

        // 5. Insert bin allocations for new items
        if (insertedItems.length > 0) {
          for (const item of data.items) {
            if (item.bin_allocations && item.bin_allocations.length > 0) {
              const matchedItem = insertedItems.find(
                (inserted: any) => inserted.item_name === item.item_name && inserted.item_id === (item.item_id || null)
              );

              if (matchedItem) {
                const allSerials = item.serial_numbers || [];
                let serialIndex = 0;

                const binAllocations = item.bin_allocations.map((allocation: any) => {
                  const qty = Math.floor(allocation.quantity);
                  const binSerials = allSerials.slice(serialIndex, serialIndex + qty);
                  serialIndex += qty;

                  return {
                    bill_item_id: matchedItem.id,
                    bin_location_id: allocation.bin_location_id,
                    quantity: allocation.quantity,
                    serial_numbers: binSerials,
                  };
                });

                await supabase
                  .from('bill_item_bin_allocations')
                  .insert(binAllocations);
              }
            }
          }
        }

        // 6. Add new stock (add new quantities)
        for (const item of data.items) {
          if (item.item_id && item.quantity > 0) {
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
      console.error('Error updating bill:', error);
      throw error;
    }
  }

  /**
   * Delete a bill
   * Test #52: Block delete if payments are linked
   */
  async deleteBill(id: string) {
    try {
      // Test #52: Check for linked payments before deleting
      const { data: linkedPayments } = await supabase
        .from('payments_made')
        .select('id, payment_number, amount')
        .eq('bill_id', id);

      if (linkedPayments && linkedPayments.length > 0) {
        const totalPaid = linkedPayments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
        throw new Error(`Cannot delete: ${linkedPayments.length} payment(s) totalling ₹${totalPaid} are linked to this bill. Delete the payments first.`);
      }

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

  /**
   * Get the last serial number used for a given item across all bills
   */
  async getLastSerialNumber(itemId: string) {
    try {
      const { data, error } = await supabase
        .from('bill_items')
        .select('serial_numbers')
        .eq('item_id', itemId)
        .not('serial_numbers', 'eq', '[]');

      if (error) throw error;

      let maxSerial = 0;
      if (data) {
        for (const row of data) {
          const serials = row.serial_numbers || [];
          for (const sn of serials) {
            // Extract the number after the last "/"
            const parts = String(sn).split('/');
            const num = parseInt(parts[parts.length - 1]);
            if (!isNaN(num) && num > maxSerial) {
              maxSerial = num;
            }
          }
        }
      }

      return maxSerial;
    } catch (error) {
      console.error('Error fetching last serial number:', error);
      throw error;
    }
  }
}
