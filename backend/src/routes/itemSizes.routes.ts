import { Router } from 'express';
import { getAllItemSizes, createItemSize, deleteItemSize } from '../controllers/itemSizes.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getAllItemSizes);
router.post('/', requireRole('Admin', 'Manager'), createItemSize);
router.delete('/:id', requireRole('Admin', 'Manager'), deleteItemSize);

export default router;
