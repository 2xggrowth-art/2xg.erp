import { Router } from 'express';
import { CreditNotesController } from '../controllers/credit-notes.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();
const creditNotesController = new CreditNotesController();

// Generate credit note number
router.get('/generate-number', creditNotesController.generateCreditNoteNumber);

// Get all credit notes
router.get('/', creditNotesController.getAllCreditNotes);

// Get credit note by ID
router.get('/:id', creditNotesController.getCreditNoteById);

// Create credit note
router.post('/', requireRole('Admin', 'Manager', 'Salesperson'), creditNotesController.createCreditNote);

// Update credit note status
router.put('/:id/status', requireRole('Admin', 'Manager'), creditNotesController.updateCreditNoteStatus);

export default router;
