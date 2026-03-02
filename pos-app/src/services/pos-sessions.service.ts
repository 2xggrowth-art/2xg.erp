import { ipc } from './ipc-client';

export interface PosSession {
  id: string;
  session_number: string;
  register: string;
  opened_by: string;
  opened_at: string;
  closed_at?: string;
  status: 'In-Progress' | 'Closed';
  opening_balance: number;
  closing_balance?: number;
  cash_in: number;
  cash_out: number;
  total_sales: number;
  denomination_data?: { note: number; count: number; total: number }[];
}

export interface CreateSessionData {
  register: string;
  opened_by: string;
  opening_balance: number;
}

export interface DenominationEntry {
  note: number;
  count: number;
  total: number;
}

export interface CloseSessionData {
  closing_balance: number;
  cash_in: number;
  cash_out: number;
  denomination_data?: DenominationEntry[];
}

class PosSessionsService {
  async getActiveSession(): Promise<{ success: boolean; data: PosSession | null }> {
    return await ipc().getActiveSession();
  }

  async startSession(data: CreateSessionData): Promise<{ success: boolean; data: PosSession; message: string }> {
    const result = await ipc().startSession(data);
    if (!result.success) throw new Error(result.error || 'Failed to start session');
    return result;
  }

  async closeSession(id: string, data: CloseSessionData): Promise<{ success: boolean; data: PosSession; message: string }> {
    const result = await ipc().closeSession(id, data);
    if (!result.success) throw new Error(result.error || 'Failed to close session');
    return result;
  }

  async getAllSessions(filters?: { status?: string }): Promise<{ success: boolean; data: PosSession[] }> {
    return await ipc().getAllSessions(filters);
  }

  async getSessionById(id: string): Promise<{ success: boolean; data: PosSession }> {
    return await ipc().getSessionById(id);
  }

  async updateSessionSales(sessionId: string, amount: number): Promise<{ success: boolean; message: string }> {
    return await ipc().updateSessionSales(sessionId, amount);
  }

  async recordCashMovement(sessionId: string, type: 'in' | 'out', amount: number): Promise<{ success: boolean; data: PosSession; message: string }> {
    return await ipc().recordCashMovement(sessionId, type, amount);
  }

  async generateSessionNumber(): Promise<{ success: boolean; data: { session_number: string } }> {
    return await ipc().generateSessionNumber();
  }
}

export const posSessionsService = new PosSessionsService();
