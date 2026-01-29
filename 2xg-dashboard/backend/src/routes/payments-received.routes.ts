import { Router } from 'express';
import { PaymentsReceivedController } from '../controllers/payments-received.controller';

const router = Router();
const paymentsReceivedController = new PaymentsReceivedController();

/**
 * @route   GET /api/payments-received/generate-number
 * @desc    Generate a new payment number
 * @access  Public
 */
router.get('/generate-number', paymentsReceivedController.generatePaymentNumber);

/**
 * @route   POST /api/payments-received
 * @desc    Create a new payment received
 * @access  Public
 */
router.post('/', paymentsReceivedController.createPaymentReceived);

/**
 * @route   GET /api/payments-received
 * @desc    Get all payments received with optional filters
 * @access  Public
 */
router.get('/', paymentsReceivedController.getAllPaymentsReceived);

/**
 * @route   GET /api/payments-received/:id
 * @desc    Get a single payment by ID
 * @access  Public
 */
router.get('/:id', paymentsReceivedController.getPaymentReceivedById);

/**
 * @route   PUT /api/payments-received/:id
 * @desc    Update a payment
 * @access  Public
 */
router.put('/:id', paymentsReceivedController.updatePaymentReceived);

/**
 * @route   DELETE /api/payments-received/:id
 * @desc    Delete a payment
 * @access  Public
 */
router.delete('/:id', paymentsReceivedController.deletePaymentReceived);

export default router;
