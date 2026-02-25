import { Router } from 'express';
import { getGstSettings, updateGstSettings } from '../controllers/gstSettings.controller';

const router = Router();

router.get('/', getGstSettings);
router.put('/', updateGstSettings);

export default router;
