// Database Types
export interface Organization {
  id: string;
  name: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface SalesTransaction {
  id: string;
  organization_id: string;
  category_id: string;
  transaction_date: string;
  invoice_number: string;
  customer_name: string;
  amount: number;
  due_amount: number;
  payment_status: 'paid' | 'partial' | 'overdue';
  created_at: string;
}

export interface ProductCategory {
  id: string;
  organization_id: string;
  name: string;
  total_sales: number;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  organization_id: string;
  product_name: string;
  sku: string;
  current_stock: number;
  reorder_point: number;
  unit_price: number;
  sales_count: number;
  created_at: string;
  updated_at: string;
}

export interface Shipment {
  id: string;
  organization_id: string;
  shipment_number: string;
  shipment_type: 'regular' | 'spare';
  status: 'pending' | 'received';
  expected_date?: string;
  received_date?: string;
  created_at: string;
}

export interface Delivery {
  id: string;
  organization_id: string;
  delivery_number: string;
  delivery_type: 'cycle_delivered' | 'pickup_pending' | 'pickup_cleared' | 'outside_delivery';
  delivery_date?: string;
  customer_name?: string;
  address?: string;
  status: 'pending' | 'completed';
  created_at: string;
}

export interface ServiceTicket {
  id: string;
  organization_id: string;
  ticket_number: string;
  customer_name: string;
  issue_category: string;
  description?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  raised_date: string;
  resolved_date?: string;
  created_at: string;
}

export interface CRMLead {
  id: string;
  organization_id: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  lead_source?: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
  expected_value?: number;
  lead_date: string;
  created_at: string;
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Date Range Query Parameters
export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}
