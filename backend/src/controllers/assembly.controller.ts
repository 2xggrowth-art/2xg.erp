import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AssemblyService } from '../services/assembly.service';

const assemblyService = new AssemblyService();

export const inwardBike = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { barcode, model_sku } = req.body;
    if (!barcode || !model_sku) {
      return res.status(400).json({ success: false, error: 'barcode and model_sku are required' });
    }
    const data = {
      ...req.body,
      bin_location_id: req.body.bin_location_id?.trim() || null
    };
    const journey = await assemblyService.createJourney(data);
    res.status(201).json({ success: true, message: 'Bike inwarded successfully', data: journey });
  } catch (error: any) {
    console.error('Inward bike error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const bulkInward = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { bikes } = req.body;
    if (!Array.isArray(bikes) || bikes.length === 0) {
      return res.status(400).json({ success: false, error: 'bikes must be a non-empty array' });
    }
    const successful: any[] = [];
    const failed: any[] = [];
    for (const bike of bikes) {
      try {
        const data = { ...bike, bin_location_id: bike.bin_location_id?.trim() || null };
        const journey = await assemblyService.createJourney(data);
        successful.push({ barcode: bike.barcode, journey });
      } catch (err: any) {
        failed.push({ barcode: bike.barcode, error: err.message });
      }
    }
    res.status(201).json({
      success: true,
      message: `Successfully inwarded ${successful.length} bikes. Failed: ${failed.length}`,
      data: { successful, failed, total: bikes.length }
    });
  } catch (error: any) {
    console.error('Bulk inward error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const scanBike = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const journey = await assemblyService.getJourneyByBarcode(req.params.barcode);
    if (!journey) return res.status(404).json({ success: false, error: 'Bike not found' });

    const currentUserId = req.user?.userId;
    const isAssignedToMe = journey.technician_id === currentUserId;
    const assignedTechnicianName = (journey as any).technician?.name || null;

    res.json({
      success: true,
      data: {
        ...journey,
        ownership: {
          is_assigned_to_me: isAssignedToMe,
          assigned_technician_name: assignedTechnicianName,
        }
      }
    });
  } catch (error: any) {
    console.error('Scan bike error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const assignBike = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { barcode, technician_id } = req.body;
    const result = await assemblyService.assignToTechnician(barcode, technician_id, req.user!.userId);
    res.json(result);
  } catch (error: any) {
    console.error('Assign bike error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const bulkAssign = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { barcodes, technician_id } = req.body;
    const results = await assemblyService.bulkAssign(barcodes, technician_id, req.user!.userId);
    res.json({ success: true, data: results });
  } catch (error: any) {
    console.error('Bulk assign error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const startAssembly = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await assemblyService.startAssembly(req.body.barcode, req.user!.userId);
    res.json(result);
  } catch (error: any) {
    console.error('Start assembly error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateChecklist = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { barcode, checklist } = req.body;
    const journey = await assemblyService.updateChecklist(barcode, req.user!.userId, checklist);
    res.json({ success: true, data: journey });
  } catch (error: any) {
    console.error('Update checklist error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const completeAssembly = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { barcode, checklist } = req.body;
    const result = await assemblyService.completeAssembly(barcode, req.user!.userId, checklist);
    res.json(result);
  } catch (error: any) {
    console.error('Complete assembly error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getTechnicianQueue = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const queue = await assemblyService.getTechnicianQueue(req.user!.userId);
    res.json({ success: true, data: queue });
  } catch (error: any) {
    console.error('Get queue error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getKanban = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = {
      status: req.query.status as string | undefined,
      location_id: req.query.location_id as string | undefined,
      technician_id: req.query.technician_id as string | undefined,
      priority: req.query.priority === 'true'
    };
    const board = await assemblyService.getKanbanBoard(filters);
    res.json({ success: true, data: board });
  } catch (error: any) {
    console.error('Get Kanban error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [daily, bottleneck, technicians, qcFailures] = await Promise.all([
      assemblyService.getDailyDashboard(),
      assemblyService.getBottleneckReport(),
      assemblyService.getTechnicianWorkload(),
      assemblyService.getQCFailureAnalysis()
    ]);
    res.json({ success: true, data: { daily, bottleneck, technicians, qc_failures: qcFailures } });
  } catch (error: any) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const canInvoice = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await assemblyService.canInvoice(req.params.barcode);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Can invoice check error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const submitQCResult = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { barcode, result, failure_reason, photos } = req.body;
    const data = await assemblyService.submitQCResult(barcode, req.user!.userId, result, failure_reason, photos);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Submit QC result error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const flagPartsMissing = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { barcode, parts_list, notes } = req.body;
    const journey = await assemblyService.flagPartMissing(barcode, parts_list, notes);
    res.json({ success: true, data: journey });
  } catch (error: any) {
    console.error('Flag parts missing error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const reportDamage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { barcode, damage_notes, photos } = req.body;
    const journey = await assemblyService.reportDamage(barcode, damage_notes, photos);
    res.json({ success: true, data: journey });
  } catch (error: any) {
    console.error('Report damage error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const setPriority = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { barcode, priority } = req.body;
    const journey = await assemblyService.setPriority(barcode, priority);
    res.json({ success: true, data: journey });
  } catch (error: any) {
    console.error('Set priority error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const history = await assemblyService.getAssemblyHistory(req.params.journeyId);
    res.json({ success: true, data: history });
  } catch (error: any) {
    console.error('Get history error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBikeDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const details = await assemblyService.getBikeDetails(req.params.barcode);
    res.json({ success: true, data: details });
  } catch (error: any) {
    console.error('Get bike details error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getLocations = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const locations = await assemblyService.getLocations();
    res.json({ success: true, data: locations });
  } catch (error: any) {
    console.error('Get locations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createLocation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, code, type, address } = req.body;
    if (!name || !code || !type) {
      return res.status(400).json({ success: false, error: 'Name, code, and type are required' });
    }
    const location = await assemblyService.createLocation({ name, code, type, address });
    res.status(201).json({ success: true, data: location });
  } catch (error: any) {
    console.error('Create location error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateLocation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const location = await assemblyService.updateLocation(req.params.id, req.body);
    res.json({ success: true, data: location });
  } catch (error: any) {
    console.error('Update location error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteLocation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await assemblyService.deleteLocation(req.params.id);
    res.json({ success: true, message: 'Location deleted' });
  } catch (error: any) {
    console.error('Delete location error:', error);
    const status = error.message.includes('Cannot delete') ? 400 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
};

export const getBins = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const bins = await assemblyService.getBins();
    res.json({ success: true, data: bins });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBinsByLocation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bins = await assemblyService.getBinsByLocation(req.params.locationId);
    res.json({ success: true, data: bins });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAvailableBins = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const locationId = req.query.location_id as string | undefined;
    if (locationId && locationId.trim() === '') {
      return res.json({ success: true, data: [] });
    }
    const bins = await assemblyService.getAvailableBins(locationId || null);
    res.json({ success: true, data: bins });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBinsByZone = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bins = await assemblyService.getBinsByZone(req.params.locationId, req.params.zone);
    res.json({ success: true, data: bins });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBinZones = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const zones = await assemblyService.getBinZones((req.query.location_id as string) || null);
    res.json({ success: true, data: zones });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBinZoneStatistics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await assemblyService.getBinZoneStatistics((req.query.location_id as string) || null);
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const moveBikeToBin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { barcode, bin_id, reason } = req.body;
    const result = await assemblyService.moveBikeToBin(barcode, bin_id, req.user!.userId, reason);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBinMovementHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const history = await assemblyService.getBinMovementHistory(req.params.journeyId);
    res.json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getTechnicians = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const technicians = await assemblyService.getTechnicians();
    res.json({ success: true, data: technicians });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
