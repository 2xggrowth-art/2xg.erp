// Type-safe wrapper for window.electronAPI exposed by preload.ts

export interface ElectronAPI {
  // Items
  searchItems: (query: string) => Promise<any>;
  getAllItems: () => Promise<any>;
  getItemById: (id: string) => Promise<any>;

  // Customers
  getAllCustomers: (filters?: { search?: string; isActive?: boolean }) => Promise<any>;
  getCustomerById: (id: string) => Promise<any>;
  createCustomer: (data: any) => Promise<any>;

  // Invoices
  createInvoice: (data: any) => Promise<any>;
  getAllInvoices: (filters?: any) => Promise<any>;
  getInvoiceById: (id: string) => Promise<any>;
  getInvoicesBySession: (sessionId: string) => Promise<any>;

  // POS Sessions
  getActiveSession: () => Promise<any>;
  startSession: (data: any) => Promise<any>;
  closeSession: (id: string, data: any) => Promise<any>;
  getAllSessions: (filters?: any) => Promise<any>;
  getSessionById: (id: string) => Promise<any>;
  updateSessionSales: (sessionId: string, amount: number) => Promise<any>;
  recordCashMovement: (sessionId: string, type: string, amount: number) => Promise<any>;
  generateSessionNumber: () => Promise<any>;

  // Bin Locations
  getBinLocationsForItem: (itemId: string) => Promise<any>;
  getAllBinLocations: () => Promise<any>;

  // Org Settings
  getOrgSettings: () => Promise<any>;

  // Sync
  syncPull: () => Promise<any>;
  syncPush: () => Promise<any>;
  getSyncStatus: () => Promise<any>;
  getSyncQueue: () => Promise<any>;

  // Printer
  listPrinters: () => Promise<any>;
  printReceipt: (data: any) => Promise<any>;
  testPrint: (printerName: string) => Promise<any>;
  openCashDrawer: () => Promise<any>;

  // POS Codes
  getAllPosCodes: () => Promise<any>;
  verifyPosCode: (code: string) => Promise<any>;

  // App Settings
  getAppSetting: (key: string) => Promise<string | null>;
  setAppSetting: (key: string, value: string) => Promise<any>;
  getAllAppSettings: () => Promise<any>;

  // Window controls
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  isMaximized: () => Promise<boolean>;

  // Events
  onSyncStatusChange: (callback: (status: any) => void) => void;
  onUpdateAvailable: (callback: () => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export const ipc = (): ElectronAPI => {
  if (!window.electronAPI) {
    throw new Error('electronAPI not available — are you running inside Electron?');
  }
  return window.electronAPI;
};
