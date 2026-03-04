import { IpcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';

export function registerSessionHandlers(ipcMain: IpcMain): void {
  // ---------------------------------------------------------------------------
  // sessions:getActive — Get the currently active (In-Progress) session
  // ---------------------------------------------------------------------------
  ipcMain.handle('sessions:getActive', async () => {
    try {
      const db = getDb();

      const row = db
        .prepare(
          `SELECT * FROM pos_sessions WHERE status = 'In-Progress' LIMIT 1`
        )
        .get();

      return { success: true, data: row || null };
    } catch (error: any) {
      console.error('[IPC] sessions:getActive error:', error);
      return { success: false, error: error.message };
    }
  });

  // ---------------------------------------------------------------------------
  // sessions:start — Open a new POS session
  // ---------------------------------------------------------------------------
  ipcMain.handle(
    'sessions:start',
    async (
      _event,
      data: { register: string; opened_by: string; opening_balance: number }
    ) => {
      try {
        const db = getDb();
        const id = uuidv4();
        const now = new Date().toISOString();

        // Generate session number
        const orgSettings = db
          .prepare(`SELECT session_prefix FROM org_settings ORDER BY synced_at DESC NULLS LAST LIMIT 1`)
          .get() as { session_prefix?: string } | undefined;

        const prefix = orgSettings?.session_prefix || 'POS1-S';

        const lastSession = db
          .prepare(
            `SELECT session_number FROM pos_sessions
             WHERE session_number LIKE ?
             ORDER BY session_number DESC
             LIMIT 1`
          )
          .get(`${prefix}-%`) as { session_number?: string } | undefined;

        let nextSeq = 1;
        if (lastSession?.session_number) {
          const parts = lastSession.session_number.split('-');
          const lastNum = parseInt(parts[parts.length - 1], 10);
          if (!isNaN(lastNum)) {
            nextSeq = lastNum + 1;
          }
        }

        const sessionNumber = `${prefix}-${String(nextSeq).padStart(3, '0')}`;

        db.prepare(
          `INSERT INTO pos_sessions (
            id, session_number, register, opened_by, opening_balance,
            total_sales, cash_in, cash_out, status, opened_at,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, 0, 0, 0, 'In-Progress', ?, ?, ?)`
        ).run(
          id,
          sessionNumber,
          data.register,
          data.opened_by,
          data.opening_balance,
          now,
          now,
          now
        );

        // Add to sync queue
        db.prepare(
          `INSERT INTO _sync_queue (table_name, record_id, operation, status, created_at)
           VALUES ('pos_sessions', ?, 'INSERT', 'pending', ?)`
        ).run(id, now);

        const created = db
          .prepare(`SELECT * FROM pos_sessions WHERE id = ?`)
          .get(id);

        return { success: true, data: created };
      } catch (error: any) {
        console.error('[IPC] sessions:start error:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // ---------------------------------------------------------------------------
  // sessions:close — Close an active POS session
  // ---------------------------------------------------------------------------
  ipcMain.handle(
    'sessions:close',
    async (
      _event,
      id: string,
      data: {
        closing_balance: number;
        cash_in: number;
        cash_out: number;
        closed_by?: string;
        denomination_data?: any[];
      }
    ) => {
      try {
        const db = getDb();
        const now = new Date().toISOString();

        const denominationJson = data.denomination_data
          ? JSON.stringify(data.denomination_data)
          : null;

        db.prepare(
          `UPDATE pos_sessions
           SET status = 'Closed',
               closed_at = ?,
               closing_balance = ?,
               closed_by = ?,
               cash_in = ?,
               cash_out = ?,
               denomination_data = ?,
               updated_at = ?
           WHERE id = ?`
        ).run(
          now,
          data.closing_balance,
          data.closed_by || null,
          data.cash_in,
          data.cash_out,
          denominationJson,
          now,
          id
        );

        // Add to sync queue with payload so sync engine can push closed_by
        const syncPayload = JSON.stringify({
          closing_balance: data.closing_balance,
          cash_in: data.cash_in,
          cash_out: data.cash_out,
          closed_by: data.closed_by || null,
          denomination_data: data.denomination_data || [],
        });

        db.prepare(
          `INSERT INTO _sync_queue (table_name, record_id, operation, payload, status, created_at)
           VALUES ('pos_sessions', ?, 'UPDATE', ?, 'pending', ?)`
        ).run(id, syncPayload, now);

        const updated = db
          .prepare(`SELECT * FROM pos_sessions WHERE id = ?`)
          .get(id);

        return { success: true, data: updated };
      } catch (error: any) {
        console.error('[IPC] sessions:close error:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // ---------------------------------------------------------------------------
  // sessions:getAll — List sessions with optional status filter
  // ---------------------------------------------------------------------------
  ipcMain.handle(
    'sessions:getAll',
    async (_event, filters?: { status?: string }) => {
      try {
        const db = getDb();
        const conditions: string[] = [];
        const params: any[] = [];

        if (filters?.status) {
          conditions.push(`status = ?`);
          params.push(filters.status);
        }

        const whereClause =
          conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const rows = db
          .prepare(
            `SELECT * FROM pos_sessions ${whereClause} ORDER BY opened_at DESC`
          )
          .all(...params);

        return { success: true, data: rows };
      } catch (error: any) {
        console.error('[IPC] sessions:getAll error:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // ---------------------------------------------------------------------------
  // sessions:getById — Get a single session by ID
  // ---------------------------------------------------------------------------
  ipcMain.handle('sessions:getById', async (_event, id: string) => {
    try {
      const db = getDb();

      const row = db
        .prepare(`SELECT * FROM pos_sessions WHERE id = ?`)
        .get(id);

      if (!row) {
        return { success: false, error: 'Session not found' };
      }

      return { success: true, data: row };
    } catch (error: any) {
      console.error('[IPC] sessions:getById error:', error);
      return { success: false, error: error.message };
    }
  });

  // ---------------------------------------------------------------------------
  // sessions:updateSales — Increment total_sales for a session
  // ---------------------------------------------------------------------------
  ipcMain.handle(
    'sessions:updateSales',
    async (_event, sessionId: string, amount: number) => {
      try {
        const db = getDb();
        const now = new Date().toISOString();

        db.prepare(
          `UPDATE pos_sessions
           SET total_sales = total_sales + ?,
               updated_at = ?
           WHERE id = ?`
        ).run(amount, now, sessionId);

        const updated = db
          .prepare(`SELECT * FROM pos_sessions WHERE id = ?`)
          .get(sessionId);

        return { success: true, data: updated };
      } catch (error: any) {
        console.error('[IPC] sessions:updateSales error:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // ---------------------------------------------------------------------------
  // sessions:cashMovement — Record cash-in or cash-out for a session
  // ---------------------------------------------------------------------------
  ipcMain.handle(
    'sessions:cashMovement',
    async (
      _event,
      sessionId: string,
      type: 'in' | 'out',
      amount: number
    ) => {
      try {
        const db = getDb();
        const now = new Date().toISOString();

        const column = type === 'in' ? 'cash_in' : 'cash_out';

        db.prepare(
          `UPDATE pos_sessions
           SET ${column} = ${column} + ?,
               updated_at = ?
           WHERE id = ?`
        ).run(amount, now, sessionId);

        const updated = db
          .prepare(`SELECT * FROM pos_sessions WHERE id = ?`)
          .get(sessionId);

        return { success: true, data: updated };
      } catch (error: any) {
        console.error('[IPC] sessions:cashMovement error:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // ---------------------------------------------------------------------------
  // sessions:generateNumber — Generate next session number without creating
  // ---------------------------------------------------------------------------
  ipcMain.handle('sessions:generateNumber', async () => {
    try {
      const db = getDb();

      const orgSettings = db
        .prepare(`SELECT session_prefix FROM org_settings ORDER BY synced_at DESC NULLS LAST LIMIT 1`)
        .get() as { session_prefix?: string } | undefined;

      const prefix = orgSettings?.session_prefix || 'POS1-S';

      const lastSession = db
        .prepare(
          `SELECT session_number FROM pos_sessions
           WHERE session_number LIKE ?
           ORDER BY session_number DESC
           LIMIT 1`
        )
        .get(`${prefix}-%`) as { session_number?: string } | undefined;

      let nextSeq = 1;
      if (lastSession?.session_number) {
        const parts = lastSession.session_number.split('-');
        const lastNum = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastNum)) {
          nextSeq = lastNum + 1;
        }
      }

      const sessionNumber = `${prefix}-${String(nextSeq).padStart(3, '0')}`;

      return { success: true, data: sessionNumber };
    } catch (error: any) {
      console.error('[IPC] sessions:generateNumber error:', error);
      return { success: false, error: error.message };
    }
  });
}
