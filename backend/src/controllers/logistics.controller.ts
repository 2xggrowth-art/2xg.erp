import { Request, Response } from 'express';
import { LogisticsService } from '../services/logistics.service';

export class LogisticsController {
  private logisticsService: LogisticsService;

  constructor() {
    this.logisticsService = new LogisticsService();
  }

  getShipmentSummary = async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const data = await this.logisticsService.getShipmentSummary(
        startDate as string,
        endDate as string
      );
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  getDeliverySummary = async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const data = await this.logisticsService.getDeliverySummary(
        startDate as string,
        endDate as string
      );
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  getDeliveryList = async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, type } = req.query;
      const data = await this.logisticsService.getDeliveryList(
        startDate as string,
        endDate as string,
        type as string
      );
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
}
