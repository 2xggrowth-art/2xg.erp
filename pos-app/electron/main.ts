import { app, BrowserWindow, ipcMain, Menu, shell, MenuItemConstructorOptions } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';

// ---------------------------------------------------------------------------
// Single instance lock
// ---------------------------------------------------------------------------
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
}

// ---------------------------------------------------------------------------
// Globals
// ---------------------------------------------------------------------------
let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;
const VITE_DEV_SERVER_URL = 'http://localhost:5173';

// ---------------------------------------------------------------------------
// Window creation
// ---------------------------------------------------------------------------
function createWindow(): void {
  const isMac = process.platform === 'darwin';

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    titleBarStyle: isMac ? 'hidden' : undefined,
    frame: isMac ? undefined : false,
    show: false,
    backgroundColor: '#0f172a',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      spellcheck: false,
    },
  });

  // Graceful show once the renderer is ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Load content — try dev server first, fall back to production build
  if (isDev && VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL).catch(() => {
      console.log('[Main] Dev server unavailable, loading from dist/');
      mainWindow?.loadFile(path.join(__dirname, '../dist/index.html'));
    });
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ---------------------------------------------------------------------------
// Native menu
// ---------------------------------------------------------------------------
function buildMenu(): void {
  const isMac = process.platform === 'darwin';

  const template: MenuItemConstructorOptions[] = [
    // App menu (macOS only)
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const },
            ],
          } as MenuItemConstructorOptions,
        ]
      : []),
    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [
              { type: 'separator' as const },
              { role: 'front' as const },
            ]
          : [{ role: 'close' as const }]),
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ---------------------------------------------------------------------------
// Window control IPC handlers
// ---------------------------------------------------------------------------
function registerWindowControls(): void {
  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.handle('window:close', () => {
    mainWindow?.close();
  });

  ipcMain.handle('window:isMaximized', () => {
    return mainWindow?.isMaximized() ?? false;
  });
}

// ---------------------------------------------------------------------------
// IPC handler registration (from ipc/ directory)
// ---------------------------------------------------------------------------
async function registerIpcHandlers(): Promise<void> {
  // These imports will resolve once the IPC handler files are created in electron/ipc/
  // Each module is expected to export a default function: (ipcMain: IpcMain) => void

  try {
    const { registerItemHandlers } = await import('./ipc/items');
    registerItemHandlers(ipcMain);
  } catch {
    console.warn('[IPC] items handlers not found — skipping');
  }

  try {
    const { registerCustomerHandlers } = await import('./ipc/customers');
    registerCustomerHandlers(ipcMain);
  } catch {
    console.warn('[IPC] customers handlers not found — skipping');
  }

  try {
    const { registerInvoiceHandlers } = await import('./ipc/invoices');
    registerInvoiceHandlers(ipcMain);
  } catch {
    console.warn('[IPC] invoices handlers not found — skipping');
  }

  try {
    const { registerSessionHandlers } = await import('./ipc/sessions');
    registerSessionHandlers(ipcMain);
  } catch {
    console.warn('[IPC] sessions handlers not found — skipping');
  }

  try {
    const { registerBinHandlers } = await import('./ipc/bins');
    registerBinHandlers(ipcMain);
  } catch {
    console.warn('[IPC] bins handlers not found — skipping');
  }

  try {
    const { registerOrgSettingsHandlers } = await import('./ipc/org-settings');
    registerOrgSettingsHandlers(ipcMain);
  } catch {
    console.warn('[IPC] org-settings handlers not found — skipping');
  }

  try {
    const { registerSyncHandlers } = await import('./ipc/sync');
    registerSyncHandlers(ipcMain);
  } catch {
    console.warn('[IPC] sync handlers not found — skipping');
  }

  try {
    const { registerPrinterHandlers } = await import('./ipc/printer');
    registerPrinterHandlers(ipcMain);
  } catch {
    console.warn('[IPC] printer handlers not found — skipping');
  }

  try {
    const { registerPosCodeHandlers } = await import('./ipc/pos-codes');
    registerPosCodeHandlers(ipcMain);
  } catch {
    console.warn('[IPC] pos-codes handlers not found — skipping');
  }

  try {
    const { registerAppSettingsHandlers } = await import('./ipc/app-settings');
    registerAppSettingsHandlers(ipcMain);
  } catch {
    console.warn('[IPC] app-settings handlers not found — skipping');
  }
}

// ---------------------------------------------------------------------------
// Database initialization
// ---------------------------------------------------------------------------
async function initDatabase(): Promise<void> {
  try {
    const { initDatabase: initializeDatabase } = await import('./db/database');
    initializeDatabase();
    console.log('[DB] Database initialized successfully');
  } catch (error) {
    console.error('[DB] Failed to initialize database:', error);
    // The app can still start — the renderer should handle a missing DB gracefully
  }
}

// ---------------------------------------------------------------------------
// Auto-updater (production only)
// ---------------------------------------------------------------------------
function initAutoUpdater(): void {
  if (isDev) return;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', () => {
    console.log('[Updater] Update available');
    mainWindow?.webContents.send('update:available');
    autoUpdater.downloadUpdate();
  });

  autoUpdater.on('update-downloaded', () => {
    console.log('[Updater] Update downloaded — will install on quit');
  });

  autoUpdater.on('error', (error) => {
    console.error('[Updater] Error:', error);
  });

  autoUpdater.checkForUpdates().catch((err) => {
    console.warn('[Updater] Failed to check for updates:', err);
  });
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------
app.on('second-instance', () => {
  // If a second instance is launched, focus the existing window
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(async () => {
  // Initialize database first
  await initDatabase();

  // Register IPC handlers before creating the window
  registerWindowControls();
  await registerIpcHandlers();

  // Build native menu
  buildMenu();

  // Create the main window
  createWindow();

  // Check for updates in production
  initAutoUpdater();

  // macOS: re-create window when clicking dock icon
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
