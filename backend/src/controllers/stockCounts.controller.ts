import { Request, Response } from 'express';
import { StockCountsService } from '../services/stockCounts.service';

const stockCountsService = new StockCountsService();

export const generateNumber = async (req: Request, res: Response) => {
  try {
    const number = await stockCountsService.generateNumber();
    res.json({ success: true, data: { number } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAll = async (req: Request, res: Response) => {
  try {
    const { status, location_id, assigned_to } = req.query;
    const filters = {
      status: status as string | undefined,
      location_id: location_id as string | undefined,
      assigned_to: assigned_to as string | undefined,
    };
    const data = await stockCountsService.getAll(filters);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const data = await stockCountsService.getById(req.params.id);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAssigned = async (req: Request, res: Response) => {
  try {
    const data = await stockCountsService.getAssigned(req.params.userId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const data = await stockCountsService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const data = await stockCountsService.update(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const data = await stockCountsService.delete(req.params.id);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateCountedQuantities = async (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, error: 'items array is required' });
    }
    const data = await stockCountsService.updateCountedQuantities(req.params.id, items);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createBinScan = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const userName = (req as any).user?.name || (req as any).user?.username;
    const body = {
      ...req.body,
      scanned_by_user_id: req.body.scanned_by_user_id || userId,
      scanned_by_name: req.body.scanned_by_name || userName,
    };
    const data = await stockCountsService.createFromBinScan(body);
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { status, notes } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'status is required' });
    }
    const userId = (req as any).user?.id;
    const data = await stockCountsService.updateStatus(req.params.id, status, userId, notes);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};
