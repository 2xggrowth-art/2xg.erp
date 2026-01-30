import { Request, Response } from 'express';
import { PosSessionsService } from '../services/pos-sessions.service';

const posSessionsService = new PosSessionsService();

export class PosSessionsController {
  /**
   * Get active session
   */
  async getActiveSession(req: Request, res: Response) {
    try {
      const session = await posSessionsService.getActiveSession();
      res.json({
        success: true,
        data: session,
      });
    } catch (error: any) {
      console.error('Error fetching active session:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch active session',
      });
    }
  }

  /**
   * Start a new session
   */
  async startSession(req: Request, res: Response) {
    try {
      const { register, opened_by, opening_balance } = req.body;

      if (!register) {
        return res.status(400).json({
          success: false,
          error: 'Register name is required',
        });
      }

      if (!opened_by) {
        return res.status(400).json({
          success: false,
          error: 'Opened by is required',
        });
      }

      const session = await posSessionsService.startSession({
        register,
        opened_by,
        opening_balance: opening_balance || 0,
      });

      res.status(201).json({
        success: true,
        data: session,
        message: 'Session started successfully',
      });
    } catch (error: any) {
      console.error('Error starting session:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to start session',
      });
    }
  }

  /**
   * Close a session
   */
  async closeSession(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { closing_balance, cash_in, cash_out } = req.body;

      const session = await posSessionsService.closeSession(id, {
        closing_balance: closing_balance || 0,
        cash_in: cash_in || 0,
        cash_out: cash_out || 0,
      });

      res.json({
        success: true,
        data: session,
        message: 'Session closed successfully',
      });
    } catch (error: any) {
      console.error('Error closing session:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to close session',
      });
    }
  }

  /**
   * Get all sessions
   */
  async getAllSessions(req: Request, res: Response) {
    try {
      const { status, from_date, to_date } = req.query;

      const sessions = await posSessionsService.getAllSessions({
        status: status as string,
        from_date: from_date as string,
        to_date: to_date as string,
      });

      res.json({
        success: true,
        data: sessions,
      });
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch sessions',
      });
    }
  }

  /**
   * Get session by ID
   */
  async getSessionById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const session = await posSessionsService.getSessionById(id);

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found',
        });
      }

      res.json({
        success: true,
        data: session,
      });
    } catch (error: any) {
      console.error('Error fetching session:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch session',
      });
    }
  }

  /**
   * Update session sales
   */
  async updateSessionSales(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { amount } = req.body;

      if (typeof amount !== 'number') {
        return res.status(400).json({
          success: false,
          error: 'Sale amount is required',
        });
      }

      await posSessionsService.updateSessionSales(id, amount);

      res.json({
        success: true,
        message: 'Session sales updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating session sales:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update session sales',
      });
    }
  }

  /**
   * Record cash in/out
   */
  async recordCashMovement(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { type, amount } = req.body;

      if (!type || !['in', 'out'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Valid type (in/out) is required',
        });
      }

      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Valid amount is required',
        });
      }

      const session = await posSessionsService.recordCashMovement(id, type, amount);

      res.json({
        success: true,
        data: session,
        message: `Cash ${type} recorded successfully`,
      });
    } catch (error: any) {
      console.error('Error recording cash movement:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to record cash movement',
      });
    }
  }

  /**
   * Generate session number
   */
  async generateSessionNumber(req: Request, res: Response) {
    try {
      const sessionNumber = await posSessionsService.generateSessionNumber();
      res.json({
        success: true,
        data: { session_number: sessionNumber },
      });
    } catch (error: any) {
      console.error('Error generating session number:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate session number',
      });
    }
  }
}
