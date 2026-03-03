import { Request, Response } from 'express';
import { PricelistsService } from '../services/pricelists.service';

const pricelistsService = new PricelistsService();

export class PricelistsController {
  /**
   * Create a new pricelist
   */
  createPricelist = async (req: Request, res: Response) => {
    try {
      const { name } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Pricelist name is required',
        });
      }

      const pricelist = await pricelistsService.createPricelist(
        req.body,
        (req as any).user?.organizationId
      );

      res.status(201).json({
        success: true,
        data: pricelist,
        message: 'Pricelist created successfully',
      });
    } catch (error: any) {
      console.error('Error creating pricelist:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create pricelist',
      });
    }
  };

  /**
   * Get all pricelists
   */
  getAllPricelists = async (req: Request, res: Response) => {
    try {
      const pricelists = await pricelistsService.getAllPricelists(
        (req as any).user?.organizationId
      );

      res.json({
        success: true,
        data: pricelists,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch pricelists',
      });
    }
  };

  /**
   * Get pricelist by ID with items
   */
  getPricelistById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const pricelist = await pricelistsService.getPricelistById(id);

      if (!pricelist) {
        return res.status(404).json({
          success: false,
          error: 'Pricelist not found',
        });
      }

      res.json({
        success: true,
        data: pricelist,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch pricelist',
      });
    }
  };

  /**
   * Update a pricelist
   */
  updatePricelist = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const pricelist = await pricelistsService.updatePricelist(id, req.body);

      res.json({
        success: true,
        data: pricelist,
        message: 'Pricelist updated successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update pricelist',
      });
    }
  };

  /**
   * Soft delete a pricelist
   */
  deletePricelist = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const pricelist = await pricelistsService.deletePricelist(id);

      res.json({
        success: true,
        data: pricelist,
        message: 'Pricelist deactivated successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete pricelist',
      });
    }
  };

  /**
   * Bulk update pricelist items
   */
  setPricelistItems = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { items } = req.body;

      if (!Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          error: 'Items must be an array',
        });
      }

      // Validate each item
      for (const item of items) {
        if (!item.item_id) {
          return res.status(400).json({
            success: false,
            error: 'Each pricelist item must have an item_id',
          });
        }
        if (item.price === undefined || Number(item.price) < 0) {
          return res.status(400).json({
            success: false,
            error: 'Each pricelist item must have a valid price',
          });
        }
      }

      const result = await pricelistsService.setPricelistItems(id, items);

      res.json({
        success: true,
        data: result,
        message: 'Pricelist items updated successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update pricelist items',
      });
    }
  };

  /**
   * Get pricelist item prices
   */
  getItemPrices = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const items = await pricelistsService.getItemPrices(id);

      res.json({
        success: true,
        data: items,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch pricelist items',
      });
    }
  };
}
