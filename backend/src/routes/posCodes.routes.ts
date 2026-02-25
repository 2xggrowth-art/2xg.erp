import { Router } from 'express';
import { getAllPosCodes, createPosCode, updatePosCode, deletePosCode, verifyPosCode } from '../controllers/posCodes.controller';

const router = Router();

router.get('/', getAllPosCodes);
router.post('/', createPosCode);
router.post('/verify', verifyPosCode);
router.put('/:id', updatePosCode);
router.delete('/:id', deletePosCode);

export default router;
