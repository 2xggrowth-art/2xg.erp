import { Request, Response } from 'express';
import { AIInsightsService } from '../services/ai-insights.service';

const aiInsightsService = new AIInsightsService();

export const getAllInsights = async (req: Request, res: Response) => {
  try {
    const { module, severity, status } = req.query;
    const filters = {
      module: module as string | undefined,
      severity: severity as string | undefined,
      status: status as string | undefined
    };
    const insights = await aiInsightsService.getAllInsights(filters);
    res.json({ success: true, data: insights });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getInsightsSummary = async (req: Request, res: Response) => {
  try {
    const summary = await aiInsightsService.getInsightsSummary();
    res.json({ success: true, data: summary });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPredictions = async (req: Request, res: Response) => {
  try {
    const { module, limit } = req.query;
    const predictions = await aiInsightsService.getPredictions(
      module as string | undefined,
      limit ? parseInt(limit as string) : 10
    );
    res.json({ success: true, data: predictions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPredictionsByModule = async (req: Request, res: Response) => {
  try {
    const data = await aiInsightsService.getPredictionsByModule();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBusinessHealthScore = async (req: Request, res: Response) => {
  try {
    const score = await aiInsightsService.getBusinessHealthScore();
    res.json({ success: true, data: score });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
