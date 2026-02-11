import { Router } from 'express';
import * as stockCountsController from '../controllers/stockCounts.controller';

const router = Router();

router.get('/', stockCountsController.getAll);
router.get('/generate-number', stockCountsController.generateNumber);
router.get('/assigned/:userId', stockCountsController.getAssigned);
router.get('/:id', stockCountsController.getById);
router.post('/bin-scan', stockCountsController.createBinScan);
router.post('/', stockCountsController.create);
router.put('/:id', stockCountsController.update);
router.delete('/:id', stockCountsController.remove);
router.patch('/:id/status', stockCountsController.updateStatus);
router.patch('/:id/items', stockCountsController.updateCountedQuantities);

export default router;
