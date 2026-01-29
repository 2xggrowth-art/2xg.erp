import { Request, Response } from 'express';
import { ReportsService } from '../services/reports.service';

const reportsService = new ReportsService();

export const getAllTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await reportsService.getAllTemplates();
    res.json({ success: true, data: templates });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getGeneratedReports = async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const reports = await reportsService.getGeneratedReports(limit ? parseInt(limit as string) : 50);
    res.json({ success: true, data: reports });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getReportsSummary = async (req: Request, res: Response) => {
  try {
    const summary = await reportsService.getReportsSummary();
    res.json({ success: true, data: summary });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getReportsByType = async (req: Request, res: Response) => {
  try {
    const data = await reportsService.getReportsByType();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
