const STORAGE_KEY = 'pos_offline_invoices';

interface OfflineInvoice {
  id: string;
  data: any;
  createdAt: number;
  synced: boolean;
}

class OfflineService {
  /**
   * Save an invoice payload to localStorage when the API is unreachable.
   * Returns a unique offline ID for tracking.
   */
  saveOfflineInvoice(invoiceData: any): string {
    const id = `offline-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const pending = this.getPendingInvoices();
    pending.push({ id, data: invoiceData, createdAt: Date.now(), synced: false });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
    return id;
  }

  /**
   * Get count of invoices that have not yet been synced to the server.
   */
  getPendingCount(): number {
    return this.getPendingInvoices().filter((inv) => !inv.synced).length;
  }

  /**
   * Retrieve all offline invoices from localStorage.
   */
  getPendingInvoices(): OfflineInvoice[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Attempt to sync all unsynced offline invoices using the provided
   * createInvoiceFn (typically the invoices service create call).
   * Returns counts of successfully synced and failed invoices.
   */
  async syncPendingInvoices(
    createInvoiceFn: (data: any) => Promise<any>
  ): Promise<{ synced: number; failed: number }> {
    const pending = this.getPendingInvoices().filter((inv) => !inv.synced);
    let synced = 0;
    let failed = 0;

    for (const invoice of pending) {
      try {
        await createInvoiceFn(invoice.data);
        invoice.synced = true;
        synced++;
      } catch {
        failed++;
      }
    }

    // Update storage with synced flags
    const all = this.getPendingInvoices();
    const updated = all.map((inv) => {
      const match = pending.find((p) => p.id === inv.id);
      return match || inv;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Remove synced items from storage
    this.clearSynced();

    return { synced, failed };
  }

  /**
   * Remove all synced invoices from localStorage, keeping only unsynced ones.
   */
  clearSynced(): void {
    const pending = this.getPendingInvoices().filter((inv) => !inv.synced);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
  }

  /**
   * Check browser online status via navigator.onLine.
   */
  isOnline(): boolean {
    return navigator.onLine;
  }
}

export const offlineService = new OfflineService();
