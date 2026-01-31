import { Router } from 'express';
import { getAllBrands, createBrand, bulkCreateBrands } from '../controllers/brands.controller';

const router = Router();

router.get('/', getAllBrands);
router.post('/', createBrand);
router.post('/bulk', bulkCreateBrands);

export default router;
