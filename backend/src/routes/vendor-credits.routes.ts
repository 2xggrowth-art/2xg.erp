import { Router } from 'express';
import { VendorCreditsController } from '../controllers/vendor-credits.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();
const vendorCreditsController = new VendorCreditsController();

// Generate credit number
router.get('/generate-credit-number', vendorCreditsController.generateCreditNumber);

// Get summary
router.get('/summary', vendorCreditsController.getVendorCreditsSummary);

// CRUD operations
router.post('/', requireRole('Admin', 'Manager'), vendorCreditsController.createVendorCredit);
router.get('/', vendorCreditsController.getAllVendorCredits);
router.get('/:id', vendorCreditsController.getVendorCreditById);
router.put('/:id', requireRole('Admin', 'Manager'), vendorCreditsController.updateVendorCredit);
router.delete('/:id', requireRole('Admin', 'Manager'), vendorCreditsController.deleteVendorCredit);

// Apply credit to bill
router.post('/:id/apply-to-bill', requireRole('Admin', 'Manager'), vendorCreditsController.applyCreditToBill);

export default router;