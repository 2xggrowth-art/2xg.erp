import apiClient from './api.client';
import { APIResponse } from '../types';

export interface PurchaseOrderItem {
  id?: string;
  purchase_order_id?: string;
  item_id: string;
  item_name?: string;
  account: string;
  description?: string;
  quantity: number;
  unit_of_measurement: string;
  rate: number;
  amount: number;
}

export interface PurchaseOrder {
  id: string;
  organization_id: string;
  supplier_id: string;
  po_number: string;
  order_date: string;
  expected_delivery_date?: string;
  location_id?: string;
  delivery_address_type: string;
  delivery_address?: string;
  status: string;
  subtotal: number;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
  tds_tcs_type?: string;
  tds_tcs_rate: number;
  tds_tcs_amount: number;
  adjustment: number;
  total_amount: number;
  notes?: string;
  terms_and_conditions?: string;
  attachment_urls?: string[];
  auto_po_number: boolean;
  created_at: string;
  updated_at: string;
  items?: PurchaseOrderItem[];
}

export interface CreatePurchaseOrderData {
  vendor_id: string;
  vendor_name: string;
  vendor_email?: string;
  po_number?: string;
  order_date: string;
  expected_delivery_date?: string;
  location_id?: string;
  delivery_address_type: string;
  delivery_address?: string;
  status?: string;
  discount_type?: string;
  discount_value?: number;
  tds_tcs_type?: string;
  tds_tcs_rate?: number;
  adjustment?: number;
  notes?: string;
  terms_and_conditions?: string;
  attachment_urls?: string[];
  auto_po_number?: boolean;
  items: {
    item_id: string;
    item_name: string;
    account: string;
    description?: string;
    quantity: number;
    unit_of_measurement: string;
    rate: number;
  }[];
}

export interface PurchaseOrdersSummary {
  totalPurchaseOrders: number;
  draftPurchaseOrders: number;
  issuedPurchaseOrders: number;
  totalAmount: number;
  currency: string;
}

export const purchaseOrdersService = {
  getAllPurchaseOrders: (filters?: {
    status?: string;
    supplier_id?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<APIResponse<PurchaseOrder[]>> =>
    apiClient.get('/purchase-orders', { params: filters }),

  getPurchaseOrderById: (id: string): Promise<APIResponse<PurchaseOrder>> =>
    apiClient.get(`/purchase-orders/${id}`),

  generatePONumber: (): Promise<APIResponse<{ po_number: string }>> =>
    apiClient.get('/purchase-orders/generate-po-number'),

  createPurchaseOrder: (poData: CreatePurchaseOrderData): Promise<APIResponse<PurchaseOrder>> =>
    apiClient.post('/purchase-orders', poData),

  updatePurchaseOrder: (id: string, poData: Partial<CreatePurchaseOrderData>): Promise<APIResponse<PurchaseOrder>> =>
    apiClient.put(`/purchase-orders/${id}`, poData),

  deletePurchaseOrder: (id: string): Promise<APIResponse<PurchaseOrder>> =>
    apiClient.delete(`/purchase-orders/${id}`),

  getPurchaseOrdersSummary: (): Promise<APIResponse<PurchaseOrdersSummary>> =>
    apiClient.get('/purchase-orders/summary')
};
