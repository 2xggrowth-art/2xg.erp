import { Router } from 'express';
import * as putawayController from '../controllers/putaway.controller';

const router = Router();

router.get('/pending', putawayController.getPending);
router.get('/in-progress', putawayController.getInProgress);
router.get('/history', putawayController.getHistory);
router.get('/stats', putawayController.getStats);
router.get('/admin-stats', putawayController.getAdminStats);
router.get('/suggest-bin/:itemId', putawayController.suggestBin);
router.get('/:id', putawayController.getById);
router.post('/from-bill', putawayController.createFromBill);
router.patch('/:id/start', putawayController.startTask);
router.post('/:id/place', putawayController.placeItem);

export default router;
