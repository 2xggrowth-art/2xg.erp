import { Router } from 'express';
import { CrmController } from '../controllers/crm.controller';

const router = Router();
const crmController = new CrmController();

// Lead routes
router.get('/leads/reporting', crmController.getLeadReporting);
router.get('/leads/by-status', crmController.getLeadsByStatus);

// Customer routes
router.get('/customers/list', crmController.getCustomers);

export default router;
