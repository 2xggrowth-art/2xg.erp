import { Router } from 'express';
import { PosSessionsController } from '../controllers/pos-sessions.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();
const posSessionsController = new PosSessionsController();

// Generate session number
router.get('/generate-number', posSessionsController.generateSessionNumber);

// Get active session
router.get('/active', posSessionsController.getActiveSession);

// Get all sessions
router.get('/', posSessionsController.getAllSessions);

// Get session by ID
router.get('/:id', posSessionsController.getSessionById);

// Start a new session
router.post('/start', requireRole('Admin', 'Manager', 'Salesperson'), posSessionsController.startSession);

// Close a session
router.post('/:id/close', requireRole('Admin', 'Manager', 'Salesperson'), posSessionsController.closeSession);

// Update session sales
router.post('/:id/update-sales', requireRole('Admin', 'Manager', 'Salesperson'), posSessionsController.updateSessionSales);

// Record cash movement
router.post('/:id/cash-movement', requireRole('Admin', 'Manager', 'Salesperson'), posSessionsController.recordCashMovement);

export default router;
