import { IpcMain } from 'electron';
import { getDb } from '../db/database';

export function registerOrgSettingsHandlers(ipcMain: IpcMain): void {
  // ---------------------------------------------------------------------------
  // org-settings:get — Get the organization settings
  // ---------------------------------------------------------------------------
  ipcMain.handle('org-settings:get', async () => {
    try {
      const db = getDb();

      // Prefer synced (real) org settings over seed data
      const row = db
        .prepare(`SELECT * FROM org_settings ORDER BY synced_at DESC NULLS LAST LIMIT 1`)
        .get();

      return { success: true, data: row || null };
    } catch (error: any) {
      console.error('[IPC] org-settings:get error:', error);
      return { success: false, error: error.message };
    }
  });
}
