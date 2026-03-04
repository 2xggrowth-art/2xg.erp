import { ipc } from './ipc-client';

export interface SyncStatus {
  isOnline: boolean;
  lastPull: string | null;
  lastPush: string | null;
  pendingCount: number;
}

export interface SyncQueueItem {
  id: number;
  table_name: string;
  record_id: string;
  operation: string;
  status: string;
  error_message?: string;
  retry_count: number;
  created_at: string;
  synced_at?: string;
}

export const syncService = {
  async pull(): Promise<{ success: boolean; message: string }> {
    return await ipc().syncPull();
  },

  async push(): Promise<{ success: boolean; message: string }> {
    return await ipc().syncPush();
  },

  async getStatus(): Promise<SyncStatus> {
    const result = await ipc().getSyncStatus();
    return result.data || { isOnline: navigator.onLine, lastPull: null, lastPush: null, pendingCount: 0 };
  },

  async registerDevice(): Promise<{ success: boolean; message: string; data?: any }> {
    return await ipc().registerDevice();
  },

  async getQueue(): Promise<SyncQueueItem[]> {
    const result = await ipc().getSyncQueue();
    return result.success ? result.data : [];
  },
};
