// Date Range Types
export interface DateRange {
  startDate: string;
  endDate: string;
  preset: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
}

// ERP Types
export interface SalesTotalResponse {
  totalSales: number;
  transactionCount: number;
  currency: string;
}

export interface CategorySales {
  name: string;
  total: number;
  count: number;
}

export interface OverdueResponse {
  amount: number;
  count: number;
  currency: string;
}

export interface InventoryItem {
  id: string;
  product_name: string;
  sku?: string;
  sales_count: number;
  unit_price: number;
  current_stock?: number;
  reorder_point?: number;
}

// Logistics Types
export interface ShipmentSummary {
  due: number;
  received: number;
  spare: number;
}

export interface DeliverySummary {
  cycleDelivered: number;
  pickupPending: number;
  pickupCleared: number;
  outsideDelivery: number;
}

// CARE Types
export interface TicketTotal {
  total: number;
}

export interface TicketCategory {
  category: string;
  count: number;
}

// CRM Types
export interface LeadReporting {
  volume: number;
  wonCount: number;
  lostCount: number;
  activeCount: number;
  totalValue: number;
  wonValue: number;
  currency: string;
}

export interface Customer {
  id: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  status: string;
  expected_value?: number;
  lead_date: string;
}

// API Response Wrapper
export interface APIResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
