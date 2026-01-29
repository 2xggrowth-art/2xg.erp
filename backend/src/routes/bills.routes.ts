import { Router } from 'express';
import { BillsController } from '../controllers/bills.controller';

const router = Router();
const billsController = new BillsController();

// Generate bill number
router.get('/generate-bill-number', billsController.generateBillNumber);

// Get bills summary
router.get('/summary', billsController.getBillsSummary);

// CRUD operations
router.post('/', billsController.createBill);
router.get('/', billsController.getAllBills);
router.get('/:id', billsController.getBillById);
router.put('/:id', billsController.updateBill);
router.delete('/:id', billsController.deleteBill);

export default router;
