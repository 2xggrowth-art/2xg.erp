import { Router } from 'express';
import { SalesOrdersController } from '../controllers/sales-orders.controller';

const router = Router();
const salesOrdersController = new SalesOrdersController();

/**
 * @route   GET /api/sales-orders/generate-number
 * @desc    Generate a new sales order number
 * @access  Public
 */
router.get('/generate-number', salesOrdersController.generateSalesOrderNumber);

/**
 * @route   POST /api/sales-orders
 * @desc    Create a new sales order
 * @access  Public
 */
router.post('/', salesOrdersController.createSalesOrder);

/**
 * @route   GET /api/sales-orders
 * @desc    Get all sales orders with optional filters
 * @access  Public
 */
router.get('/', salesOrdersController.getAllSalesOrders);

/**
 * @route   GET /api/sales-orders/:id
 * @desc    Get a single sales order by ID
 * @access  Public
 */
router.get('/:id', salesOrdersController.getSalesOrderById);

/**
 * @route   PUT /api/sales-orders/:id
 * @desc    Update a sales order
 * @access  Public
 */
router.put('/:id', salesOrdersController.updateSalesOrder);

/**
 * @route   DELETE /api/sales-orders/:id
 * @desc    Delete a sales order
 * @access  Public
 */
router.delete('/:id', salesOrdersController.deleteSalesOrder);

export default router;
