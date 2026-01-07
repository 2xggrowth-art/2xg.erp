import { Router } from 'express';
import * as salesController from '../controllers/sales.controller';

const router = Router();

router.get('/', salesController.getAllSalesOrders);
router.get('/summary', salesController.getSalesSummary);
router.get('/by-status', salesController.getSalesByStatus);
router.get('/top-customers', salesController.getTopCustomers);

export default router;
