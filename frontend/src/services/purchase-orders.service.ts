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
  supplier_name?: string;
  supplier_email?: string;
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
  // Order Details
  payment_terms?: string;
  other_references?: string;
  terms_of_delivery?: string;
  // Receipt Details
  dispatch_through?: string;
  destination?: string;
  carrier_name_agent?: string;
  bill_of_lading_no?: string;
  bill_of_lading_date?: string;
  motor_vehicle_no?: string;
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
  // Order Details
  payment_terms?: string;
  other_references?: string;
  terms_of_delivery?: string;
  // Receipt Details
  dispatch_through?: string;
  destination?: string;
  carrier_name_agent?: string;
  bill_of_lading_no?: string;
  bill_of_lading_date?: string;
  motor_vehicle_no?: string;
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
  getAllPurchaseOrders: async (filters?: {
    status?: string;
    supplier_id?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<APIResponse<PurchaseOrder[]>> => {
    const response = await apiClient.get('/purchase-orders', { params: filters });
    return response.data;
  },

  getPurchaseOrderById: async (id: string): Promise<APIResponse<PurchaseOrder>> => {
    const response = await apiClient.get(`/purchase-orders/${id}`);
    return response.data;
  },

  generatePONumber: async (): Promise<APIResponse<{ po_number: string }>> => {
    const response = await apiClient.get('/purchase-orders/generate-po-number');
    return response.data;
  },

  createPurchaseOrder: async (poData: CreatePurchaseOrderData): Promise<APIResponse<PurchaseOrder>> => {
    const response = await apiClient.post('/purchase-orders', poData);
    return response.data;
  },

  updatePurchaseOrder: async (id: string, poData: Partial<CreatePurchaseOrderData>): Promise<APIResponse<PurchaseOrder>> => {
    const response = await apiClient.put(`/purchase-orders/${id}`, poData);
    return response.data;
  },

  deletePurchaseOrder: async (id: string): Promise<APIResponse<PurchaseOrder>> => {
    const response = await apiClient.delete(`/purchase-orders/${id}`);
    return response.data;
  },

  getPurchaseOrdersSummary: async (): Promise<APIResponse<PurchaseOrdersSummary>> => {
    const response = await apiClient.get('/purchase-orders/summary');
    return response.data;
  }
};
