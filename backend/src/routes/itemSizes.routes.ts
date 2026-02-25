import { Router } from 'express';
import { getAllItemSizes, createItemSize, deleteItemSize } from '../controllers/itemSizes.controller';

const router = Router();

router.get('/', getAllItemSizes);
router.post('/', createItemSize);
router.delete('/:id', deleteItemSize);

export default router;
