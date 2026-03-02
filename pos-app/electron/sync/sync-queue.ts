import { getDb } from '../db/database';

export interface SyncQueueEntry {
  id: number;
  table_name: string;
  record_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: string | null;
  status: string;
  error_message: string | null;
  retry_count: number;
  created_at: string;
  synced_at: string | null;
}

export function enqueue(
  tableName: string,
  recordId: string,
  operation: 'INSERT' | 'UPDATE' | 'DELETE',
  payload?: Record<string, unknown>
): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO _sync_queue (table_name, record_id, operation, payload) VALUES (?, ?, ?, ?)`
  ).run(tableName, recordId, operation, payload ? JSON.stringify(payload) : null);
}

export function getPending(limit: number = 50): SyncQueueEntry[] {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM _sync_queue WHERE status = 'pending' ORDER BY id ASC LIMIT ?`)
    .all(limit) as SyncQueueEntry[];
}

export function markSynced(id: number): void {
  const db = getDb();
  db.prepare(
    `UPDATE _sync_queue SET status = 'synced', synced_at = datetime('now') WHERE id = ?`
  ).run(id);
}

export function markFailed(id: number, errorMessage: string): void {
  const db = getDb();
  const entry = db.prepare('SELECT retry_count FROM _sync_queue WHERE id = ?').get(id) as { retry_count: number } | undefined;
  const retryCount = (entry?.retry_count || 0) + 1;
  const newStatus = retryCount >= 5 ? 'dead' : 'pending';

  db.prepare(
    `UPDATE _sync_queue SET status = ?, error_message = ?, retry_count = ? WHERE id = ?`
  ).run(newStatus, errorMessage, retryCount, id);
}

export function getCount(status: string = 'pending'): number {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM _sync_queue WHERE status = ?').get(status) as { count: number };
  return row.count;
}

export function getRecent(limit: number = 50): SyncQueueEntry[] {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM _sync_queue ORDER BY created_at DESC LIMIT ?`)
    .all(limit) as SyncQueueEntry[];
}
