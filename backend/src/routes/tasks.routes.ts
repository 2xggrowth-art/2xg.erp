import { Router } from 'express';
import * as tasksController from '../controllers/tasks.controller';

const router = Router();

router.get('/', tasksController.getAllTasks);
router.get('/summary', tasksController.getTasksSummary);
router.get('/by-status', tasksController.getTasksByStatus);
router.get('/projects', tasksController.getAllProjects);

export default router;
