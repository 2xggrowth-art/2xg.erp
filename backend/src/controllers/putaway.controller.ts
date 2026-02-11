import { Request, Response } from 'express';
import { PutawayService } from '../services/putaway.service';

const putawayService = new PutawayService();

export const getPending = async (req: Request, res: Response) => {
  try {
    const userId = req.query.assigned_to as string | undefined;
    const tasks = await putawayService.getPendingTasks(userId);
    res.json({ success: true, data: tasks });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getInProgress = async (req: Request, res: Response) => {
  try {
    const userId = req.query.assigned_to as string | undefined;
    const tasks = await putawayService.getInProgressTasks(userId);
    res.json({ success: true, data: tasks });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getHistory = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const tasks = await putawayService.getHistory(limit);
    res.json({ success: true, data: tasks });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const task = await putawayService.getTaskById(req.params.id);
    res.json({ success: true, data: task });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id as string | undefined;
    const stats = await putawayService.getStats(userId);
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const stats = await putawayService.getAdminStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const suggestBin = async (req: Request, res: Response) => {
  try {
    const suggestion = await putawayService.suggestBin(req.params.itemId);
    res.json({ success: true, data: suggestion });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const startTask = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const userName = (req as any).user?.employeeName || (req as any).user?.employee_name;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    const task = await putawayService.startTask(req.params.id, userId, userName);
    res.json({ success: true, data: task });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const placeItem = async (req: Request, res: Response) => {
  try {
    const { bin_location_id, quantity } = req.body;
    if (!bin_location_id || !quantity) {
      return res.status(400).json({ success: false, error: 'bin_location_id and quantity are required' });
    }
    const userId = (req as any).user?.userId || (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    const task = await putawayService.placeItem(req.params.id, bin_location_id, Number(quantity), userId);
    res.json({ success: true, data: task });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const createFromBill = async (req: Request, res: Response) => {
  try {
    const { bill_id } = req.body;
    if (!bill_id) {
      return res.status(400).json({ success: false, error: 'bill_id is required' });
    }
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const tasks = await putawayService.createTasksFromBill(bill_id, userId);
    res.json({ success: true, data: tasks });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
