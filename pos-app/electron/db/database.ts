/**
 * 2XG POS - SQLite Database Connection Manager
 *
 * Manages the singleton better-sqlite3 connection for the Electron main process.
 * - WAL mode for concurrent read performance
 * - Foreign keys enforced
 * - Schema auto-applied on first run
 * - Migration runner with version tracking
 *
 * Usage:
 *   import { initDatabase, getDb, closeDatabase } from './database';
 *
 *   // In app startup (main.ts):
 *   await initDatabase();
 *
 *   // Anywhere in main process:
 *   const db = getDb();
 *   const rows = db.prepare('SELECT * FROM items WHERE is_active = 1').all();
 *
 *   // On app quit:
 *   closeDatabase();
 */

import path from 'path';
import { app } from 'electron';
import Database from 'better-sqlite3';
import { SCHEMA_SQL, SEED_SQL } from './schema';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BetterSqlite3Database = InstanceType<typeof Database>;

interface MigrationRow {
  id: number;
  version: number;
  name: string;
  applied_at: string;
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let db: BetterSqlite3Database | null = null;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the singleton database instance.
 * Throws if `initDatabase()` has not been called yet.
 */
export function getDb(): BetterSqlite3Database {
  if (!db) {
    throw new Error(
      '[POS-DB] Database not initialized. Call initDatabase() first.'
    );
  }
  return db;
}

/**
 * Initialize the database connection, apply schema, and run pending migrations.
 * Call this once during app startup (e.g. in `app.whenReady()`).
 */
export function initDatabase(): void {
  if (db) {
    console.log('[POS-DB] Database already initialized.');
    return;
  }

  const dbPath = path.join(app.getPath('userData'), 'pos-data.db');
  console.log(`[POS-DB] Opening database at: ${dbPath}`);

  db = new Database(dbPath);

  // -----------------------------------------------------------------------
  // Pragmas — set BEFORE any schema work
  // -----------------------------------------------------------------------
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  // Synchronous NORMAL is safe with WAL and much faster than FULL
  db.pragma('synchronous = NORMAL');

  // -----------------------------------------------------------------------
  // Apply schema (all CREATE TABLE IF NOT EXISTS — safe to re-run)
  // -----------------------------------------------------------------------
  console.log('[POS-DB] Applying schema...');
  db.exec(SCHEMA_SQL);

  // -----------------------------------------------------------------------
  // Seed data — only insert if org_settings is empty (first run)
  // -----------------------------------------------------------------------
  const orgCount = db
    .prepare('SELECT COUNT(*) AS cnt FROM org_settings')
    .get() as { cnt: number };

  if (orgCount.cnt === 0) {
    console.log('[POS-DB] First run detected — seeding initial data...');
    db.exec(SEED_SQL);
  }

  // -----------------------------------------------------------------------
  // Run pending migrations
  // -----------------------------------------------------------------------
  runPendingMigrations();

  console.log('[POS-DB] Database ready.');
}

/**
 * Close the database connection gracefully.
 * Call this in the `app.on('before-quit')` or `app.on('will-quit')` handler.
 */
export function closeDatabase(): void {
  if (db) {
    console.log('[POS-DB] Closing database...');
    // Optimize WAL before closing (checkpoint remaining WAL frames)
    try {
      db.pragma('wal_checkpoint(TRUNCATE)');
    } catch {
      // Non-fatal — the OS will clean up
    }
    db.close();
    db = null;
    console.log('[POS-DB] Database closed.');
  }
}

/**
 * Run a single migration inside a transaction.
 * If the version has already been applied, it is silently skipped.
 *
 * @param version - Unique integer version number (must be monotonically increasing)
 * @param name    - Human-readable migration name (e.g. "add_discount_columns")
 * @param sql     - The SQL to execute for this migration
 */
export function runMigration(
  version: number,
  name: string,
  sql: string
): void {
  const database = getDb();

  // Check if already applied
  const existing = database
    .prepare('SELECT id FROM _migrations WHERE version = ?')
    .get(version) as MigrationRow | undefined;

  if (existing) {
    console.log(
      `[POS-DB] Migration v${version} (${name}) already applied — skipping.`
    );
    return;
  }

  console.log(`[POS-DB] Running migration v${version}: ${name}...`);

  const migrate = database.transaction(() => {
    database.exec(sql);
    database
      .prepare(
        'INSERT INTO _migrations (version, name) VALUES (?, ?)'
      )
      .run(version, name);
  });

  migrate();

  console.log(`[POS-DB] Migration v${version} (${name}) applied successfully.`);
}

// ---------------------------------------------------------------------------
// Migration registry
// ---------------------------------------------------------------------------

/**
 * Register all migrations here in order.
 * Each entry is [version, name, sql].
 *
 * When you need to alter the schema after the initial release, add a new entry
 * at the end of this array with the next version number. Never modify or
 * reorder existing entries — they are immutable once shipped.
 */
const MIGRATIONS: Array<[number, string, string]> = [
  // Example (uncomment when first post-v1 migration is needed):
  // [2, 'add_loyalty_points', `
  //   ALTER TABLE customers ADD COLUMN loyalty_points INTEGER DEFAULT 0;
  // `],
];

/**
 * Run all registered migrations that have not yet been applied.
 */
function runPendingMigrations(): void {
  if (MIGRATIONS.length === 0) return;

  const database = getDb();

  // Get the highest applied version
  const latest = database
    .prepare(
      'SELECT COALESCE(MAX(version), 0) AS max_version FROM _migrations'
    )
    .get() as { max_version: number };

  const pending = MIGRATIONS.filter(([v]) => v > latest.max_version);

  if (pending.length === 0) {
    console.log('[POS-DB] All migrations up to date.');
    return;
  }

  console.log(`[POS-DB] ${pending.length} pending migration(s) to apply...`);

  for (const [version, name, sql] of pending) {
    runMigration(version, name, sql);
  }
}

// ---------------------------------------------------------------------------
// Utility helpers (used internally, exported for IPC handlers)
// ---------------------------------------------------------------------------

/**
 * Execute a callback inside a database transaction.
 * Automatically commits on success, rolls back on error.
 */
export function withTransaction<T>(fn: (database: BetterSqlite3Database) => T): T {
  const database = getDb();
  const wrapped = database.transaction(fn);
  return wrapped(database);
}

/**
 * Enqueue a record change for background sync to the cloud ERP.
 */
export function enqueueSyncOperation(
  tableName: string,
  recordId: string,
  operation: 'INSERT' | 'UPDATE' | 'DELETE',
  payload?: Record<string, unknown>
): void {
  const database = getDb();
  database
    .prepare(
      `INSERT INTO _sync_queue (table_name, record_id, operation, payload)
       VALUES (?, ?, ?, ?)`
    )
    .run(
      tableName,
      recordId,
      operation,
      payload ? JSON.stringify(payload) : null
    );
}

/**
 * Retrieve all pending sync queue entries (for the sync worker).
 */
export function getPendingSyncEntries(limit = 50): Array<{
  id: number;
  table_name: string;
  record_id: string;
  operation: string;
  payload: string | null;
  retry_count: number;
  created_at: string;
}> {
  const database = getDb();
  return database
    .prepare(
      `SELECT id, table_name, record_id, operation, payload, retry_count, created_at
       FROM _sync_queue
       WHERE status = 'pending'
       ORDER BY id ASC
       LIMIT ?`
    )
    .all(limit) as Array<{
      id: number;
      table_name: string;
      record_id: string;
      operation: string;
      payload: string | null;
      retry_count: number;
      created_at: string;
    }>;
}

/**
 * Mark a sync queue entry as completed.
 */
export function markSyncCompleted(queueId: number): void {
  const database = getDb();
  database
    .prepare(
      `UPDATE _sync_queue SET status = 'synced', synced_at = datetime('now') WHERE id = ?`
    )
    .run(queueId);
}

/**
 * Mark a sync queue entry as failed with an error message.
 * Increments retry_count for exponential backoff logic.
 */
export function markSyncFailed(queueId: number, errorMessage: string): void {
  const database = getDb();
  database
    .prepare(
      `UPDATE _sync_queue
       SET status = CASE WHEN retry_count >= 4 THEN 'dead' ELSE 'pending' END,
           error_message = ?,
           retry_count = retry_count + 1
       WHERE id = ?`
    )
    .run(errorMessage, queueId);
}
