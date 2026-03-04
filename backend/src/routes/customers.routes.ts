import { Router } from 'express';
import * as customersController from '../controllers/customers.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

// GET routes
router.get('/', customersController.getAllCustomers);
router.get('/summary', customersController.getCustomersSummary);
router.get('/:id/outstanding', customersController.getCustomerOutstanding);
router.get('/:id', customersController.getCustomerById);

// POST routes
router.post('/', requireRole('Admin', 'Manager', 'Salesperson'), customersController.createCustomer);

// PUT routes
router.put('/:id', requireRole('Admin', 'Manager', 'Salesperson'), customersController.updateCustomer);

// DELETE routes
router.delete('/:id', requireRole('Admin', 'Manager'), customersController.deleteCustomer);

export default router;
