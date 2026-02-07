import { Router } from 'express';
import * as locationsController from '../controllers/locations.controller';

const router = Router();

router.get('/', locationsController.getAllLocations);
router.get('/:id', locationsController.getLocationById);
router.post('/', locationsController.createLocation);
router.put('/:id', locationsController.updateLocation);
router.delete('/:id', locationsController.deleteLocation);

export default router;
