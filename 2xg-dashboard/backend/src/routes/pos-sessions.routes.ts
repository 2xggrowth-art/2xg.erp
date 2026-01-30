import { Router } from 'express';
import { PosSessionsController } from '../controllers/pos-sessions.controller';

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
router.post('/start', posSessionsController.startSession);

// Close a session
router.post('/:id/close', posSessionsController.closeSession);

// Update session sales
router.post('/:id/update-sales', posSessionsController.updateSessionSales);

// Record cash movement
router.post('/:id/cash-movement', posSessionsController.recordCashMovement);

export default router;
