import { Router } from 'express';
import { requireBuildlineRole } from '../middleware/auth.middleware';
import * as assemblyController from '../controllers/assembly.controller';

const router = Router();

// Warehouse / Admin routes
router.post('/inward', requireBuildlineRole('warehouse_staff', 'supervisor'), assemblyController.inwardBike);
router.post('/inward/bulk', requireBuildlineRole('warehouse_staff', 'supervisor'), assemblyController.bulkInward);

// Supervisor routes
router.post('/assign', requireBuildlineRole('supervisor'), assemblyController.assignBike);
router.post('/assign-bulk', requireBuildlineRole('supervisor'), assemblyController.bulkAssign);
router.post('/set-priority', requireBuildlineRole('supervisor'), assemblyController.setPriority);

// Technician routes
router.get('/technician/queue', requireBuildlineRole('technician'), assemblyController.getTechnicianQueue);
router.post('/start', requireBuildlineRole('technician'), assemblyController.startAssembly);
router.put('/checklist', requireBuildlineRole('technician'), assemblyController.updateChecklist);
router.post('/complete', requireBuildlineRole('technician'), assemblyController.completeAssembly);
router.post('/flag-parts-missing', requireBuildlineRole('technician', 'supervisor'), assemblyController.flagPartsMissing);
router.post('/report-damage', requireBuildlineRole('technician', 'supervisor'), assemblyController.reportDamage);

// Scan (all authenticated)
router.get('/scan/:barcode', assemblyController.scanBike);

// Dashboard & Reports (Supervisor/Admin)
router.get('/kanban', requireBuildlineRole('supervisor'), assemblyController.getKanban);
router.get('/dashboard', requireBuildlineRole('supervisor'), assemblyController.getDashboard);
router.get('/history/:journeyId', requireBuildlineRole('supervisor'), assemblyController.getHistory);
router.get('/bike/:barcode', requireBuildlineRole('supervisor'), assemblyController.getBikeDetails);

// Sales Lock (all authenticated)
router.get('/can-invoice/:barcode', assemblyController.canInvoice);

// QC
router.post('/qc/submit', requireBuildlineRole('qc_person'), assemblyController.submitQCResult);

// Technicians list
router.get('/technicians', requireBuildlineRole('supervisor'), assemblyController.getTechnicians);

// Locations
router.get('/locations', requireBuildlineRole('warehouse_staff', 'supervisor'), assemblyController.getLocations);
router.post('/locations', requireBuildlineRole('supervisor'), assemblyController.createLocation);
router.put('/locations/:id', requireBuildlineRole('supervisor'), assemblyController.updateLocation);
router.delete('/locations/:id', requireBuildlineRole('supervisor'), assemblyController.deleteLocation);

// Bins
router.get('/bins', requireBuildlineRole('warehouse_staff', 'supervisor'), assemblyController.getBins);
router.get('/bins/available', requireBuildlineRole('warehouse_staff', 'supervisor'), assemblyController.getAvailableBins);
router.get('/bins/location/:locationId', requireBuildlineRole('warehouse_staff', 'supervisor'), assemblyController.getBinsByLocation);
router.get('/bins/zone/:locationId/:zone', requireBuildlineRole('warehouse_staff', 'supervisor'), assemblyController.getBinsByZone);
router.get('/bins/zones', requireBuildlineRole('warehouse_staff', 'supervisor'), assemblyController.getBinZones);
router.get('/bins/zone-statistics', requireBuildlineRole('warehouse_staff', 'supervisor'), assemblyController.getBinZoneStatistics);
router.post('/bins/move', requireBuildlineRole('warehouse_staff', 'supervisor'), assemblyController.moveBikeToBin);
router.get('/bins/movement-history/:journeyId', requireBuildlineRole('warehouse_staff', 'supervisor'), assemblyController.getBinMovementHistory);

export default router;
