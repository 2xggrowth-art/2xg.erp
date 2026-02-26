import { Router } from 'express';
import * as locationsController from '../controllers/locations.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', locationsController.getAllLocations);
router.get('/:id', locationsController.getLocationById);
router.post('/', requireRole('Admin', 'Manager'), locationsController.createLocation);
router.put('/:id', requireRole('Admin', 'Manager'), locationsController.updateLocation);
router.delete('/:id', requireRole('Admin', 'Manager'), locationsController.deleteLocation);

export default router;
