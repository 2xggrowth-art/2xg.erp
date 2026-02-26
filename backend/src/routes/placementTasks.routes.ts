import { Router } from 'express';
import placementTasksController from '../controllers/placementTasks.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

// Get all placement tasks (filter by ?status=pending)
router.get('/', placementTasksController.getAll);

// Get single placement task
router.get('/:id', placementTasksController.getById);

// Create placement task
router.post('/', requireRole('Admin', 'Manager', 'Salesperson'), placementTasksController.create);

// Create placement tasks from a bill
router.post('/from-bill', requireRole('Admin', 'Manager', 'Salesperson'), placementTasksController.createFromBill);

// Update placement task (mark as placed)
router.patch('/:id', requireRole('Admin', 'Manager', 'Salesperson'), placementTasksController.update);

export default router;
