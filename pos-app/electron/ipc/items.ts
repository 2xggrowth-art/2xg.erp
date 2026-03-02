import { IpcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';

export function registerItemHandlers(ipcMain: IpcMain): void {
  // ---------------------------------------------------------------------------
  // items:search — Search items by name, SKU, or exact barcode match
  // ---------------------------------------------------------------------------
  ipcMain.handle('items:search', async (_event, query: string) => {
    try {
      const db = getDb();
      const likeQuery = `%${query}%`;

      const rows = db
        .prepare(
          `SELECT * FROM items
           WHERE is_active = 1
             AND (item_name LIKE ? OR sku LIKE ? OR barcode = ?)
           LIMIT 50`
        )
        .all(likeQuery, likeQuery, query);

      return { success: true, data: rows };
    } catch (error: any) {
      console.error('[IPC] items:search error:', error);
      return { success: false, error: error.message };
    }
  });

  // ---------------------------------------------------------------------------
  // items:getAll — Get all active items ordered by name
  // ---------------------------------------------------------------------------
  ipcMain.handle('items:getAll', async () => {
    try {
      const db = getDb();

      const rows = db
        .prepare(
          `SELECT * FROM items
           WHERE is_active = 1
           ORDER BY item_name`
        )
        .all();

      return { success: true, data: rows };
    } catch (error: any) {
      console.error('[IPC] items:getAll error:', error);
      return { success: false, error: error.message };
    }
  });

  // ---------------------------------------------------------------------------
  // items:getById — Get a single item by ID
  // ---------------------------------------------------------------------------
  ipcMain.handle('items:getById', async (_event, id: string) => {
    try {
      const db = getDb();

      const row = db.prepare(`SELECT * FROM items WHERE id = ?`).get(id);

      if (!row) {
        return { success: false, error: 'Item not found' };
      }

      return { success: true, data: row };
    } catch (error: any) {
      console.error('[IPC] items:getById error:', error);
      return { success: false, error: error.message };
    }
  });
}
