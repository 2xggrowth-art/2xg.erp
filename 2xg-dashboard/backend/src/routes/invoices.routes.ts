import { Router } from 'express';
import { InvoicesController } from '../controllers/invoices.controller';

const router = Router();
const invoicesController = new InvoicesController();

// Generate invoice number
router.get('/generate-number', invoicesController.generateInvoiceNumber);

// Bulk import
router.post('/import', invoicesController.importInvoices);

// CRUD operations
router.post('/', invoicesController.createInvoice);
router.get('/', invoicesController.getAllInvoices);
router.get('/summary', invoicesController.getInvoiceSummary);
router.get('/:id', invoicesController.getInvoiceById);
router.put('/:id', invoicesController.updateInvoice);
router.delete('/:id', invoicesController.deleteInvoice);

export default router;
