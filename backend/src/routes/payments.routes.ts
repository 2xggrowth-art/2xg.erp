import { Router } from 'express';
import { PaymentsController } from '../controllers/payments.controller';

const router = Router();
const paymentsController = new PaymentsController();

// Generate payment number
router.get('/generate-payment-number', paymentsController.generatePaymentNumber);

// Get payments summary
router.get('/summary', paymentsController.getPaymentsSummary);

// CRUD operations
router.post('/', paymentsController.createPayment);
router.get('/', paymentsController.getAllPayments);
router.get('/:id', paymentsController.getPaymentById);
router.put('/:id', paymentsController.updatePayment);
router.delete('/:id', paymentsController.deletePayment);

export default router;
