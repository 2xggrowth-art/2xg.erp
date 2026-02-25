import { Router } from 'express';
import { getGSTR1, getGSTR3B, getITCReport } from '../controllers/gstReports.controller';

const router = Router();

router.get('/gstr1', getGSTR1);
router.get('/gstr3b', getGSTR3B);
router.get('/itc', getITCReport);

export default router;
