import { Request, Response } from 'express';
import adminService from '../services/admin.service';

export const adminController = {
  async getCounterWorkload(req: Request, res: Response) {
    try {
      const counters = await adminService.getCounterWorkload();
      res.json({ success: true, data: counters });
    } catch (error: any) {
      console.error('Error fetching counter workload:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to fetch counter workload' });
    }
  },

  async getSchedules(req: Request, res: Response) {
    try {
      const schedules = await adminService.getSchedules();
      res.json({ success: true, data: schedules });
    } catch (error: any) {
      console.error('Error fetching schedules:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to fetch schedules' });
    }
  },

  async saveSchedules(req: Request, res: Response) {
    try {
      const { schedules } = req.body;
      if (!schedules || !Array.isArray(schedules)) {
        return res.status(400).json({ success: false, error: 'schedules array is required' });
      }
      const result = await adminService.saveSchedules(schedules);
      res.json({ success: true, data: result, message: 'Schedules saved successfully' });
    } catch (error: any) {
      console.error('Error saving schedules:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to save schedules' });
    }
  },

  async getEscalations(req: Request, res: Response) {
    try {
      const escalations = await adminService.getEscalations();
      res.json({ success: true, data: escalations });
    } catch (error: any) {
      console.error('Error fetching escalations:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to fetch escalations' });
    }
  },
};

export default adminController;
