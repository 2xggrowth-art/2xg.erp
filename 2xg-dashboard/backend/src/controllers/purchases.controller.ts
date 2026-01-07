import { Request, Response } from 'express';
import { PurchasesService } from '../services/purchases.service';

const purchasesService = new PurchasesService();

export const getAllPurchaseOrders = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const orders = await purchasesService.getAllPurchaseOrders(startDate as string, endDate as string);
    res.json({ success: true, data: orders });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPurchaseSummary = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const summary = await purchasesService.getPurchaseSummary(startDate as string, endDate as string);
    res.json({ success: true, data: summary });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPurchasesByStatus = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await purchasesService.getPurchasesByStatus(startDate as string, endDate as string);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
