import { IpcMain, BrowserWindow } from 'electron';

export function registerPrinterHandlers(ipcMain: IpcMain): void {
  // ---------------------------------------------------------------------------
  // printer:list — List available system printers
  // ---------------------------------------------------------------------------
  ipcMain.handle('printer:list', async () => {
    try {
      const win = BrowserWindow.getAllWindows()[0];
      if (!win) {
        return { success: false, error: 'No window available to query printers' };
      }

      const printers = await win.webContents.getPrintersAsync();

      return {
        success: true,
        data: printers.map((p) => ({
          name: p.name,
          displayName: p.displayName,
          description: p.description,
          status: p.status,
          isDefault: p.isDefault,
        })),
      };
    } catch (error: any) {
      console.error('[IPC] printer:list error:', error);
      return { success: false, error: error.message };
    }
  });

  // ---------------------------------------------------------------------------
  // printer:printReceipt — Print HTML receipt to a specific printer
  // ---------------------------------------------------------------------------
  ipcMain.handle(
    'printer:printReceipt',
    async (
      _event,
      data: { html: string; printerName?: string; paperSize?: string }
    ) => {
      return new Promise((resolve) => {
        try {
          // Create a hidden window to render the receipt HTML
          const printWindow = new BrowserWindow({
            width: 300,
            height: 600,
            show: false,
            webPreferences: {
              contextIsolation: true,
              nodeIntegration: false,
            },
          });

          // Encode HTML as a data URL so we don't need to write to disk
          const encodedHtml = Buffer.from(data.html, 'utf-8').toString('base64');
          printWindow.loadURL(`data:text/html;base64,${encodedHtml}`);

          printWindow.webContents.on('did-finish-load', () => {
            const printOptions: Electron.WebContentsPrintOptions = {
              silent: true,
              printBackground: true,
            };

            if (data.printerName) {
              printOptions.deviceName = data.printerName;
            }

            // Map common paper sizes
            if (data.paperSize) {
              const sizeMap: Record<string, { width: number; height: number }> = {
                '80mm': { width: 80000, height: 297000 },
                '58mm': { width: 58000, height: 210000 },
                'A4': { width: 210000, height: 297000 },
              };

              const size = sizeMap[data.paperSize];
              if (size) {
                printOptions.pageSize = size;
              }
            }

            printWindow.webContents.print(printOptions, (success, failureReason) => {
              printWindow.close();

              if (success) {
                resolve({ success: true, message: 'Receipt printed successfully' });
              } else {
                resolve({
                  success: false,
                  error: `Print failed: ${failureReason}`,
                });
              }
            });
          });

          // Handle load errors
          printWindow.webContents.on(
            'did-fail-load',
            (_e, errorCode, errorDescription) => {
              printWindow.close();
              resolve({
                success: false,
                error: `Failed to load receipt HTML: ${errorDescription} (code: ${errorCode})`,
              });
            }
          );
        } catch (error: any) {
          console.error('[IPC] printer:printReceipt error:', error);
          resolve({ success: false, error: error.message });
        }
      });
    }
  );

  // ---------------------------------------------------------------------------
  // printer:testPrint — Print a test page to verify printer connectivity
  // ---------------------------------------------------------------------------
  ipcMain.handle('printer:testPrint', async (_event, printerName: string) => {
    return new Promise((resolve) => {
      try {
        const testHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body {
                font-family: 'Courier New', monospace;
                padding: 10px;
                text-align: center;
              }
              h2 { margin-bottom: 5px; }
              .line { border-top: 1px dashed #000; margin: 10px 0; }
              .info { font-size: 12px; color: #555; }
            </style>
          </head>
          <body>
            <h2>2XG POS</h2>
            <p>Printer Test Page</p>
            <div class="line"></div>
            <p>Printer: ${printerName}</p>
            <p class="info">Printed at: ${new Date().toLocaleString()}</p>
            <div class="line"></div>
            <p>If you can read this, the printer is working correctly.</p>
          </body>
          </html>
        `;

        const printWindow = new BrowserWindow({
          width: 300,
          height: 400,
          show: false,
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
          },
        });

        const encodedHtml = Buffer.from(testHtml, 'utf-8').toString('base64');
        printWindow.loadURL(`data:text/html;base64,${encodedHtml}`);

        printWindow.webContents.on('did-finish-load', () => {
          printWindow.webContents.print(
            {
              silent: true,
              printBackground: true,
              deviceName: printerName,
            },
            (success, failureReason) => {
              printWindow.close();

              if (success) {
                resolve({ success: true, message: 'Test page printed successfully' });
              } else {
                resolve({
                  success: false,
                  error: `Test print failed: ${failureReason}`,
                });
              }
            }
          );
        });

        printWindow.webContents.on(
          'did-fail-load',
          (_e, errorCode, errorDescription) => {
            printWindow.close();
            resolve({
              success: false,
              error: `Failed to load test page: ${errorDescription} (code: ${errorCode})`,
            });
          }
        );
      } catch (error: any) {
        console.error('[IPC] printer:testPrint error:', error);
        resolve({ success: false, error: error.message });
      }
    });
  });

  // ---------------------------------------------------------------------------
  // printer:openCashDrawer — Send ESC/POS cash drawer kick command (placeholder)
  // ---------------------------------------------------------------------------
  ipcMain.handle('printer:openCashDrawer', async () => {
    try {
      // ESC/POS cash drawer kick command: ESC p 0 25 250
      // This would need to be sent as raw bytes to the printer.
      // Placeholder until a serial/USB printer library is integrated.

      // TODO: Implement actual ESC/POS command:
      // const kickCommand = Buffer.from([0x1b, 0x70, 0x00, 0x19, 0xfa]);
      // Send to printer via USB/serial

      console.warn(
        '[IPC] printer:openCashDrawer — not yet implemented (requires ESC/POS driver)'
      );

      return {
        success: false,
        error:
          'Cash drawer command not yet implemented. Requires ESC/POS printer driver integration.',
      };
    } catch (error: any) {
      console.error('[IPC] printer:openCashDrawer error:', error);
      return { success: false, error: error.message };
    }
  });
}
