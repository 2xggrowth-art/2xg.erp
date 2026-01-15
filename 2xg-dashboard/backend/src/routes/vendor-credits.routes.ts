import { Router } from 'express';
import { VendorCreditsController } from '../controllers/vendor-credits.controller';

const router = Router();
const vendorCreditsController = new VendorCreditsController();

// Generate credit number
router.get('/generate-credit-number', vendorCreditsController.generateCreditNumber);

// Get summary
router.get('/summary', vendorCreditsController.getVendorCreditsSummary);

// CRUD operations
router.post('/', vendorCreditsController.createVendorCredit);
router.get('/', vendorCreditsController.getAllVendorCredits);
router.get('/:id', vendorCreditsController.getVendorCreditById);
router.put('/:id', vendorCreditsController.updateVendorCredit);
router.delete('/:id', vendorCreditsController.deleteVendorCredit);

// Apply credit to bill
router.post('/:id/apply-to-bill', vendorCreditsController.applyCreditToBill);

export default router;