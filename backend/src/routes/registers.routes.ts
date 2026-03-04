import { Router } from 'express';
import { RegistersController } from '../controllers/registers.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();
const registersController = new RegistersController();

// Get all registers
router.get('/', registersController.getAllRegisters);

// Register a device (assigns unique device_number for POS prefix)
router.post('/register-device', registersController.registerDevice);

// Create register
router.post('/', requireRole('Admin', 'Manager'), registersController.createRegister);

// Update register
router.put('/:id', requireRole('Admin', 'Manager'), registersController.updateRegister);

// Soft delete register
router.delete('/:id', requireRole('Admin', 'Manager'), registersController.deleteRegister);

export default router;
