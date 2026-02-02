import { Router } from 'express';
import { getAllBrands, getBrandsByManufacturer, createBrand, bulkCreateBrands } from '../controllers/brands.controller';

const router = Router();

router.get('/', getAllBrands);
router.get('/by-manufacturer/:manufacturerId', getBrandsByManufacturer);
router.post('/', createBrand);
router.post('/bulk', bulkCreateBrands);

export default router;
