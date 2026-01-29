import { Router } from 'express';
import * as poController from '../controllers/purchase-orders.controller';

const router = Router();

// GET routes
router.get('/', poController.getAllPurchaseOrders);
router.get('/summary', poController.getPurchaseOrdersSummary);
router.get('/generate-po-number', poController.generatePONumber);
router.get('/:id', poController.getPurchaseOrderById);

// POST routes
router.post('/', poController.createPurchaseOrder);

// PUT routes
router.put('/:id', poController.updatePurchaseOrder);

// DELETE routes
router.delete('/:id', poController.deletePurchaseOrder);

export default router;
