import { supabaseAdmin as supabase } from '../config/supabase';

export interface CreateSessionData {
  register: string;
  opened_by: string;
  opening_balance: number;
}

export interface CloseSessionData {
  closing_balance: number;
  cash_in: number;
  cash_out: number;
}

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
  organization_id: string;
}

export class PosSessionsService {
  /**
   * Generate a new session number
   */
  async generateSessionNumber(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('pos_sessions')
        .select('session_number')
        .not('session_number', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (!data || data.length === 0) {
        return 'SE1-001';
      }

      // Find the highest session number matching SE1-XXX format
      let maxNum = 0;
      for (const s of data) {
        const match = s.session_number?.match(/^SE1-(\d+)$/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxNum) maxNum = num;
        }
      }

      const nextNum = maxNum + 1;
      return `SE1-${nextNum.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating session number:', error);
      throw error;
    }
  }

  /**
   * Get active session
   */
  async getActiveSession(): Promise<PosSession | null> {
    try {
      const { data, error } = await supabase
        .from('pos_sessions')
        .select('*')
        .eq('status', 'In-Progress')
        .order('opened_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    } catch (error: any) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching active session:', error);
      throw error;
    }
  }

  /**
   * Start a new session
   */
  async startSession(data: CreateSessionData): Promise<PosSession> {
    try {
      // Check if there's already an active session
      const activeSession = await this.getActiveSession();
      if (activeSession) {
        throw new Error('An active session already exists. Please close it before starting a new one.');
      }

      const sessionNumber = await this.generateSessionNumber();

      // Get organization_id
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single();

      const { data: session, error } = await supabase
        .from('pos_sessions')
        .insert({
          organization_id: org?.id || '00000000-0000-0000-0000-000000000000',
          session_number: sessionNumber,
          register: data.register,
          opened_by: data.opened_by,
          opened_at: new Date().toISOString(),
          status: 'In-Progress',
          opening_balance: data.opening_balance || 0,
          cash_in: 0,
          cash_out: 0,
          total_sales: 0,
        })
        .select()
        .single();

      if (error) throw error;

      return session;
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  }

  /**
   * Close an active session
   */
  async closeSession(id: string, data: CloseSessionData): Promise<PosSession> {
    try {
      const { data: session, error } = await supabase
        .from('pos_sessions')
        .update({
          closed_at: new Date().toISOString(),
          status: 'Closed',
          closing_balance: data.closing_balance,
          cash_in: data.cash_in,
          cash_out: data.cash_out,
        })
        .eq('id', id)
        .eq('status', 'In-Progress')
        .select()
        .single();

      if (error) throw error;

      return session;
    } catch (error) {
      console.error('Error closing session:', error);
      throw error;
    }
  }

  /**
   * Update session sales total
   */
  async updateSessionSales(sessionId: string, saleAmount: number): Promise<void> {
    try {
      // Get current session
      const { data: session, error: fetchError } = await supabase
        .from('pos_sessions')
        .select('total_sales')
        .eq('id', sessionId)
        .single();

      if (fetchError) throw fetchError;

      const newTotal = (session.total_sales || 0) + saleAmount;

      const { error: updateError } = await supabase
        .from('pos_sessions')
        .update({ total_sales: newTotal })
        .eq('id', sessionId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error updating session sales:', error);
      throw error;
    }
  }

  /**
   * Get all sessions with optional filters
   */
  async getAllSessions(filters?: {
    status?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<PosSession[]> {
    try {
      let query = supabase
        .from('pos_sessions')
        .select('*')
        .order('opened_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.from_date) {
        query = query.gte('opened_at', filters.from_date);
      }

      if (filters?.to_date) {
        query = query.lte('opened_at', filters.to_date);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }
  }

  /**
   * Get session by ID
   */
  async getSessionById(id: string): Promise<PosSession | null> {
    try {
      const { data, error } = await supabase
        .from('pos_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching session:', error);
      throw error;
    }
  }

  /**
   * Record cash in/out for a session
   */
  async recordCashMovement(sessionId: string, type: 'in' | 'out', amount: number): Promise<PosSession> {
    try {
      // Get current session
      const { data: session, error: fetchError } = await supabase
        .from('pos_sessions')
        .select('cash_in, cash_out')
        .eq('id', sessionId)
        .eq('status', 'In-Progress')
        .single();

      if (fetchError) throw fetchError;

      const updateData = type === 'in'
        ? { cash_in: (session.cash_in || 0) + amount }
        : { cash_out: (session.cash_out || 0) + amount };

      const { data: updated, error: updateError } = await supabase
        .from('pos_sessions')
        .update(updateData)
        .eq('id', sessionId)
        .select()
        .single();

      if (updateError) throw updateError;

      return updated;
    } catch (error) {
      console.error('Error recording cash movement:', error);
      throw error;
    }
  }
}
