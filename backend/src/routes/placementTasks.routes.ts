import { Router } from 'express';
import placementTasksController from '../controllers/placementTasks.controller';

const router = Router();

// Get all placement tasks (filter by ?status=pending)
router.get('/', placementTasksController.getAll);

// Get single placement task
router.get('/:id', placementTasksController.getById);

// Create placement task
router.post('/', placementTasksController.create);

// Create placement tasks from a bill
router.post('/from-bill', placementTasksController.createFromBill);

// Update placement task (mark as placed)
router.patch('/:id', placementTasksController.update);

export default router;
