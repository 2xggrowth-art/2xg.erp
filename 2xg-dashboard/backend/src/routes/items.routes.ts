import { Router } from 'express';
import * as itemsController from '../controllers/items.controller';

const router = Router();

router.get('/', itemsController.getAllItems);
router.get('/summary', itemsController.getItemsSummary);
router.get('/top-selling', itemsController.getTopSellingItems);

export default router;
