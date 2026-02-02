// Report Category Types
export type ReportCategory =
  | 'Activity'
  | 'Purchases'
  | 'Payables'
  | 'Payments Received'
  | 'Receivables'
  | 'Location'
  | 'Sales'
  | 'Inventory'
  | 'Advanced Inventory'
  | 'Inventory Valuation';

// System Report Interface
export interface SystemReport {
  id: string;
  name: string;
  category: ReportCategory;
  createdBy: 'System Generated';
}

// All 34 system reports organized by category
export const SYSTEM_REPORTS: SystemReport[] = [
  // Activity (1)
  { id: 'activity-logs-audit-trail', name: 'Activity Logs & Audit Trail', category: 'Activity', createdBy: 'System Generated' },

  // Purchases (2)
  { id: 'purchases-by-category', name: 'Purchases by Category', category: 'Purchases', createdBy: 'System Generated' },
  { id: 'purchases-by-item', name: 'Purchases by Item', category: 'Purchases', createdBy: 'System Generated' },

  // Payables (6)
  { id: 'payable-details', name: 'Payable Details', category: 'Payables', createdBy: 'System Generated' },
  { id: 'payable-summary', name: 'Payable Summary', category: 'Payables', createdBy: 'System Generated' },
  { id: 'payments-made', name: 'Payments Made', category: 'Payables', createdBy: 'System Generated' },
  { id: 'vendor-credit-details', name: 'Vendor Credit Details', category: 'Payables', createdBy: 'System Generated' },
  { id: 'bill-details', name: 'Bill Details', category: 'Payables', createdBy: 'System Generated' },
  { id: 'vendor-balance-summary', name: 'Vendor Balance Summary', category: 'Payables', createdBy: 'System Generated' },

  // Payments Received (2)
  { id: 'refund-history', name: 'Refund History', category: 'Payments Received', createdBy: 'System Generated' },
  { id: 'payments-received', name: 'Payments Received', category: 'Payments Received', createdBy: 'System Generated' },

  // Receivables (4)
  { id: 'receivable-details', name: 'Receivable Details', category: 'Receivables', createdBy: 'System Generated' },
  { id: 'receivable-summary', name: 'Receivable Summary', category: 'Receivables', createdBy: 'System Generated' },
  { id: 'customer-balance-summary', name: 'Customer Balance Summary', category: 'Receivables', createdBy: 'System Generated' },
  { id: 'invoice-details', name: 'Invoice Details', category: 'Receivables', createdBy: 'System Generated' },

  // Location (3)
  { id: 'transfer-order-details', name: 'Transfer Order Details', category: 'Location', createdBy: 'System Generated' },
  { id: 'transfer-order-summary', name: 'Transfer Order Summary', category: 'Location', createdBy: 'System Generated' },
  { id: 'location-details', name: 'Location Details', category: 'Location', createdBy: 'System Generated' },

  // Sales (7)
  { id: 'sales-by-item', name: 'Sales by Item', category: 'Sales', createdBy: 'System Generated' },
  { id: 'sales-by-category', name: 'Sales by Category', category: 'Sales', createdBy: 'System Generated' },
  { id: 'sales-by-salesperson', name: 'Sales by Sales Person', category: 'Sales', createdBy: 'System Generated' },
  { id: 'sales-by-register', name: 'Sales by Register', category: 'Sales', createdBy: 'System Generated' },
  { id: 'sales-by-session', name: 'Sales by Session', category: 'Sales', createdBy: 'System Generated' },
  { id: 'sales-summary', name: 'Sales Summary', category: 'Sales', createdBy: 'System Generated' },
  { id: 'profit-by-item', name: 'Profit By Item', category: 'Sales', createdBy: 'System Generated' },

  // Inventory (5)
  { id: 'inventory-summary', name: 'Inventory Summary', category: 'Inventory', createdBy: 'System Generated' },
  { id: 'committed-stock-details', name: 'Committed Stock Details', category: 'Inventory', createdBy: 'System Generated' },
  { id: 'inventory-aging-summary', name: 'Inventory Aging Summary', category: 'Inventory', createdBy: 'System Generated' },
  { id: 'stock-summary', name: 'Stock Summary', category: 'Inventory', createdBy: 'System Generated' },
  { id: 'inventory-adjustment-summary', name: 'Inventory Adjustment Summary', category: 'Inventory', createdBy: 'System Generated' },

  // Advanced Inventory (2)
  { id: 'batch-details', name: 'Batch Details', category: 'Advanced Inventory', createdBy: 'System Generated' },
  { id: 'serial-number-details', name: 'Serial Number Details', category: 'Advanced Inventory', createdBy: 'System Generated' },

  // Inventory Valuation (1)
  { id: 'inventory-valuation-summary', name: 'Inventory Valuation Summary', category: 'Inventory Valuation', createdBy: 'System Generated' },
];

// localStorage keys
const FAVORITES_KEY = '2xg_report_favorites';
const VISITS_KEY = '2xg_report_visits';

// Service methods
export const reportsService = {
  getAllReports: (): SystemReport[] => SYSTEM_REPORTS,

  getCategories: (): ReportCategory[] => {
    const categories = [...new Set(SYSTEM_REPORTS.map(r => r.category))];
    return categories as ReportCategory[];
  },

  // Favorites management (localStorage)
  getFavorites: (): string[] => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  toggleFavorite: (reportId: string): string[] => {
    const favorites = reportsService.getFavorites();
    const updated = favorites.includes(reportId)
      ? favorites.filter(id => id !== reportId)
      : [...favorites, reportId];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    return updated;
  },

  isFavorite: (reportId: string): boolean => {
    return reportsService.getFavorites().includes(reportId);
  },

  // Last visited tracking (localStorage)
  getLastVisited: (): Record<string, string> => {
    try {
      const stored = localStorage.getItem(VISITS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  },

  recordVisit: (reportId: string): void => {
    const visits = reportsService.getLastVisited();
    visits[reportId] = new Date().toISOString();
    localStorage.setItem(VISITS_KEY, JSON.stringify(visits));
  },

  getLastVisitedTime: (reportId: string): string | undefined => {
    return reportsService.getLastVisited()[reportId];
  },

  // Search and filter
  searchReports: (query: string, category?: ReportCategory): SystemReport[] => {
    return SYSTEM_REPORTS.filter(report => {
      const matchesQuery = !query ||
        report.name.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = !category || report.category === category;
      return matchesQuery && matchesCategory;
    });
  },
};

// Date formatter for "Last Visited" column (format: DD/MM/YYYY HH:MM AM/PM)
export function formatLastVisited(isoString: string | undefined): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).toUpperCase();
  } catch {
    return '-';
  }
}
