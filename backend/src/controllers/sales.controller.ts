import { Request, Response } from 'express';
import { SalesService } from '../services/sales.service';

const salesService = new SalesService();

export const getAllSalesOrders = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const orders = await salesService.getAllSalesOrders(startDate as string, endDate as string);
    res.json({ success: true, data: orders });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSalesSummary = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const summary = await salesService.getSalesSummary(startDate as string, endDate as string);
    res.json({ success: true, data: summary });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSalesByStatus = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await salesService.getSalesByStatus(startDate as string, endDate as string);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getTopCustomers = async (req: Request, res: Response) => {
  try {
    const { limit, startDate, endDate } = req.query;
    const customers = await salesService.getTopCustomers(
      limit ? parseInt(limit as string) : 10,
      startDate as string,
      endDate as string
    );
    res.json({ success: true, data: customers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
