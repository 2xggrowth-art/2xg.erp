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

export const getItemById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = await itemsService.getItemById(id);
    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createItem = async (req: Request, res: Response) => {
  try {
    console.log('Creating item with data:', req.body);
    const item = await itemsService.createItem(req.body);
    console.log('Item created successfully:', item);
    res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    console.error('Error creating item:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = await itemsService.updateItem(id, req.body);
    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = await itemsService.deleteItem(id);
    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
