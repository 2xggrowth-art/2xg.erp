import { IpcMain } from 'electron';
import { getDb } from '../db/database';

export function registerBinHandlers(ipcMain: IpcMain): void {
  // ---------------------------------------------------------------------------
  // bins:getForItem — Get bin locations with stock for a specific item
  // ---------------------------------------------------------------------------
  ipcMain.handle('bins:getForItem', async (_event, itemId: string) => {
    try {
      const db = getDb();

      const rows = db
        .prepare(
          `SELECT bl.id AS bin_id, bl.bin_code, bl.warehouse, bl.location_name, bl.status, bs.quantity
           FROM bin_stock bs
           JOIN bin_locations bl ON bl.id = bs.bin_location_id
           WHERE bs.item_id = ?
             AND bs.quantity > 0
           ORDER BY bl.bin_code`
        )
        .all(itemId);

      return { success: true, data: rows };
    } catch (error: any) {
      console.error('[IPC] bins:getForItem error:', error);
      return { success: false, error: error.message };
    }
  });

  // ---------------------------------------------------------------------------
  // bins:getAll — Get all active bin locations
  // ---------------------------------------------------------------------------
  ipcMain.handle('bins:getAll', async () => {
    try {
      const db = getDb();

      const rows = db
        .prepare(
          `SELECT * FROM bin_locations
           WHERE status = 'active'
           ORDER BY bin_code`
        )
        .all();

      return { success: true, data: rows };
    } catch (error: any) {
      console.error('[IPC] bins:getAll error:', error);
      return { success: false, error: error.message };
    }
  });
}
