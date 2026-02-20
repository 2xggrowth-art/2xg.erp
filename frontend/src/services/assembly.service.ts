import apiClient from './api.client';

export const assemblyService = {
  // Inward
  inwardBike: (data: { barcode: string; model_sku: string; location_id: string; grn_reference?: string; frame_number?: string; bin_location_id?: string }) =>
    apiClient.post('/assembly/inward', data),
  bulkInward: (bikes: Array<{ barcode: string; model_sku: string; location_id: string }>) =>
    apiClient.post('/assembly/inward/bulk', { bikes }),

  // Scan
  scanBike: (barcode: string) => apiClient.get(`/assembly/scan/${barcode}`),

  // Assign
  assignBike: (barcode: string, technician_id: string) =>
    apiClient.post('/assembly/assign', { barcode, technician_id }),
  bulkAssign: (barcodes: string[], technician_id: string) =>
    apiClient.post('/assembly/assign-bulk', { barcodes, technician_id }),

  // Technician
  getTechnicianQueue: () => apiClient.get('/assembly/technician/queue'),
  startAssembly: (barcode: string) => apiClient.post('/assembly/start', { barcode }),
  updateChecklist: (barcode: string, checklist: object) =>
    apiClient.put('/assembly/checklist', { barcode, checklist }),
  completeAssembly: (barcode: string, checklist: object) =>
    apiClient.post('/assembly/complete', { barcode, checklist }),

  // Dashboard
  getKanban: (filters?: Record<string, string | boolean>) =>
    apiClient.get('/assembly/kanban', { params: filters }),
  getDashboard: () => apiClient.get('/assembly/dashboard'),
  getHistory: (journeyId: string) => apiClient.get(`/assembly/history/${journeyId}`),
  getBikeDetails: (barcode: string) => apiClient.get(`/assembly/bike/${barcode}`),

  // Actions
  setPriority: (barcode: string, priority: boolean) =>
    apiClient.post('/assembly/set-priority', { barcode, priority }),
  flagPartsMissing: (barcode: string, parts_list: string[], notes?: string) =>
    apiClient.post('/assembly/flag-parts-missing', { barcode, parts_list, notes }),
  reportDamage: (barcode: string, damage_notes: string, photos?: string[]) =>
    apiClient.post('/assembly/report-damage', { barcode, damage_notes, photos }),

  // Sales lock
  canInvoice: (barcode: string) => apiClient.get(`/assembly/can-invoice/${barcode}`),

  // QC
  submitQCResult: (barcode: string, result: string, failure_reason?: string, photos?: string[]) =>
    apiClient.post('/assembly/qc/submit', { barcode, result, failure_reason, photos }),

  // Technicians
  getTechnicians: () => apiClient.get('/assembly/technicians'),

  // Locations
  getLocations: () => apiClient.get('/assembly/locations'),
  createLocation: (data: { name: string; code: string; type: string; address?: string }) =>
    apiClient.post('/assembly/locations', data),
  updateLocation: (id: string, data: object) => apiClient.put(`/assembly/locations/${id}`, data),
  deleteLocation: (id: string) => apiClient.delete(`/assembly/locations/${id}`),

  // Bins
  getBins: () => apiClient.get('/assembly/bins'),
  getBinsByLocation: (locationId: string) => apiClient.get(`/assembly/bins/location/${locationId}`),
  getAvailableBins: (locationId?: string) =>
    apiClient.get('/assembly/bins/available', { params: { location_id: locationId } }),

  // Bin Zones
  getBinsByZone: (locationId: string, zone: string) =>
    apiClient.get(`/assembly/bins/zone/${locationId}/${zone}`),
  getBinZones: (locationId?: string) =>
    apiClient.get('/assembly/bins/zones', { params: { location_id: locationId } }),
  getBinZoneStatistics: (locationId?: string) =>
    apiClient.get('/assembly/bins/zone-statistics', { params: { location_id: locationId } }),

  // Bin Movement
  moveBikeToBin: (barcode: string, bin_id: string, reason?: string) =>
    apiClient.post('/assembly/bins/move', { barcode, bin_id, reason }),
  getBinMovementHistory: (journeyId: string) =>
    apiClient.get(`/assembly/bins/movement-history/${journeyId}`)
};
