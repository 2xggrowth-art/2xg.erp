import { IpcMain } from 'electron';
import { getDb } from '../db/database';

export function registerAppSettingsHandlers(ipcMain: IpcMain): void {
  // ---------------------------------------------------------------------------
  // app-settings:get — Get a single setting by key
  // ---------------------------------------------------------------------------
  ipcMain.handle('app-settings:get', async (_event, key: string) => {
    try {
      const db = getDb();

      const row = db
        .prepare(`SELECT value FROM app_settings WHERE key = ?`)
        .get(key) as { value: string } | undefined;

      return { success: true, data: row?.value ?? null };
    } catch (error: any) {
      console.error('[IPC] app-settings:get error:', error);
      return { success: false, error: error.message };
    }
  });

  // ---------------------------------------------------------------------------
  // app-settings:set — Upsert a setting by key
  // ---------------------------------------------------------------------------
  ipcMain.handle(
    'app-settings:set',
    async (_event, key: string, value: string) => {
      try {
        const db = getDb();
        const now = new Date().toISOString();

        db.prepare(
          `INSERT INTO app_settings (key, value, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
        ).run(key, value, now);

        return { success: true, data: { key, value } };
      } catch (error: any) {
        console.error('[IPC] app-settings:set error:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // ---------------------------------------------------------------------------
  // app-settings:getAll — Get all app settings
  // ---------------------------------------------------------------------------
  ipcMain.handle('app-settings:getAll', async () => {
    try {
      const db = getDb();

      const rows = db
        .prepare(`SELECT * FROM app_settings`)
        .all();

      return { success: true, data: rows };
    } catch (error: any) {
      console.error('[IPC] app-settings:getAll error:', error);
      return { success: false, error: error.message };
    }
  });
}
