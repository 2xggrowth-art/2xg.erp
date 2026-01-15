import { Router } from 'express';
import { CustomersController } from '../controllers/customers.controller';

const router = Router();
const customersController = new CustomersController();

// CRUD operations
router.post('/', customersController.createCustomer);
router.get('/', customersController.getAllCustomers);
router.get('/:id', customersController.getCustomerById);
router.put('/:id', customersController.updateCustomer);
router.delete('/:id', customersController.deleteCustomer);

export default router;
