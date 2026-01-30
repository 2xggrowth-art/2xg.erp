import { Router } from 'express';
import { getAllManufacturers, createManufacturer, bulkCreateManufacturers } from '../controllers/manufacturers.controller';

const router = Router();

router.get('/', getAllManufacturers);
router.post('/', createManufacturer);
router.post('/bulk', bulkCreateManufacturers);

export default router;
