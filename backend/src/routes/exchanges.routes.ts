import { Router } from 'express';
import { exchangesController } from '../controllers/exchanges.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/stats', exchangesController.getStats);
router.get('/', exchangesController.getAll);
router.get('/:id', exchangesController.getById);
router.post('/', requireRole('Admin', 'Manager', 'Salesperson'), exchangesController.create);
router.put('/:id/status', requireRole('Admin', 'Manager', 'Salesperson'), exchangesController.updateStatus);
router.delete('/:id', requireRole('Admin', 'Manager'), exchangesController.delete);

export default router;
