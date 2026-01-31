import apiClient from './api.client';

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
}

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

class PosSessionsService {
  private baseUrl = '/pos-sessions';

  /**
   * Get active session
   */
  async getActiveSession(): Promise<{ success: boolean; data: PosSession | null }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/active`);
      return response.data;
    } catch (error) {
      console.error('Error fetching active session:', error);
      throw error;
    }
  }

  /**
   * Start a new session
   */
  async startSession(data: CreateSessionData): Promise<{ success: boolean; data: PosSession; message: string }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/start`, data);
      return response.data;
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  }

  /**
   * Close a session
   */
  async closeSession(id: string, data: CloseSessionData): Promise<{ success: boolean; data: PosSession; message: string }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/${id}/close`, data);
      return response.data;
    } catch (error) {
      console.error('Error closing session:', error);
      throw error;
    }
  }

  /**
   * Get all sessions
   */
  async getAllSessions(filters?: {
    status?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<{ success: boolean; data: PosSession[] }> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.from_date) params.append('from_date', filters.from_date);
      if (filters?.to_date) params.append('to_date', filters.to_date);

      const queryString = params.toString();
      const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }
  }

  /**
   * Get session by ID
   */
  async getSessionById(id: string): Promise<{ success: boolean; data: PosSession }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching session:', error);
      throw error;
    }
  }

  /**
   * Update session sales
   */
  async updateSessionSales(sessionId: string, amount: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/${sessionId}/update-sales`, { amount });
      return response.data;
    } catch (error) {
      console.error('Error updating session sales:', error);
      throw error;
    }
  }

  /**
   * Record cash in/out
   */
  async recordCashMovement(sessionId: string, type: 'in' | 'out', amount: number): Promise<{ success: boolean; data: PosSession; message: string }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/${sessionId}/cash-movement`, { type, amount });
      return response.data;
    } catch (error) {
      console.error('Error recording cash movement:', error);
      throw error;
    }
  }

  /**
   * Generate session number
   */
  async generateSessionNumber(): Promise<{ success: boolean; data: { session_number: string } }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/generate-number`);
      return response.data;
    } catch (error) {
      console.error('Error generating session number:', error);
      throw error;
    }
  }
}

export const posSessionsService = new PosSessionsService();
