import { Request, Response } from 'express';
import { StockCountsService } from '../services/stockCounts.service';

const stockCountsService = new StockCountsService();

export class StockCountsController {
  /**
   * Get all stock counts
   */
  async getStockCounts(req: Request, res: Response) {
    try {
      const { assigned_to, status, count_type } = req.query;

      const counts = await stockCountsService.getStockCounts({
        assigned_to: assigned_to as string,
        status: status as string,
        count_type: count_type as string,
      });

      res.json({ success: true, data: counts });
    } catch (error: any) {
      console.error('Error fetching stock counts:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get stock counts assigned to a specific user (mobile app)
   */
  async getAssignedStockCounts(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const counts = await stockCountsService.getStockCounts({
        assigned_to: userId,
      });

      res.json({ success: true, data: counts });
    } catch (error: any) {
      console.error('Error fetching assigned stock counts:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get a single stock count with items
   */
  async getStockCount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const count = await stockCountsService.getStockCount(id);
      res.json({ success: true, data: count });
    } catch (error: any) {
      console.error('Error fetching stock count:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Create a new stock count (admin)
   */
  async createStockCount(req: Request, res: Response) {
    try {
      const count = await stockCountsService.createStockCount(req.body);
      res.status(201).json({ success: true, data: count });
    } catch (error: any) {
      console.error('Error creating stock count:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Start a count (counter)
   */
  async startCount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const count = await stockCountsService.startCount(id);
      res.json({ success: true, data: count });
    } catch (error: any) {
      console.error('Error starting count:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Update item count (counter scans/enters quantity)
   */
  async updateItemCount(req: Request, res: Response) {
    try {
      const { id, itemId } = req.params;
      const { counted_quantity, notes } = req.body;

      const item = await stockCountsService.updateItemCount(id, itemId, {
        counted_quantity,
        notes,
      });

      res.json({ success: true, data: item });
    } catch (error: any) {
      console.error('Error updating item count:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Bulk update item counts (mobile app)
   */
  async bulkUpdateItems(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { items } = req.body; // Array of { id, counted_quantity, notes? }

      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ success: false, error: 'Items array is required' });
      }

      // Update each item
      for (const item of items) {
        await stockCountsService.updateItemCount(id, item.id, {
          counted_quantity: item.counted_quantity,
          notes: item.notes,
        });
      }

      res.json({ success: true, message: 'Items updated successfully' });
    } catch (error: any) {
      console.error('Error bulk updating items:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Update stock count status (mobile app)
   */
  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      let count;
      if (status === 'in_progress') {
        count = await stockCountsService.startCount(id);
      } else if (status === 'submitted') {
        count = await stockCountsService.submitCount(id);
      } else {
        return res.status(400).json({
          success: false,
          error: `Invalid status: ${status}. Use 'in_progress' or 'submitted'.`
        });
      }

      res.json({ success: true, data: count });
    } catch (error: any) {
      console.error('Error updating status:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Submit count for review (counter)
   */
  async submitCount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const count = await stockCountsService.submitCount(id);
      res.json({ success: true, data: count, message: 'Count submitted for review' });
    } catch (error: any) {
      console.error('Error submitting count:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Approve count (admin)
   */
  async approveCount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reviewed_by, reviewed_by_name, review_notes } = req.body;

      const count = await stockCountsService.approveCount(
        id,
        reviewed_by,
        reviewed_by_name,
        review_notes
      );

      res.json({ success: true, data: count, message: 'Count approved' });
    } catch (error: any) {
      console.error('Error approving count:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Reject count (admin)
   */
  async rejectCount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reviewed_by, reviewed_by_name, review_notes } = req.body;

      const count = await stockCountsService.rejectCount(
        id,
        reviewed_by,
        reviewed_by_name,
        review_notes
      );

      res.json({ success: true, data: count, message: 'Count rejected' });
    } catch (error: any) {
      console.error('Error rejecting count:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Request recount (admin)
   */
  async requestRecount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reviewed_by, reviewed_by_name, review_notes } = req.body;

      const count = await stockCountsService.requestRecount(
        id,
        reviewed_by,
        reviewed_by_name,
        review_notes
      );

      res.json({ success: true, data: count, message: 'Recount requested' });
    } catch (error: any) {
      console.error('Error requesting recount:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get dashboard stats (admin)
   */
  async getStats(req: Request, res: Response) {
    try {
      const stats = await stockCountsService.getStats();
      res.json({ success: true, data: stats });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get counter performance stats
   */
  async getCounterStats(req: Request, res: Response) {
    try {
      const { mobileUserId } = req.params;
      const stats = await stockCountsService.getCounterStats(mobileUserId);
      res.json({ success: true, data: stats });
    } catch (error: any) {
      console.error('Error fetching counter stats:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
