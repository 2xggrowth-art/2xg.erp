import { IpcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';

interface InvoiceItemInput {
  item_id: string;
  item_name: string;
  quantity: number;
  rate: number;
  amount: number;
  unit_of_measurement?: string;
  hsn_code?: string;
  bin_location_id?: string;
  bin_allocations?: Array<{ bin_location_id: string; quantity: number }>;
}

interface InvoiceInput {
  customer_id?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  invoice_date: string;
  payment_terms?: string;
  salesperson_id?: string;
  salesperson_name?: string;
  pos_session_id?: string;
  discount_type: 'percentage' | 'amount';
  discount_value: number;
  subtotal: number;
  total_amount: number;
  amount_paid?: number;
  balance_due?: number;
  status: string;
  payment_status?: string;
  customer_notes?: string;
  place_of_supply?: string;
  supply_type?: string;
  items: InvoiceItemInput[];
}

export function registerInvoiceHandlers(ipcMain: IpcMain): void {
  // ---------------------------------------------------------------------------
  // invoices:create — Atomic invoice creation with stock updates
  // ---------------------------------------------------------------------------
  ipcMain.handle('invoices:create', async (_event, data: InvoiceInput) => {
    const db = getDb();

    // Wrap entire operation in a transaction for atomicity
    const createInvoiceTransaction = db.transaction(() => {
      const now = new Date().toISOString();
      const invoiceId = uuidv4();

      // -----------------------------------------------------------------------
      // 1. Generate invoice number
      // -----------------------------------------------------------------------
      const orgSettings = db
        .prepare(`SELECT invoice_prefix FROM org_settings LIMIT 1`)
        .get() as { invoice_prefix?: string } | undefined;

      const prefix = orgSettings?.invoice_prefix || 'POS1-INV';

      const lastInvoice = db
        .prepare(
          `SELECT invoice_number FROM invoices
           WHERE invoice_number LIKE ?
           ORDER BY invoice_number DESC
           LIMIT 1`
        )
        .get(`${prefix}-%`) as { invoice_number?: string } | undefined;

      let nextSeq = 1;
      if (lastInvoice?.invoice_number) {
        const parts = lastInvoice.invoice_number.split('-');
        const lastNum = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastNum)) {
          nextSeq = lastNum + 1;
        }
      }

      const invoiceNumber = `${prefix}-${String(nextSeq).padStart(3, '0')}`;

      // -----------------------------------------------------------------------
      // 2. INSERT into invoices
      // -----------------------------------------------------------------------
      db.prepare(
        `INSERT INTO invoices (
          id, invoice_number, customer_id, customer_name, customer_email,
          customer_phone, invoice_date, payment_terms, salesperson_id,
          salesperson_name, pos_session_id, discount_type, discount_value,
          subtotal, total_amount, amount_paid, balance_due, status,
          payment_status, customer_notes, place_of_supply, supply_type,
          created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?
        )`
      ).run(
        invoiceId,
        invoiceNumber,
        data.customer_id || null,
        data.customer_name,
        data.customer_email || null,
        data.customer_phone || null,
        data.invoice_date,
        data.payment_terms || null,
        data.salesperson_id || null,
        data.salesperson_name || null,
        data.pos_session_id || null,
        data.discount_type,
        data.discount_value,
        data.subtotal,
        data.total_amount,
        data.amount_paid ?? 0,
        data.balance_due ?? data.total_amount,
        data.status,
        data.payment_status || 'unpaid',
        data.customer_notes || null,
        data.place_of_supply || null,
        data.supply_type || null,
        now,
        now
      );

      // -----------------------------------------------------------------------
      // 3 & 4. INSERT invoice_items and bin allocations
      // -----------------------------------------------------------------------
      const insertItem = db.prepare(
        `INSERT INTO invoice_items (
          id, invoice_id, item_id, item_name, quantity, rate, amount,
          unit_of_measurement, hsn_code, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );

      const insertBinAllocation = db.prepare(
        `INSERT INTO invoice_item_bin_allocations (
          id, invoice_item_id, bin_location_id, quantity
        ) VALUES (?, ?, ?, ?)`
      );

      // -----------------------------------------------------------------------
      // 5. UPDATE items.current_stock
      // -----------------------------------------------------------------------
      const updateItemStock = db.prepare(
        `UPDATE items SET current_stock = current_stock - ?, updated_at = ? WHERE id = ?`
      );

      // -----------------------------------------------------------------------
      // 6. UPDATE bin_stock.quantity
      // -----------------------------------------------------------------------
      const updateBinStock = db.prepare(
        `UPDATE bin_stock SET quantity = quantity - ?, updated_at = ?
         WHERE item_id = ? AND bin_location_id = ?`
      );

      const createdItems: any[] = [];

      for (const item of data.items) {
        const invoiceItemId = uuidv4();

        // 3. Insert invoice item
        insertItem.run(
          invoiceItemId,
          invoiceId,
          item.item_id,
          item.item_name,
          item.quantity,
          item.rate,
          item.amount,
          item.unit_of_measurement || null,
          item.hsn_code || null,
          now
        );

        // 4. Insert bin allocations if provided
        const allocations = item.bin_allocations || [];
        if (allocations.length === 0 && item.bin_location_id) {
          // Single bin location fallback
          allocations.push({
            bin_location_id: item.bin_location_id,
            quantity: item.quantity,
          });
        }

        const createdAllocations: any[] = [];
        for (const alloc of allocations) {
          const allocId = uuidv4();
          insertBinAllocation.run(
            allocId,
            invoiceItemId,
            alloc.bin_location_id,
            alloc.quantity
          );

          // 6. Deduct from bin stock
          updateBinStock.run(alloc.quantity, now, item.item_id, alloc.bin_location_id);

          createdAllocations.push({
            id: allocId,
            invoice_item_id: invoiceItemId,
            bin_location_id: alloc.bin_location_id,
            quantity: alloc.quantity,
          });
        }

        // 5. Deduct from item's global stock
        updateItemStock.run(item.quantity, now, item.item_id);

        createdItems.push({
          id: invoiceItemId,
          invoice_id: invoiceId,
          item_id: item.item_id,
          item_name: item.item_name,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
          unit_of_measurement: item.unit_of_measurement || null,
          hsn_code: item.hsn_code || null,
          bin_allocations: createdAllocations,
        });
      }

      // -----------------------------------------------------------------------
      // 7. Add to sync queue
      // -----------------------------------------------------------------------
      db.prepare(
        `INSERT INTO _sync_queue (table_name, record_id, operation, status, created_at)
         VALUES ('invoices', ?, 'INSERT', 'pending', ?)`
      ).run(invoiceId, now);

      // -----------------------------------------------------------------------
      // 8. Return created invoice with items
      // -----------------------------------------------------------------------
      return {
        id: invoiceId,
        invoice_number: invoiceNumber,
        customer_id: data.customer_id || null,
        customer_name: data.customer_name,
        customer_email: data.customer_email || null,
        customer_phone: data.customer_phone || null,
        invoice_date: data.invoice_date,
        payment_terms: data.payment_terms || null,
        salesperson_id: data.salesperson_id || null,
        salesperson_name: data.salesperson_name || null,
        pos_session_id: data.pos_session_id || null,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        subtotal: data.subtotal,
        total_amount: data.total_amount,
        amount_paid: data.amount_paid ?? 0,
        balance_due: data.balance_due ?? data.total_amount,
        status: data.status,
        payment_status: data.payment_status || 'unpaid',
        customer_notes: data.customer_notes || null,
        place_of_supply: data.place_of_supply || null,
        supply_type: data.supply_type || null,
        created_at: now,
        updated_at: now,
        items: createdItems,
      };
    });

    try {
      const invoice = createInvoiceTransaction();
      return { success: true, data: invoice };
    } catch (error: any) {
      console.error('[IPC] invoices:create error:', error);
      return { success: false, error: error.message };
    }
  });

  // ---------------------------------------------------------------------------
  // invoices:getAll — List invoices with optional filters and joined items
  // ---------------------------------------------------------------------------
  ipcMain.handle(
    'invoices:getAll',
    async (
      _event,
      filters?: {
        pos_session_id?: string;
        status?: string;
        customer_id?: string;
      }
    ) => {
      try {
        const db = getDb();
        const conditions: string[] = [];
        const params: any[] = [];

        if (filters?.pos_session_id) {
          conditions.push(`i.pos_session_id = ?`);
          params.push(filters.pos_session_id);
        }

        if (filters?.status) {
          conditions.push(`i.status = ?`);
          params.push(filters.status);
        }

        if (filters?.customer_id) {
          conditions.push(`i.customer_id = ?`);
          params.push(filters.customer_id);
        }

        const whereClause =
          conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const invoices = db
          .prepare(
            `SELECT i.* FROM invoices i ${whereClause} ORDER BY i.created_at DESC`
          )
          .all(...params) as any[];

        // Attach items to each invoice
        const getItems = db.prepare(
          `SELECT * FROM invoice_items WHERE invoice_id = ?`
        );

        const result = invoices.map((inv) => ({
          ...inv,
          items: getItems.all(inv.id),
        }));

        return { success: true, data: result };
      } catch (error: any) {
        console.error('[IPC] invoices:getAll error:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // ---------------------------------------------------------------------------
  // invoices:getById — Get a single invoice with items and bin allocations
  // ---------------------------------------------------------------------------
  ipcMain.handle('invoices:getById', async (_event, id: string) => {
    try {
      const db = getDb();

      const invoice = db
        .prepare(`SELECT * FROM invoices WHERE id = ?`)
        .get(id) as any;

      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      const items = db
        .prepare(`SELECT * FROM invoice_items WHERE invoice_id = ?`)
        .all(id) as any[];

      const getBinAllocations = db.prepare(
        `SELECT * FROM invoice_item_bin_allocations WHERE invoice_item_id = ?`
      );

      const itemsWithAllocations = items.map((item) => ({
        ...item,
        bin_allocations: getBinAllocations.all(item.id),
      }));

      return {
        success: true,
        data: { ...invoice, items: itemsWithAllocations },
      };
    } catch (error: any) {
      console.error('[IPC] invoices:getById error:', error);
      return { success: false, error: error.message };
    }
  });

  // ---------------------------------------------------------------------------
  // invoices:getBySession — Get all invoices for a POS session
  // ---------------------------------------------------------------------------
  ipcMain.handle('invoices:getBySession', async (_event, sessionId: string) => {
    try {
      const db = getDb();

      const invoices = db
        .prepare(
          `SELECT * FROM invoices WHERE pos_session_id = ? ORDER BY created_at DESC`
        )
        .all(sessionId) as any[];

      const getItems = db.prepare(
        `SELECT * FROM invoice_items WHERE invoice_id = ?`
      );

      const result = invoices.map((inv) => ({
        ...inv,
        items: getItems.all(inv.id),
      }));

      return { success: true, data: result };
    } catch (error: any) {
      console.error('[IPC] invoices:getBySession error:', error);
      return { success: false, error: error.message };
    }
  });
}
