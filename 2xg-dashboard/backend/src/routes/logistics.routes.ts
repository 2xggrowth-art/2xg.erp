import { Router } from 'express';
import { LogisticsController } from '../controllers/logistics.controller';

const router = Router();
const logisticsController = new LogisticsController();

// Shipment routes
router.get('/shipments/summary', logisticsController.getShipmentSummary);

// Delivery routes
router.get('/deliveries/summary', logisticsController.getDeliverySummary);
router.get('/deliveries/list', logisticsController.getDeliveryList);

export default router;
