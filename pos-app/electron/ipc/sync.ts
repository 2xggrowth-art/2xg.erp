import { IpcMain } from 'electron';
import axios from 'axios';
import { getDb } from '../db/database';
import { pullFromCloud, pushToCloud, fullSync, registerDevice } from '../sync/sync-engine';
import { resetApiClient } from '../sync/api-client';

export function registerSyncHandlers(ipcMain: IpcMain): void {
  // ---------------------------------------------------------------------------
  // sync:pull — Pull data from cloud ERP
  // ---------------------------------------------------------------------------
  ipcMain.handle('sync:pull', async () => {
    try {
      console.log('[IPC] sync:pull — starting pull from cloud...');
      const result = await pullFromCloud();
      console.log('[IPC] sync:pull — done:', result);
      return {
        success: result.success,
        message: result.success
          ? `Pulled ${result.pulled} records`
          : `Pull completed with errors: ${result.errors.join(', ')}`,
        data: result,
      };
    } catch (error: any) {
      console.error('[IPC] sync:pull error:', error);
      return { success: false, error: error.message };
    }
  });

  // ---------------------------------------------------------------------------
  // sync:push — Push pending changes to cloud ERP
  // ---------------------------------------------------------------------------
  ipcMain.handle('sync:push', async () => {
    try {
      console.log('[IPC] sync:push — starting push to cloud...');
      const result = await pushToCloud();
      console.log('[IPC] sync:push — done:', result);
      return {
        success: result.success,
        message: result.success
          ? `Pushed ${result.pushed} records`
          : `Push completed with errors: ${result.errors.join(', ')}`,
        data: result,
      };
    } catch (error: any) {
      console.error('[IPC] sync:push error:', error);
      return { success: false, error: error.message };
    }
  });

  // ---------------------------------------------------------------------------
  // sync:full — Full bidirectional sync (push then pull)
  // ---------------------------------------------------------------------------
  ipcMain.handle('sync:full', async () => {
    try {
      console.log('[IPC] sync:full — starting full sync...');
      const result = await fullSync();
      console.log('[IPC] sync:full — done:', result);
      return {
        success: result.success,
        message: result.success
          ? `Synced: pushed ${result.pushed}, pulled ${result.pulled}`
          : `Sync completed with errors: ${result.errors.join(', ')}`,
        data: result,
      };
    } catch (error: any) {
      console.error('[IPC] sync:full error:', error);
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

      const lastPull = db
        .prepare(`SELECT value FROM app_settings WHERE key = 'last_pull'`)
        .get() as { value: string } | undefined;

      const lastPush = db
        .prepare(`SELECT value FROM app_settings WHERE key = 'last_push'`)
        .get() as { value: string } | undefined;

      return {
        success: true,
        data: {
          isOnline: true,
          lastPull: lastPull?.value || null,
          lastPush: lastPush?.value || null,
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

  // ---------------------------------------------------------------------------
  // sync:register-device — Register this device with cloud and get unique prefix
  // ---------------------------------------------------------------------------
  ipcMain.handle('sync:register-device', async () => {
    try {
      console.log('[IPC] sync:register-device — registering device...');
      const result = await registerDevice();
      console.log('[IPC] sync:register-device — done:', result);
      return {
        success: result.success,
        message: result.success
          ? `Device registered with number ${result.device_number}`
          : `Device registration failed: ${result.error}`,
        data: result,
      };
    } catch (error: any) {
      console.error('[IPC] sync:register-device error:', error);
      return { success: false, error: error.message };
    }
  });

  // ---------------------------------------------------------------------------
  // sync:login — Authenticate with cloud ERP and save JWT token
  // ---------------------------------------------------------------------------
  ipcMain.handle('sync:login', async (_event, url: string, email: string, password: string) => {
    try {
      const baseUrl = url.replace(/\/+$/, '');

      console.log(`[IPC] sync:login — authenticating with ${baseUrl}...`);

      const response = await axios.post(`${baseUrl}/auth/login`, {
        email,
        password,
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      });

      if (response.data?.success && response.data?.data?.token) {
        const token = response.data.data.token;
        const user = response.data.data.user;

        // Save token and cloud URL
        const db = getDb();
        db.prepare(
          `INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`
        ).run('cloud_token', token);
        db.prepare(
          `INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`
        ).run('cloud_url', baseUrl);
        db.prepare(
          `INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`
        ).run('cloud_email', email);

        // Reset cached API client so it picks up the new token
        resetApiClient();

        console.log(`[IPC] sync:login — authenticated as ${user?.email || email}`);

        return {
          success: true,
          message: 'Login successful',
          data: { user },
        };
      } else {
        return {
          success: false,
          error: response.data?.error || 'Login failed — invalid response',
        };
      }
    } catch (error: any) {
      console.error('[IPC] sync:login error:', error);
      const msg = error.response?.data?.error || error.message || 'Login failed';
      return { success: false, error: msg };
    }
  });
}
