import { Router } from 'express';
import * as itemsController from '../controllers/items.controller';

const router = Router();

router.get('/', itemsController.getAllItems);
router.get('/summary', itemsController.getItemsSummary);
router.get('/top-selling', itemsController.getTopSellingItems);
router.get('/:id', itemsController.getItemById);
router.post('/', itemsController.createItem);
router.put('/:id', itemsController.updateItem);
router.delete('/:id', itemsController.deleteItem);

export default router;
