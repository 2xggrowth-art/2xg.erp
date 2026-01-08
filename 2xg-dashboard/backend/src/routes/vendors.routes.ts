import { Router } from 'express';
import * as vendorsController from '../controllers/vendors.controller';

const router = Router();

// GET routes
router.get('/', vendorsController.getAllVendors);
router.get('/summary', vendorsController.getVendorsSummary);
router.get('/:id', vendorsController.getVendorById);

// POST routes
router.post('/', vendorsController.createVendor);

// PUT routes
router.put('/:id', vendorsController.updateVendor);

// DELETE routes
router.delete('/:id', vendorsController.deleteVendor);

export default router;
