import { Router } from 'express';
import { DeliveryChallansController } from '../controllers/delivery-challans.controller';

const router = Router();
const deliveryChallansController = new DeliveryChallansController();

/**
 * @route   GET /api/delivery-challans/generate-number
 * @desc    Generate a new delivery challan number
 * @access  Public
 */
router.get('/generate-number', deliveryChallansController.generateChallanNumber);

/**
 * @route   POST /api/delivery-challans
 * @desc    Create a new delivery challan
 * @access  Public
 */
router.post('/', deliveryChallansController.createDeliveryChallan);

/**
 * @route   GET /api/delivery-challans
 * @desc    Get all delivery challans with optional filters
 * @access  Public
 */
router.get('/', deliveryChallansController.getAllDeliveryChallans);

/**
 * @route   GET /api/delivery-challans/:id
 * @desc    Get a single delivery challan by ID
 * @access  Public
 */
router.get('/:id', deliveryChallansController.getDeliveryChallanById);

/**
 * @route   PUT /api/delivery-challans/:id
 * @desc    Update a delivery challan
 * @access  Public
 */
router.put('/:id', deliveryChallansController.updateDeliveryChallan);

/**
 * @route   DELETE /api/delivery-challans/:id
 * @desc    Delete a delivery challan
 * @access  Public
 */
router.delete('/:id', deliveryChallansController.deleteDeliveryChallan);

export default router;
