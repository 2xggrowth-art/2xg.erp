import { Request, Response } from 'express';
import { ItemsService } from '../services/items.service';

const itemsService = new ItemsService();

export const getAllItems = async (req: Request, res: Response) => {
  try {
    const { category, isActive, lowStock } = req.query;

    const filters = {
      category: category as string | undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      lowStock: lowStock === 'true'
    };

    const items = await itemsService.getAllItems(filters);
    res.json({ success: true, data: items });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getItemsSummary = async (req: Request, res: Response) => {
  try {
    const summary = await itemsService.getItemsSummary();
    res.json({ success: true, data: summary });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getTopSellingItems = async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const items = await itemsService.getTopSellingItems(limit ? parseInt(limit as string) : 10);
    res.json({ success: true, data: items });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
