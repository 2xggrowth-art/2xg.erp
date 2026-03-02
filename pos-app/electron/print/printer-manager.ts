import { BrowserWindow } from 'electron';

export interface PrinterInfo {
  name: string;
  displayName: string;
  description: string;
  status: number;
  isDefault: boolean;
}

export async function getSystemPrinters(): Promise<PrinterInfo[]> {
  const mainWindow = BrowserWindow.getAllWindows()[0];
  if (!mainWindow) return [];

  const printers = await mainWindow.webContents.getPrintersAsync();
  return printers.map((p) => ({
    name: p.name,
    displayName: p.displayName,
    description: p.description,
    status: p.status,
    isDefault: p.isDefault,
  }));
}

export async function printHtml(
  html: string,
  options: {
    printerName?: string;
    paperSize?: string;
    silent?: boolean;
  } = {}
): Promise<boolean> {
  return new Promise((resolve) => {
    const printWindow = new BrowserWindow({
      show: false,
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    const base64Html = Buffer.from(html).toString('base64');
    printWindow.loadURL(`data:text/html;base64,${base64Html}`);

    printWindow.webContents.on('did-finish-load', () => {
      const printOptions: Electron.WebContentsPrintOptions = {
        silent: options.silent !== false,
        printBackground: true,
        ...(options.printerName ? { deviceName: options.printerName } : {}),
      };

      // Map paper sizes
      if (options.paperSize) {
        switch (options.paperSize) {
          case '58mm':
            printOptions.pageSize = { width: 58000, height: 297000 }; // microns
            printOptions.margins = { marginType: 'none' };
            break;
          case '80mm':
            printOptions.pageSize = { width: 80000, height: 297000 };
            printOptions.margins = { marginType: 'none' };
            break;
          case 'A5':
            printOptions.pageSize = 'A5';
            break;
          case 'A4':
          default:
            printOptions.pageSize = 'A4';
            break;
        }
      }

      printWindow.webContents.print(printOptions, (success, failureReason) => {
        printWindow.close();
        if (!success) {
          console.error('Print failed:', failureReason);
        }
        resolve(success);
      });
    });
  });
}

export function generateTestPageHtml(printerName: string): string {
  return `<!DOCTYPE html>
<html><head><style>
  body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
  h1 { font-size: 24px; margin-bottom: 20px; }
  .info { font-size: 14px; color: #666; margin: 10px 0; }
  .box { border: 2px solid #000; padding: 20px; margin: 20px auto; max-width: 300px; }
  .check { font-size: 48px; color: #16a34a; }
</style></head><body>
  <h1>2XG POS - Test Print</h1>
  <div class="check">&#10004;</div>
  <div class="box">
    <div class="info">Printer: ${printerName}</div>
    <div class="info">Date: ${new Date().toLocaleString('en-IN')}</div>
    <div class="info">Status: Connected</div>
  </div>
  <p style="font-size:12px;color:#999">If you can read this, your printer is working correctly.</p>
</body></html>`;
}
