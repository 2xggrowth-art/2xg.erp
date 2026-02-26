import { Router } from 'express';
import { PaymentsController } from '../controllers/payments.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();
const paymentsController = new PaymentsController();

// Generate payment number
router.get('/generate-payment-number', paymentsController.generatePaymentNumber);

// Get payments summary
router.get('/summary', paymentsController.getPaymentsSummary);

// CRUD operations
router.post('/', requireRole('Admin', 'Manager'), paymentsController.createPayment);
router.get('/', paymentsController.getAllPayments);
router.get('/:id', paymentsController.getPaymentById);
router.put('/:id', requireRole('Admin', 'Manager'), paymentsController.updatePayment);
router.delete('/:id', requireRole('Admin', 'Manager'), paymentsController.deletePayment);

export default router;
