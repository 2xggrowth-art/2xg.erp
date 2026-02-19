import { Router } from 'express';
import { exchangesController } from '../controllers/exchanges.controller';

const router = Router();

router.get('/stats', exchangesController.getStats);
router.get('/', exchangesController.getAll);
router.get('/:id', exchangesController.getById);
router.post('/', exchangesController.create);
router.put('/:id/status', exchangesController.updateStatus);
router.delete('/:id', exchangesController.delete);

export default router;
