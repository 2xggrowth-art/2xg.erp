import { Request, Response } from 'express';
import { BatchesService } from '../services/batches.service';

export class BatchesController {
  private batchesService: BatchesService;

  constructor() {
    this.batchesService = new BatchesService();
  }

  /**
   * Get all batches for an item
   */
  getBatchesForItem = async (req: Request, res: Response) => {
    try {
      const { itemId } = req.params;
      const includeEmpty = req.query.includeEmpty === 'true';
      const batches = await this.batchesService.getBatchesForItem(itemId, includeEmpty);
      res.json({
        success: true,
        data: batches
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Get a single batch by ID
   */
  getBatchById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const batch = await this.batchesService.getBatchById(id);

      if (!batch) {
        return res.status(404).json({
          success: false,
          error: 'Batch not found'
        });
      }

      res.json({
        success: true,
        data: batch
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Get deductions for a batch
   */
  getBatchDeductions = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deductions = await this.batchesService.getBatchDeductions(id);
      res.json({
        success: true,
        data: deductions
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };
}
