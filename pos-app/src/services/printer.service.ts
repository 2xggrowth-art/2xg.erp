import { ipc } from './ipc-client';

export interface PrinterInfo {
  name: string;
  displayName: string;
  description: string;
  status: number;
  isDefault: boolean;
}

export const printerService = {
  async listPrinters(): Promise<PrinterInfo[]> {
    const result = await ipc().listPrinters();
    return result.success ? result.data : [];
  },

  async printReceipt(data: {
    html: string;
    printerName?: string;
    paperSize?: string;
    silent?: boolean;
  }): Promise<{ success: boolean }> {
    return await ipc().printReceipt(data);
  },

  async testPrint(printerName: string): Promise<{ success: boolean }> {
    return await ipc().testPrint(printerName);
  },

  async openCashDrawer(): Promise<{ success: boolean }> {
    return await ipc().openCashDrawer();
  },
};
