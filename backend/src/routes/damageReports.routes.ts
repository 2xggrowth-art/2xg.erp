import { Router } from 'express';
import * as damageReportsController from '../controllers/damageReports.controller';

const router = Router();

router.get('/', damageReportsController.getAll);
router.get('/:id', damageReportsController.getById);
router.post('/', damageReportsController.create);
router.patch('/:id/status', damageReportsController.updateStatus);

export default router;
