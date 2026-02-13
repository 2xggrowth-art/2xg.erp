import { Router } from 'express';
import { StockCountsController } from '../controllers/stockCounts.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const controller = new StockCountsController();

// All routes require authentication
router.use(authMiddleware);

// List and detail routes
router.get('/', controller.getStockCounts.bind(controller));
router.get('/stats', controller.getStats.bind(controller));
router.get('/counter/:mobileUserId/stats', controller.getCounterStats.bind(controller));
router.get('/assigned/:userId', controller.getAssignedStockCounts.bind(controller));
router.get('/:id', controller.getStockCount.bind(controller));

// Create route (admin)
router.post('/', controller.createStockCount.bind(controller));

// Counter actions
router.post('/:id/start', controller.startCount.bind(controller));
router.put('/:id/items/:itemId', controller.updateItemCount.bind(controller));
router.patch('/:id/items', controller.bulkUpdateItems.bind(controller));
router.patch('/:id/status', controller.updateStatus.bind(controller));
router.post('/:id/submit', controller.submitCount.bind(controller));

// Admin review actions
router.post('/:id/approve', controller.approveCount.bind(controller));
router.post('/:id/reject', controller.rejectCount.bind(controller));
router.post('/:id/recount', controller.requestRecount.bind(controller));

export default router;
