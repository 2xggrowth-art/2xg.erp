import { Router } from 'express';
import placementHistoryController from '../controllers/placementHistory.controller';

const router = Router();

// Get all placement/transfer/damage history
router.get('/', placementHistoryController.getAll);

// Get history for a specific item
router.get('/item/:itemId', placementHistoryController.getByItemId);

export default router;
