import { Router } from 'express';
import * as customersController from '../controllers/customers.controller';

const router = Router();

// GET routes
router.get('/', customersController.getAllCustomers);
router.get('/summary', customersController.getCustomersSummary);
router.get('/:id', customersController.getCustomerById);

// POST routes
router.post('/', customersController.createCustomer);

// PUT routes
router.put('/:id', customersController.updateCustomer);

// DELETE routes
router.delete('/:id', customersController.deleteCustomer);

export default router;
