import { Router } from 'express';
import { ErpController } from '../controllers/erp.controller';

const router = Router();
const erpController = new ErpController();

// Sales routes
router.get('/sales/total', erpController.getTotalSales);
router.get('/sales/by-category', erpController.getSalesByCategory);
router.get('/sales/overdue', erpController.getOverdueAmount);

// Inventory routes
router.get('/inventory/hot-selling', erpController.getHotSellingItems);
router.get('/inventory/low-stock', erpController.getLowStockItems);

export default router;
