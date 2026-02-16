import { Request, Response } from 'express';
import damageReportsService from '../services/damageReports.service';

export const damageReportsController = {
  // Create a new damage report
  async create(req: Request, res: Response) {
    try {
      // Normalize: frontend may send 'description' instead of 'damage_description'
      const body = { ...req.body };
      if (body.description && !body.damage_description) {
        body.damage_description = body.description;
      }
      const report = await damageReportsService.create(body);
      res.status(201).json({
        success: true,
        data: report,
        message: 'Damage report created successfully',
      });
    } catch (error: any) {
      console.error('Error creating damage report:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create damage report',
      });
    }
  },

  // Get all damage reports
  async getAll(req: Request, res: Response) {
    try {
      const { status, item_id, stock_count_id } = req.query;
      const reports = await damageReportsService.getAll({
        status: status as string,
        item_id: item_id as string,
        stock_count_id: stock_count_id as string,
      });
      res.json({
        success: true,
        data: reports,
      });
    } catch (error: any) {
      console.error('Error fetching damage reports:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch damage reports',
      });
    }
  },

  // Get a single damage report
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const report = await damageReportsService.getById(id);
      if (!report) {
        return res.status(404).json({
          success: false,
          error: 'Damage report not found',
        });
      }
      res.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error fetching damage report:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch damage report',
      });
    }
  },

  // Review (approve/reject) a damage report
  async review(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, review_notes } = req.body;
      const userId = (req as any).user?.id;

      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Status must be either "approved" or "rejected"',
        });
      }

      const report = await damageReportsService.review(id, {
        status,
        reviewed_by: userId,
        review_notes,
      });

      res.json({
        success: true,
        data: report,
        message: `Damage report ${status} successfully`,
      });
    } catch (error: any) {
      console.error('Error reviewing damage report:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to review damage report',
      });
    }
  },

  // Get pending count
  async getPendingCount(req: Request, res: Response) {
    try {
      const count = await damageReportsService.getPendingCount();
      res.json({
        success: true,
        data: { count },
      });
    } catch (error: any) {
      console.error('Error getting pending count:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get pending count',
      });
    }
  },

  // Delete a damage report
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await damageReportsService.delete(id);
      res.json({
        success: true,
        message: 'Damage report deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting damage report:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete damage report',
      });
    }
  },
};

export default damageReportsController;
