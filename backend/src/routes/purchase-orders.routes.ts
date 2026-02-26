import { Router } from 'express';
import * as poController from '../controllers/purchase-orders.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

// GET routes
router.get('/', poController.getAllPurchaseOrders);
router.get('/summary', poController.getPurchaseOrdersSummary);
router.get('/generate-po-number', poController.generatePONumber);
router.get('/:id', poController.getPurchaseOrderById);

// POST routes
router.post('/', requireRole('Admin', 'Manager'), poController.createPurchaseOrder);

// PUT routes
router.put('/:id', requireRole('Admin', 'Manager'), poController.updatePurchaseOrder);

// DELETE routes
router.delete('/:id', requireRole('Admin', 'Manager'), poController.deletePurchaseOrder);

export default router;
