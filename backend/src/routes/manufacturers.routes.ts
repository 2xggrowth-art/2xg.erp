import { Router } from 'express';
import { getAllManufacturers, createManufacturer, bulkCreateManufacturers } from '../controllers/manufacturers.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getAllManufacturers);
router.post('/', requireRole('Admin', 'Manager'), createManufacturer);
router.post('/bulk', requireRole('Admin', 'Manager'), bulkCreateManufacturers);

export default router;
