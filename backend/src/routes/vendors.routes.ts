import { Router } from 'express';
import * as vendorsController from '../controllers/vendors.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

// GET routes
router.get('/', vendorsController.getAllVendors);
router.get('/summary', vendorsController.getVendorsSummary);
router.get('/:id', vendorsController.getVendorById);

// POST routes
router.post('/', requireRole('Admin', 'Manager'), vendorsController.createVendor);

// PUT routes
router.put('/:id', requireRole('Admin', 'Manager'), vendorsController.updateVendor);

// DELETE routes
router.delete('/:id', requireRole('Admin', 'Manager'), vendorsController.deleteVendor);

export default router;
