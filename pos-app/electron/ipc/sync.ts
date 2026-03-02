import { IpcMain } from 'electron';
import { getDb } from '../db/database';

export function registerSyncHandlers(ipcMain: IpcMain): void {
  // ---------------------------------------------------------------------------
  // sync:pull — Pull data from cloud (placeholder)
  // ---------------------------------------------------------------------------
  ipcMain.handle('sync:pull', async () => {
    try {
      // TODO: Implement cloud pull — download latest data from Supabase
      return { success: true, message: 'Pull not yet implemented' };
    } catch (error: any) {
      console.error('[IPC] sync:pull error:', error);
      return { success: false, error: error.message };
    }
  });

  // ---------------------------------------------------------------------------
  // sync:push — Push pending changes to cloud (placeholder)
  // ---------------------------------------------------------------------------
  ipcMain.handle('sync:push', async () => {
    try {
      // TODO: Implement cloud push — upload _sync_queue records to Supabase
      return { success: true, message: 'Push not yet implemented' };
    } catch (error: any) {
      console.error('[IPC] sync:push error:', error);
      return { success: false, error: error.message };
    }
  });

  // ---------------------------------------------------------------------------
  // sync:getStatus — Return current sync status
  // ---------------------------------------------------------------------------
  ipcMain.handle('sync:getStatus', async () => {
    try {
      const db = getDb();

      const pendingResult = db
        .prepare(
          `SELECT COUNT(*) as count FROM _sync_queue WHERE status = 'pending'`
        )
        .get() as { count: number };

      return {
        success: true,
        data: {
          isOnline: true, // TODO: Implement actual connectivity check
          lastPull: null,
          lastPush: null,
          pendingCount: pendingResult.count,
        },
      };
    } catch (error: any) {
      console.error('[IPC] sync:getStatus error:', error);
      return { success: false, error: error.message };
    }
  });

  // ---------------------------------------------------------------------------
  // sync:getQueue — Get recent sync queue entries
  // ---------------------------------------------------------------------------
  ipcMain.handle('sync:getQueue', async () => {
    try {
      const db = getDb();

      const rows = db
        .prepare(
          `SELECT * FROM _sync_queue ORDER BY created_at DESC LIMIT 50`
        )
        .all();

      return { success: true, data: rows };
    } catch (error: any) {
      console.error('[IPC] sync:getQueue error:', error);
      return { success: false, error: error.message };
    }
  });
}
