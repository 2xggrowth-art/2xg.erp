import { Router } from 'express';
import adminController from '../controllers/admin.controller';

const router = Router();

// Counter workload and performance
router.get('/counters/workload', adminController.getCounterWorkload);

// Schedule configuration
router.get('/schedules', adminController.getSchedules);
router.put('/schedules', adminController.saveSchedules);

// Escalations
router.get('/escalations', adminController.getEscalations);

export default router;
