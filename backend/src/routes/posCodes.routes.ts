import { Router } from 'express';
import { getAllPosCodes, createPosCode, updatePosCode, deletePosCode, verifyPosCode } from '../controllers/posCodes.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getAllPosCodes);
router.post('/', requireRole('Admin'), createPosCode);
router.post('/verify', verifyPosCode);
router.put('/:id', requireRole('Admin'), updatePosCode);
router.delete('/:id', requireRole('Admin'), deletePosCode);

export default router;
