import { Router } from 'express';
import { getAllItemColors, createItemColor, deleteItemColor } from '../controllers/itemColors.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getAllItemColors);
router.post('/', requireRole('Admin', 'Manager'), createItemColor);
router.delete('/:id', requireRole('Admin', 'Manager'), deleteItemColor);

export default router;
