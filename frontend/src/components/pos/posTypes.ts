import { Customer } from '../../services/customers.service';

export interface BinAllocation {
  bin_location_id: string;
  bin_code: string;
  location_name: string;
  quantity: number;
}

export interface AvailableBin {
  bin_id: string;
  bin_code: string;
  location_name: string;
  stock: number;
}

export interface CartItem {
  id: string;
  item_id: string;
  name: string;
  sku: string;
  tax_rate: number;
  qty: number;
  rate: number;
  cost_price: number;
  bin_allocations?: BinAllocation[];
  available_bins?: AvailableBin[];
  exchange_item_id?: string;
  serial_number?: string;
  note?: string;
}

export interface HeldCart {
  id: string;
  items: CartItem[];
  customer: Customer | null;
  timestamp: Date;
}

export type TabType = 'newsale' | 'sessions' | 'invoices' | 'returns' | 'session-detail';
