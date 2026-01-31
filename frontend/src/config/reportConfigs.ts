import { ReportConfig, ReportFilters } from '../types/reports';
import { invoicesService } from '../services/invoices.service';
import { billsService } from '../services/bills.service';
import { itemsService } from '../services/items.service';
import { customersService } from '../services/customers.service';
import { vendorsService } from '../services/vendors.service';

// Helper function to format currency
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(value || 0);
};

// Helper function to format date
export const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Helper to aggregate invoices by customer
const aggregateByCustomer = (invoices: any[]): any[] => {
  const customerMap = new Map<string, any>();

  invoices.forEach((invoice) => {
    const key = invoice.customer_name || 'Unknown';
    const existing = customerMap.get(key) || {
      customer_name: key,
      customer_id: invoice.customer_id,
      invoice_count: 0,
      sales: 0,
      sales_with_tax: 0,
    };
    existing.invoice_count += 1;
    existing.sales += invoice.sub_total || 0;
    existing.sales_with_tax += invoice.total_amount || 0;
    customerMap.set(key, existing);
  });

  return Array.from(customerMap.values()).sort((a, b) => b.sales_with_tax - a.sales_with_tax);
};

// Helper to aggregate invoices by item
const aggregateByItem = (invoices: any[]): any[] => {
  const itemMap = new Map<string, any>();

  invoices.forEach((invoice) => {
    (invoice.items || []).forEach((item: any) => {
      const key = item.item_name || 'Unknown';
      const existing = itemMap.get(key) || {
        item_name: key,
        item_id: item.item_id,
        quantity_sold: 0,
        sales: 0,
      };
      existing.quantity_sold += item.quantity || 0;
      existing.sales += item.amount || 0;
      itemMap.set(key, existing);
    });
  });

  return Array.from(itemMap.values()).sort((a, b) => b.sales - a.sales);
};

// =====================
// SALES REPORTS
// =====================

const salesByCustomerConfig: ReportConfig = {
  id: 'sales-by-customer',
  name: 'Sales by Customer',
  category: 'Sales',
  description: 'View sales breakdown by customer',
  showTotals: true,

  columns: [
    { key: 'customer_name', header: 'NAME', type: 'link', sortable: true },
    { key: 'invoice_count', header: 'INVOICE COUNT', type: 'number', align: 'center', sortable: true, aggregation: 'sum' },
    { key: 'sales', header: 'SALES', type: 'currency', align: 'right', sortable: true, aggregation: 'sum' },
    { key: 'sales_with_tax', header: 'SALES WITH TAX', type: 'currency', align: 'right', sortable: true, aggregation: 'sum' },
  ],

  filters: [
    {
      key: 'customer_id',
      label: 'Customer',
      type: 'select',
      optionsLoader: async () => {
        const response = await customersService.getAllCustomers();
        if (response.data?.data) {
          return response.data.data.map((c: any) => ({ value: c.id, label: c.customer_name }));
        }
        return [];
      },
    },
  ],

  dataFetcher: async (filters: ReportFilters) => {
    const response = await invoicesService.getAllInvoices({
      from_date: filters.startDate,
      to_date: filters.endDate,
      customer_id: filters.customer_id,
    });
    if (response.success && response.data?.invoices) {
      return aggregateByCustomer(response.data.invoices);
    }
    return [];
  },

  exportFilename: 'sales-by-customer',
};

const salesByItemConfig: ReportConfig = {
  id: 'sales-by-item',
  name: 'Sales by Item',
  category: 'Sales',
  description: 'View sales breakdown by item',
  showTotals: true,

  columns: [
    { key: 'item_name', header: 'ITEM NAME', type: 'text', sortable: true },
    { key: 'quantity_sold', header: 'QUANTITY SOLD', type: 'number', align: 'center', sortable: true, aggregation: 'sum' },
    { key: 'sales', header: 'SALES AMOUNT', type: 'currency', align: 'right', sortable: true, aggregation: 'sum' },
  ],

  filters: [],

  dataFetcher: async (filters: ReportFilters) => {
    const response = await invoicesService.getAllInvoices({
      from_date: filters.startDate,
      to_date: filters.endDate,
    });
    if (response.success && response.data?.invoices) {
      return aggregateByItem(response.data.invoices);
    }
    return [];
  },

  exportFilename: 'sales-by-item',
};

// =====================
// RECEIVABLES REPORTS
// =====================

const invoiceDetailsConfig: ReportConfig = {
  id: 'invoice-details',
  name: 'Invoice Details',
  category: 'Receivables',
  description: 'Detailed list of all invoices',
  showTotals: true,

  columns: [
    { key: 'invoice_date', header: 'DATE', type: 'date', sortable: true },
    { key: 'invoice_number', header: 'INVOICE #', type: 'text', sortable: true },
    { key: 'customer_name', header: 'CUSTOMER', type: 'text', sortable: true },
    { key: 'status', header: 'STATUS', type: 'status', sortable: true },
    { key: 'total_amount', header: 'AMOUNT', type: 'currency', align: 'right', sortable: true, aggregation: 'sum' },
    { key: 'balance_due', header: 'BALANCE DUE', type: 'currency', align: 'right', sortable: true, aggregation: 'sum' },
    { key: 'due_date', header: 'DUE DATE', type: 'date', sortable: true },
  ],

  filters: [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'sent', label: 'Sent' },
        { value: 'paid', label: 'Paid' },
        { value: 'partially_paid', label: 'Partially Paid' },
        { value: 'overdue', label: 'Overdue' },
      ],
    },
    {
      key: 'customer_id',
      label: 'Customer',
      type: 'select',
      optionsLoader: async () => {
        const response = await customersService.getAllCustomers();
        if (response.data?.data) {
          return response.data.data.map((c: any) => ({ value: c.id, label: c.customer_name }));
        }
        return [];
      },
    },
  ],

  dataFetcher: async (filters: ReportFilters) => {
    const response = await invoicesService.getAllInvoices({
      from_date: filters.startDate,
      to_date: filters.endDate,
      status: filters.status,
      customer_id: filters.customer_id,
    });
    if (response.success && response.data?.invoices) {
      return response.data.invoices;
    }
    return [];
  },

  exportFilename: 'invoice-details',
};

// =====================
// PAYABLES REPORTS
// =====================

const billDetailsConfig: ReportConfig = {
  id: 'bill-details',
  name: 'Bill Details',
  category: 'Payables',
  description: 'Detailed list of all bills',
  showTotals: true,

  columns: [
    { key: 'bill_date', header: 'DATE', type: 'date', sortable: true },
    { key: 'bill_number', header: 'BILL #', type: 'text', sortable: true },
    { key: 'vendor_name', header: 'VENDOR', type: 'text', sortable: true },
    { key: 'status', header: 'STATUS', type: 'status', sortable: true },
    { key: 'total_amount', header: 'AMOUNT', type: 'currency', align: 'right', sortable: true, aggregation: 'sum' },
    { key: 'balance_due', header: 'BALANCE DUE', type: 'currency', align: 'right', sortable: true, aggregation: 'sum' },
    { key: 'due_date', header: 'DUE DATE', type: 'date', sortable: true },
  ],

  filters: [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'open', label: 'Open' },
        { value: 'paid', label: 'Paid' },
        { value: 'partially_paid', label: 'Partially Paid' },
        { value: 'overdue', label: 'Overdue' },
      ],
    },
    {
      key: 'vendor_id',
      label: 'Vendor',
      type: 'select',
      optionsLoader: async () => {
        const response = await vendorsService.getAllVendors();
        if (response.data?.data) {
          return response.data.data.map((v: any) => ({ value: v.id, label: v.supplier_name }));
        }
        return [];
      },
    },
  ],

  dataFetcher: async (filters: ReportFilters) => {
    const response = await billsService.getAllBills({
      from_date: filters.startDate,
      to_date: filters.endDate,
      status: filters.status,
      vendor_id: filters.vendor_id,
    });
    if (response.success && response.data) {
      return response.data;
    }
    return [];
  },

  exportFilename: 'bill-details',
};

// =====================
// INVENTORY REPORTS
// =====================

const inventorySummaryConfig: ReportConfig = {
  id: 'inventory-summary',
  name: 'Inventory Summary',
  category: 'Inventory',
  description: 'Summary of all inventory items',
  showTotals: true,

  columns: [
    { key: 'item_name', header: 'ITEM NAME', type: 'text', sortable: true },
    { key: 'sku', header: 'SKU', type: 'text', sortable: true },
    { key: 'current_stock', header: 'STOCK ON HAND', type: 'number', align: 'right', sortable: true, aggregation: 'sum' },
    { key: 'reorder_point', header: 'REORDER LEVEL', type: 'number', align: 'right' },
    { key: 'unit_price', header: 'SELLING PRICE', type: 'currency', align: 'right' },
    { key: 'cost_price', header: 'COST PRICE', type: 'currency', align: 'right' },
  ],

  filters: [
    {
      key: 'lowStock',
      label: 'Stock Level',
      type: 'select',
      options: [
        { value: '', label: 'All Items' },
        { value: 'true', label: 'Low Stock Only' },
      ],
    },
  ],

  dataFetcher: async (filters: ReportFilters) => {
    const response = await itemsService.getAllItems({
      isActive: true,
      lowStock: filters.lowStock === 'true',
    });
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    return [];
  },

  exportFilename: 'inventory-summary',
};

// =====================
// REPORT REGISTRY
// =====================

export const REPORT_CONFIGS: Record<string, ReportConfig> = {
  // Sales
  'sales-by-customer': salesByCustomerConfig,
  'sales-by-item': salesByItemConfig,
  'sales-by-category': salesByCustomerConfig, // Placeholder - uses same config for now
  'sales-by-salesperson': salesByCustomerConfig, // Placeholder
  'sales-by-register': salesByCustomerConfig, // Placeholder
  'sales-by-session': salesByCustomerConfig, // Placeholder
  'sales-summary': salesByCustomerConfig, // Placeholder
  'profit-by-item': salesByItemConfig, // Placeholder

  // Receivables
  'invoice-details': invoiceDetailsConfig,
  'receivable-details': invoiceDetailsConfig, // Uses same structure
  'receivable-summary': invoiceDetailsConfig, // Placeholder
  'customer-balance-summary': salesByCustomerConfig, // Placeholder

  // Payables
  'bill-details': billDetailsConfig,
  'payable-details': billDetailsConfig, // Uses same structure
  'payable-summary': billDetailsConfig, // Placeholder
  'payments-made': billDetailsConfig, // Placeholder
  'vendor-credit-details': billDetailsConfig, // Placeholder
  'vendor-balance-summary': billDetailsConfig, // Placeholder

  // Inventory
  'inventory-summary': inventorySummaryConfig,
  'committed-stock-details': inventorySummaryConfig, // Placeholder
  'inventory-aging-summary': inventorySummaryConfig, // Placeholder
  'stock-summary': inventorySummaryConfig, // Placeholder
  'inventory-adjustment-summary': inventorySummaryConfig, // Placeholder
  'inventory-valuation-summary': inventorySummaryConfig, // Placeholder

  // Advanced Inventory
  'batch-details': inventorySummaryConfig, // Placeholder
  'serial-number-details': inventorySummaryConfig, // Placeholder

  // Other
  'activity-logs-audit-trail': invoiceDetailsConfig, // Placeholder
  'purchases-by-category': billDetailsConfig, // Placeholder
  'purchases-by-item': billDetailsConfig, // Placeholder
  'refund-history': invoiceDetailsConfig, // Placeholder
  'payments-received': invoiceDetailsConfig, // Placeholder
  'transfer-order-details': inventorySummaryConfig, // Placeholder
  'transfer-order-summary': inventorySummaryConfig, // Placeholder
  'location-details': inventorySummaryConfig, // Placeholder
};

// Helper to get report configuration
export const getReportConfig = (reportId: string): ReportConfig | undefined => {
  return REPORT_CONFIGS[reportId];
};
