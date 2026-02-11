import { Request, Response } from 'express';
import { DamageReportsService } from '../services/damageReports.service';

const damageReportsService = new DamageReportsService();

export const getAll = async (req: Request, res: Response) => {
  try {
    const { status, item_id } = req.query;
    const filters = {
      status: status as string | undefined,
      item_id: item_id as string | undefined,
    };
    const data = await damageReportsService.getAll(filters);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const data = await damageReportsService.getById(req.params.id);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const userName = (req as any).user?.name || (req as any).user?.full_name;
    const data = await damageReportsService.create({
      ...req.body,
      reported_by_user_id: req.body.reported_by_user_id || userId,
      reported_by_name: req.body.reported_by_name || userName,
    });
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
    const data = await damageReportsService.updateStatus(req.params.id, status, userId, notes);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};
