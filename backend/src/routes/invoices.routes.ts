import { Router } from 'express';
import { InvoicesController } from '../controllers/invoices.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();
const invoicesController = new InvoicesController();

// Generate invoice number
router.get('/generate-number', invoicesController.generateInvoiceNumber);

// Bulk import
router.post('/import', requireRole('Admin', 'Manager'), invoicesController.importInvoices);

// CRUD operations
router.post('/', requireRole('Admin', 'Manager', 'Salesperson'), invoicesController.createInvoice);
router.get('/', invoicesController.getAllInvoices);
router.get('/summary', invoicesController.getInvoiceSummary);
router.get('/:id', invoicesController.getInvoiceById);
router.put('/:id', requireRole('Admin', 'Manager', 'Salesperson'), invoicesController.updateInvoice);
router.delete('/:id', requireRole('Admin', 'Manager'), invoicesController.deleteInvoice);

export default router;
