import { Request, Response } from 'express';
import { exchangesService } from '../services/exchanges.service';

export const exchangesController = {
  async create(req: Request, res: Response) {
    try {
      const { item_name, condition } = req.body;

      if (!item_name || !condition) {
        return res.status(400).json({
          success: false,
          error: 'Item name and condition are required',
        });
      }

      if (!['good', 'ok', 'bad'].includes(condition)) {
        return res.status(400).json({
          success: false,
          error: 'Condition must be good, ok, or bad',
        });
      }

      const user = (req as any).user;
      const item = await exchangesService.create({
        ...req.body,
        received_by: user?.userId,
        received_by_name: user?.employeeName || user?.email,
      });

      res.status(201).json({ success: true, data: item });
    } catch (error: any) {
      console.error('Create exchange error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create exchange item',
      });
    }
  },

  async getAll(req: Request, res: Response) {
    try {
      const { status, condition } = req.query;
      const items = await exchangesService.getAll({
        status: status as string,
        condition: condition as string,
      });
      res.json({ success: true, data: items });
    } catch (error: any) {
      console.error('Get exchanges error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch exchange items',
      });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const item = await exchangesService.getById(req.params.id);
      if (!item) {
        return res.status(404).json({
          success: false,
          error: 'Exchange item not found',
        });
      }
      res.json({ success: true, data: item });
    } catch (error: any) {
      console.error('Get exchange error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch exchange item',
      });
    }
  },

  async updateStatus(req: Request, res: Response) {
    try {
      const { status } = req.body;

      if (!status || !['received', 'listed', 'sold'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Status must be received, listed, or sold',
        });
      }

      const item = await exchangesService.updateStatus(req.params.id, status);
      res.json({ success: true, data: item });
    } catch (error: any) {
      console.error('Update exchange status error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update exchange status',
      });
    }
  },

  async getStats(_req: Request, res: Response) {
    try {
      const stats = await exchangesService.getStats();
      res.json({ success: true, data: stats });
    } catch (error: any) {
      console.error('Get exchange stats error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch exchange stats',
      });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      await exchangesService.delete(req.params.id);
      res.json({ success: true, message: 'Exchange item deleted' });
    } catch (error: any) {
      console.error('Delete exchange error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete exchange item',
      });
    }
  },
};

export default exchangesController;
