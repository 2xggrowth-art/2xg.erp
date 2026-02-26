import express from 'express';
import { TransferOrdersController } from '../controllers/transfer-orders.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = express.Router();
const controller = new TransferOrdersController();

// Generate transfer order number
router.get('/generate-transfer-order-number', controller.generateTransferOrderNumber);

// Get item stock grouped by location (for transfer order form)
router.get('/item-stock/:itemId', controller.getItemLocationStock);

// Get transfer orders summary
router.get('/summary', controller.getTransferOrdersSummary);

// Get all transfer orders
router.get('/', controller.getAllTransferOrders);

// Get transfer order by ID
router.get('/:id', controller.getTransferOrderById);

// Create transfer order
router.post('/', requireRole('Admin', 'Manager'), controller.createTransferOrder);

// Update transfer order
router.put('/:id', requireRole('Admin', 'Manager'), controller.updateTransferOrder);

// Update transfer order status
router.patch('/:id/status', requireRole('Admin', 'Manager'), controller.updateTransferOrderStatus);

// Delete transfer order
router.delete('/:id', requireRole('Admin', 'Manager'), controller.deleteTransferOrder);

export default router;
