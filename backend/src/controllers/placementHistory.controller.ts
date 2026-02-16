import { Request, Response } from 'express';
import placementHistoryService from '../services/placementHistory.service';

export const placementHistoryController = {
  async getAll(req: Request, res: Response) {
    try {
      const history = await placementHistoryService.getAll();
      res.json({ success: true, data: history });
    } catch (error: any) {
      console.error('Error fetching placement history:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to fetch placement history' });
    }
  },

  async getByItemId(req: Request, res: Response) {
    try {
      const { itemId } = req.params;
      const history = await placementHistoryService.getByItemId(itemId);
      res.json({ success: true, data: history });
    } catch (error: any) {
      console.error('Error fetching item placement history:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to fetch item history' });
    }
  },
};

export default placementHistoryController;
