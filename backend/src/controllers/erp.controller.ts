import { Request, Response } from 'express';
import { ErpService } from '../services/erp.service';

export class ErpController {
  private erpService: ErpService;

  constructor() {
    this.erpService = new ErpService();
  }

  getTotalSales = async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const data = await this.erpService.calculateTotalSales(
        startDate as string,
        endDate as string
      );
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  getSalesByCategory = async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const data = await this.erpService.getSalesByCategory(
        startDate as string,
        endDate as string
      );
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  getOverdueAmount = async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const data = await this.erpService.getOverdueAmount(
        startDate as string,
        endDate as string
      );
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  getHotSellingItems = async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const data = await this.erpService.getHotSellingItems(limit);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  getLowStockItems = async (req: Request, res: Response) => {
    try {
      const data = await this.erpService.getLowStockItems();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
}
