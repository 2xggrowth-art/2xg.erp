import { Router } from 'express';
import * as purchasesController from '../controllers/purchases.controller';

const router = Router();

router.get('/', purchasesController.getAllPurchaseOrders);
router.get('/summary', purchasesController.getPurchaseSummary);
router.get('/by-status', purchasesController.getPurchasesByStatus);

export default router;
