import { Router } from 'express';
import { CareController } from '../controllers/care.controller';

const router = Router();
const careController = new CareController();

// Service ticket routes
router.get('/tickets/total', careController.getTotalTickets);
router.get('/tickets/by-category', careController.getTicketsByCategory);
router.get('/tickets/trends', careController.getTicketTrends);

export default router;
