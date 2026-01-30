import { Router } from 'express';
import * as binLocationsController from '../controllers/binLocations.controller';

const router = Router();

router.get('/', binLocationsController.getAllBinLocations);
router.get('/stock/all', binLocationsController.getBinLocationsWithStock);
router.get('/item/:itemId', binLocationsController.getBinLocationsForItem);
router.get('/:id', binLocationsController.getBinLocationById);
router.post('/', binLocationsController.createBinLocation);
router.put('/:id', binLocationsController.updateBinLocation);
router.delete('/:id', binLocationsController.deleteBinLocation);

export default router;
