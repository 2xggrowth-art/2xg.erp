import { contextBridge, ipcRenderer } from 'electron';

// ---------------------------------------------------------------------------
// Expose a type-safe API to the renderer process via contextBridge.
// The renderer accesses these methods through `window.electronAPI`.
// ---------------------------------------------------------------------------

const electronAPI = {
  // -----------------------------------------------------------------------
  // Items
  // -----------------------------------------------------------------------
  searchItems: (query: string) =>
    ipcRenderer.invoke('items:search', query),

  getAllItems: () =>
    ipcRenderer.invoke('items:getAll'),

  getItemById: (id: string) =>
    ipcRenderer.invoke('items:getById', id),

  // -----------------------------------------------------------------------
  // Customers
  // -----------------------------------------------------------------------
  getAllCustomers: (filters?: Record<string, unknown>) =>
    ipcRenderer.invoke('customers:getAll', filters),

  getCustomerById: (id: string) =>
    ipcRenderer.invoke('customers:getById', id),

  createCustomer: (data: Record<string, unknown>) =>
    ipcRenderer.invoke('customers:create', data),

  // -----------------------------------------------------------------------
  // Invoices
  // -----------------------------------------------------------------------
  createInvoice: (data: Record<string, unknown>) =>
    ipcRenderer.invoke('invoices:create', data),

  getAllInvoices: (filters?: Record<string, unknown>) =>
    ipcRenderer.invoke('invoices:getAll', filters),

  getInvoiceById: (id: string) =>
    ipcRenderer.invoke('invoices:getById', id),

  getInvoicesBySession: (sessionId: string) =>
    ipcRenderer.invoke('invoices:getBySession', sessionId),

  // -----------------------------------------------------------------------
  // POS Sessions
  // -----------------------------------------------------------------------
  getActiveSession: () =>
    ipcRenderer.invoke('sessions:getActive'),

  startSession: (data: Record<string, unknown>) =>
    ipcRenderer.invoke('sessions:start', data),

  closeSession: (id: string, data: Record<string, unknown>) =>
    ipcRenderer.invoke('sessions:close', id, data),

  getAllSessions: (filters?: Record<string, unknown>) =>
    ipcRenderer.invoke('sessions:getAll', filters),

  getSessionById: (id: string) =>
    ipcRenderer.invoke('sessions:getById', id),

  updateSessionSales: (sessionId: string, amount: number) =>
    ipcRenderer.invoke('sessions:updateSales', sessionId, amount),

  recordCashMovement: (sessionId: string, type: string, amount: number) =>
    ipcRenderer.invoke('sessions:cashMovement', sessionId, type, amount),

  generateSessionNumber: () =>
    ipcRenderer.invoke('sessions:generateNumber'),

  // -----------------------------------------------------------------------
  // Bin Locations
  // -----------------------------------------------------------------------
  getBinLocationsForItem: (itemId: string) =>
    ipcRenderer.invoke('bins:getForItem', itemId),

  getAllBinLocations: () =>
    ipcRenderer.invoke('bins:getAll'),

  // -----------------------------------------------------------------------
  // Org Settings
  // -----------------------------------------------------------------------
  getOrgSettings: () =>
    ipcRenderer.invoke('org-settings:get'),

  // -----------------------------------------------------------------------
  // Sync
  // -----------------------------------------------------------------------
  syncPull: () =>
    ipcRenderer.invoke('sync:pull'),

  syncPush: () =>
    ipcRenderer.invoke('sync:push'),

  getSyncStatus: () =>
    ipcRenderer.invoke('sync:getStatus'),

  getSyncQueue: () =>
    ipcRenderer.invoke('sync:getQueue'),

  // -----------------------------------------------------------------------
  // Printer
  // -----------------------------------------------------------------------
  listPrinters: () =>
    ipcRenderer.invoke('printer:list'),

  printReceipt: (data: Record<string, unknown>) =>
    ipcRenderer.invoke('printer:printReceipt', data),

  testPrint: (printerName: string) =>
    ipcRenderer.invoke('printer:testPrint', printerName),

  openCashDrawer: () =>
    ipcRenderer.invoke('printer:openCashDrawer'),

  // -----------------------------------------------------------------------
  // POS Codes
  // -----------------------------------------------------------------------
  getAllPosCodes: () =>
    ipcRenderer.invoke('pos-codes:getAll'),

  verifyPosCode: (code: string) =>
    ipcRenderer.invoke('pos-codes:verify', code),

  // -----------------------------------------------------------------------
  // App Settings
  // -----------------------------------------------------------------------
  getAppSetting: (key: string) =>
    ipcRenderer.invoke('app-settings:get', key),

  setAppSetting: (key: string, value: string) =>
    ipcRenderer.invoke('app-settings:set', key, value),

  getAllAppSettings: () =>
    ipcRenderer.invoke('app-settings:getAll'),

  // -----------------------------------------------------------------------
  // Window Controls (frameless window)
  // -----------------------------------------------------------------------
  minimizeWindow: () =>
    ipcRenderer.invoke('window:minimize'),

  maximizeWindow: () =>
    ipcRenderer.invoke('window:maximize'),

  closeWindow: () =>
    ipcRenderer.invoke('window:close'),

  isMaximized: () =>
    ipcRenderer.invoke('window:isMaximized'),

  // -----------------------------------------------------------------------
  // Events (main -> renderer)
  // -----------------------------------------------------------------------
  onSyncStatusChange: (callback: (status: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, status: unknown) => callback(status);
    ipcRenderer.on('sync:statusChanged', handler);
    // Return a cleanup function so the renderer can unsubscribe
    return () => {
      ipcRenderer.removeListener('sync:statusChanged', handler);
    };
  },

  onUpdateAvailable: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('update:available', handler);
    return () => {
      ipcRenderer.removeListener('update:available', handler);
    };
  },
} as const;

// ---------------------------------------------------------------------------
// Expose to renderer
// ---------------------------------------------------------------------------
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// ---------------------------------------------------------------------------
// Type export for use in the renderer (import type only)
// ---------------------------------------------------------------------------
export type ElectronAPI = typeof electronAPI;
