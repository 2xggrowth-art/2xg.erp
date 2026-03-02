import { IpcMain } from 'electron';
import { getDb } from '../db/database';

export function registerPosCodeHandlers(ipcMain: IpcMain): void {
  // ---------------------------------------------------------------------------
  // pos-codes:getAll — Get all active POS codes
  // ---------------------------------------------------------------------------
  ipcMain.handle('pos-codes:getAll', async () => {
    try {
      const db = getDb();

      const rows = db
        .prepare(`SELECT * FROM pos_codes WHERE is_active = 1`)
        .all();

      return { success: true, data: rows };
    } catch (error: any) {
      console.error('[IPC] pos-codes:getAll error:', error);
      return { success: false, error: error.message };
    }
  });

  // ---------------------------------------------------------------------------
  // pos-codes:verify — Verify a specific POS code
  // ---------------------------------------------------------------------------
  ipcMain.handle('pos-codes:verify', async (_event, code: string) => {
    try {
      const db = getDb();

      const row = db
        .prepare(
          `SELECT * FROM pos_codes WHERE code = ? AND is_active = 1`
        )
        .get(code);

      if (!row) {
        return { success: false, error: 'Invalid or inactive POS code' };
      }

      return { success: true, data: row };
    } catch (error: any) {
      console.error('[IPC] pos-codes:verify error:', error);
      return { success: false, error: error.message };
    }
  });
}
