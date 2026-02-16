import { Router } from 'express';
import transferTasksController from '../controllers/transferTasks.controller';

const router = Router();

// Get all transfer tasks (filter by ?status=in_progress)
router.get('/', transferTasksController.getAll);

// Get single transfer task
router.get('/:id', transferTasksController.getById);

// Create transfer task
router.post('/', transferTasksController.create);

// Create transfer tasks from a transfer order
router.post('/from-order', transferTasksController.createFromTransferOrder);

// Update transfer task (mark step completed)
router.patch('/:id', transferTasksController.update);

export default router;
