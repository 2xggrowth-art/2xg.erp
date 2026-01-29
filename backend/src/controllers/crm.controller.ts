import { Request, Response } from 'express';
import { CrmService } from '../services/crm.service';

export class CrmController {
  private crmService: CrmService;

  constructor() {
    this.crmService = new CrmService();
  }

  getLeadReporting = async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const data = await this.crmService.getLeadReporting(
        startDate as string,
        endDate as string
      );
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  getCustomers = async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const data = await this.crmService.getCustomers(
        startDate as string,
        endDate as string
      );
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  getLeadsByStatus = async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const data = await this.crmService.getLeadsByStatus(
        startDate as string,
        endDate as string
      );
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
}
