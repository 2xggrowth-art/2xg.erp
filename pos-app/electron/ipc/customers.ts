import { IpcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';

export function registerCustomerHandlers(ipcMain: IpcMain): void {
  // ---------------------------------------------------------------------------
  // customers:getAll — List customers with optional search and active filter
  // ---------------------------------------------------------------------------
  ipcMain.handle(
    'customers:getAll',
    async (
      _event,
      filters?: { search?: string; isActive?: boolean }
    ) => {
      try {
        const db = getDb();
        const conditions: string[] = [];
        const params: any[] = [];

        if (filters?.search) {
          const like = `%${filters.search}%`;
          conditions.push(
            `(customer_name LIKE ? OR phone LIKE ? OR email LIKE ?)`
          );
          params.push(like, like, like);
        }

        if (filters?.isActive !== undefined) {
          conditions.push(`is_active = ?`);
          params.push(filters.isActive ? 1 : 0);
        }

        const whereClause =
          conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const rows = db
          .prepare(
            `SELECT * FROM customers ${whereClause} ORDER BY customer_name`
          )
          .all(...params);

        return { success: true, data: rows };
      } catch (error: any) {
        console.error('[IPC] customers:getAll error:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // ---------------------------------------------------------------------------
  // customers:getById — Get a single customer by ID
  // ---------------------------------------------------------------------------
  ipcMain.handle('customers:getById', async (_event, id: string) => {
    try {
      const db = getDb();

      const row = db
        .prepare(`SELECT * FROM customers WHERE id = ?`)
        .get(id);

      if (!row) {
        return { success: false, error: 'Customer not found' };
      }

      return { success: true, data: row };
    } catch (error: any) {
      console.error('[IPC] customers:getById error:', error);
      return { success: false, error: error.message };
    }
  });

  // ---------------------------------------------------------------------------
  // customers:create — Create a new customer and queue for sync
  // ---------------------------------------------------------------------------
  ipcMain.handle('customers:create', async (_event, data: any) => {
    try {
      const db = getDb();
      const id = uuidv4();
      const now = new Date().toISOString();

      // Map form fields (display_name, mobile, address) to schema fields
      const customerName = data.customer_name || data.display_name;
      const phone = data.phone || data.mobile || null;
      const billingAddress = data.billing_address
        || [data.address, data.city, data.state].filter(Boolean).join(', ')
        || null;

      db.prepare(
        `INSERT INTO customers (
          id, customer_name, company_name, email, phone,
          billing_address, shipping_address, gstin, pan,
          payment_terms, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
      ).run(
        id,
        customerName,
        data.company_name || null,
        data.email || null,
        phone,
        billingAddress,
        data.shipping_address || null,
        data.gstin || null,
        data.pan || null,
        data.payment_terms || 'Due on Receipt',
        now,
        now
      );

      // Add to sync queue
      db.prepare(
        `INSERT INTO _sync_queue (table_name, record_id, operation, status, created_at)
         VALUES ('customers', ?, 'INSERT', 'pending', ?)`
      ).run(id, now);

      const created = db
        .prepare(`SELECT * FROM customers WHERE id = ?`)
        .get(id);

      return { success: true, data: created };
    } catch (error: any) {
      console.error('[IPC] customers:create error:', error);
      return { success: false, error: error.message };
    }
  });
}
