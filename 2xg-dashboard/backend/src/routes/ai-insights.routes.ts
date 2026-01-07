import { Router } from 'express';
import * as aiInsightsController from '../controllers/ai-insights.controller';

const router = Router();

router.get('/insights', aiInsightsController.getAllInsights);
router.get('/insights/summary', aiInsightsController.getInsightsSummary);
router.get('/predictions', aiInsightsController.getPredictions);
router.get('/predictions/by-module', aiInsightsController.getPredictionsByModule);
router.get('/health-score', aiInsightsController.getBusinessHealthScore);

export default router;
