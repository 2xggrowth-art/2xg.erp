import { Router } from 'express';
import { getAllItemColors, createItemColor, deleteItemColor } from '../controllers/itemColors.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getAllItemColors);
router.post('/', createItemColor);
router.delete('/:id', deleteItemColor);

export default router;
