import { Router } from 'express';
import { BillsController } from '../controllers/bills.controller';
import { uploadBillFiles } from '../middleware/upload.middleware';

const router = Router();
const billsController = new BillsController();

// Generate bill number
router.get('/generate-bill-number', billsController.generateBillNumber);

// Get bills summary
router.get('/summary', billsController.getBillsSummary);

// Get last serial number for an item
router.get('/last-serial/:itemId', billsController.getLastSerialNumber);

// File upload for bills (up to 5 files)
router.post('/upload', ...uploadBillFiles.array('files', 5), billsController.uploadFiles);

// CRUD operations
router.post('/', billsController.createBill);
router.get('/', billsController.getAllBills);
router.get('/:id', billsController.getBillById);
router.put('/:id', billsController.updateBill);
router.delete('/:id', billsController.deleteBill);

export default router;
