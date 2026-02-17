import { Router } from 'express';
import damageReportsController from '../controllers/damageReports.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get pending count (for dashboard badge)
router.get('/pending-count', damageReportsController.getPendingCount);

// Get all damage reports
router.get('/', damageReportsController.getAll);

// Get a single damage report
router.get('/:id', damageReportsController.getById);

// Create a new damage report
router.post('/', damageReportsController.create);

// Review (approve/reject) a damage report
router.put('/:id/review', damageReportsController.review);

// Clear photo from a damage report (to save storage after review)
router.put('/:id/clear-photo', damageReportsController.clearPhoto);

// Delete a damage report
router.delete('/:id', damageReportsController.delete);

export default router;
