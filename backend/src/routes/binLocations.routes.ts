import { Router } from 'express';
import * as binLocationsController from '../controllers/binLocations.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', binLocationsController.getAllBinLocations);
router.get('/stock/all', binLocationsController.getBinLocationsWithStock);
router.get('/item/:itemId', binLocationsController.getBinLocationsForItem);
router.get('/:id', binLocationsController.getBinLocationById);
router.post('/', requireRole('Admin', 'Manager'), binLocationsController.createBinLocation);
router.put('/:id', requireRole('Admin', 'Manager'), binLocationsController.updateBinLocation);
router.delete('/:id', requireRole('Admin', 'Manager'), binLocationsController.deleteBinLocation);

export default router;
