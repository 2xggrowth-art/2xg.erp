import { Router } from 'express';
import { OrgSettingsController } from '../controllers/org-settings.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();
const controller = new OrgSettingsController();

router.get('/', controller.getOrgSettings);
router.put('/', requireRole('Admin'), controller.updateOrgSettings);
router.get('/company-info', controller.getCompanyInfo);

export default router;
