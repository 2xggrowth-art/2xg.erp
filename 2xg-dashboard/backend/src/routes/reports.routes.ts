import { Router } from 'express';
import * as reportsController from '../controllers/reports.controller';

const router = Router();

router.get('/templates', reportsController.getAllTemplates);
router.get('/generated', reportsController.getGeneratedReports);
router.get('/summary', reportsController.getReportsSummary);
router.get('/by-type', reportsController.getReportsByType);

export default router;
