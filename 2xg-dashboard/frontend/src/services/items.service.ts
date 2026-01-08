import apiClient from './api.client';
import { APIResponse } from '../types';

export interface Item {
  id: string;
  organization_id: string;
  item_name: string;
  sku: string;
  category_id?: string;
  description?: string;
  unit_price: number;
  cost_price: number;
  current_stock: number;
  reorder_point: number;
  max_stock?: number;
  unit_of_measurement: string;
  barcode?: string;
  supplier_id?: string;
  manufacturer?: string;
  weight?: number;
  dimensions?: string;
  is_active: boolean;
  tax_rate: number;
  image_url?: string;
  hsn_code?: string;
  brand?: string;
  upc?: string;
  mpn?: string;
  ean?: string;
  isbn?: string;
  is_returnable: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateItemData {
  name: string;
  sku: string;
  unit: string;
  category?: string;
  description?: string;
  unit_price?: number;
  cost_price?: number;
  current_stock?: number;
  reorder_point?: number;
  max_stock?: number;
  barcode?: string;
  manufacturer?: string;
  weight?: number;
  dimensions?: string;
  is_active?: boolean;
  tax_rate?: number;
  image_url?: string;
  hsn_code?: string;
  brand?: string;
  upc?: string;
  mpn?: string;
  ean?: string;
  isbn?: string;
  is_returnable?: boolean;
}

export interface ItemsSummary {
  totalItems: number;
  activeItems: number;
  lowStockItems: number;
  totalValue: number;
  currency: string;
}

export const itemsService = {
  getAllItems: (filters?: {
    category?: string;
    isActive?: boolean;
    lowStock?: boolean;
  }): Promise<APIResponse<Item[]>> =>
    apiClient.get('/items', { params: filters }),

  getItemById: (id: string): Promise<APIResponse<Item>> =>
    apiClient.get(`/items/${id}`),

  createItem: (itemData: CreateItemData): Promise<APIResponse<Item>> =>
    apiClient.post('/items', itemData),

  updateItem: (id: string, itemData: Partial<CreateItemData>): Promise<APIResponse<Item>> =>
    apiClient.put(`/items/${id}`, itemData),

  deleteItem: (id: string): Promise<APIResponse<Item>> =>
    apiClient.delete(`/items/${id}`),

  getItemsSummary: (): Promise<APIResponse<ItemsSummary>> =>
    apiClient.get('/items/summary'),

  getTopSellingItems: (limit?: number): Promise<APIResponse<any[]>> =>
    apiClient.get('/items/top-selling', { params: { limit } })
};
