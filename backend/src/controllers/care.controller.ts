import { Request, Response } from 'express';
import { CareService } from '../services/care.service';

export class CareController {
  private careService: CareService;

  constructor() {
    this.careService = new CareService();
  }

  getTotalTickets = async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const data = await this.careService.getTotalTickets(
        startDate as string,
        endDate as string
      );
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  getTicketsByCategory = async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const data = await this.careService.getTicketsByCategory(
        startDate as string,
        endDate as string
      );
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  getTicketTrends = async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const data = await this.careService.getTicketTrends(
        startDate as string,
        endDate as string
      );
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
}
