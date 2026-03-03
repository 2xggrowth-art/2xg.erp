import { Router } from 'express';
import { PricelistsController } from '../controllers/pricelists.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();
const pricelistsController = new PricelistsController();

// Get all pricelists
router.get('/', pricelistsController.getAllPricelists);

// Get pricelist by ID with items
router.get('/:id', pricelistsController.getPricelistById);

// Create pricelist
router.post('/', requireRole('Admin', 'Manager'), pricelistsController.createPricelist);

// Update pricelist
router.put('/:id', requireRole('Admin', 'Manager'), pricelistsController.updatePricelist);

// Soft delete pricelist
router.delete('/:id', requireRole('Admin', 'Manager'), pricelistsController.deletePricelist);

// Bulk update pricelist items
router.put('/:id/items', requireRole('Admin', 'Manager'), pricelistsController.setPricelistItems);

// Get pricelist item prices
router.get('/:id/items', pricelistsController.getItemPrices);

export default router;
