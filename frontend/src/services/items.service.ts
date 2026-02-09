import apiClient from './api.client';
import { APIResponse } from '../types';
import { AxiosPromise } from 'axios';

export interface Item {
  id: string;
  organization_id: string;
  item_name: string;
  sku: string;
  category_id?: string;
  subcategory_id?: string;
  item_type?: string;
  size?: string;
  color?: string;
  variant?: string;
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
  is_premium_tagged?: boolean;
  incentive_type?: string;
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

export interface ImportResult {
  successful: Item[];
  failed: { row: number; sku: string; error: string }[];
  duplicates: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: { row: number; field: string; message: string }[];
  warnings: { row: number; field: string; message: string }[];
  totalRows: number;
}

export interface ProductCategory {
  id: string;
  name: string;
}

export interface ProductSubcategory {
  id: string;
  name: string;
  category_id: string;
}

export const itemsService = {
  getCategories: (): AxiosPromise<APIResponse<ProductCategory[]>> =>
    apiClient.get('/items/categories'),

  createCategory: (name: string): AxiosPromise<APIResponse<ProductCategory>> =>
    apiClient.post('/items/categories', { name }),

  deleteCategory: (id: string): AxiosPromise<APIResponse<ProductCategory>> =>
    apiClient.delete(`/items/categories/${id}`),

  getAllSubcategories: (): AxiosPromise<APIResponse<ProductSubcategory[]>> =>
    apiClient.get('/items/subcategories'),

  getSubcategories: (categoryId: string): AxiosPromise<APIResponse<ProductSubcategory[]>> =>
    apiClient.get(`/items/categories/${categoryId}/subcategories`),

  createSubcategory: (categoryId: string, name: string): AxiosPromise<APIResponse<ProductSubcategory>> =>
    apiClient.post(`/items/categories/${categoryId}/subcategories`, { name }),

  deleteSubcategory: (id: string): AxiosPromise<APIResponse<ProductSubcategory>> =>
    apiClient.delete(`/items/subcategories/${id}`),

  generateSku: (): AxiosPromise<APIResponse<{ sku: string }>> =>
    apiClient.get('/items/generate-sku'),

  getAllItems: (filters?: {
    category?: string;
    isActive?: boolean;
    lowStock?: boolean;
  }): AxiosPromise<APIResponse<Item[]>> =>
    apiClient.get('/items', {
      params: { ...filters, _t: Date.now() },
      headers: { 'Cache-Control': 'no-cache' }
    }),

  getItemById: (id: string): AxiosPromise<APIResponse<Item>> =>
    apiClient.get(`/items/${id}`),

  createItem: (itemData: CreateItemData): AxiosPromise<APIResponse<Item>> =>
    apiClient.post('/items', itemData),

  updateItem: (id: string, itemData: Partial<CreateItemData>): AxiosPromise<APIResponse<Item>> =>
    apiClient.put(`/items/${id}`, itemData),

  deleteItem: (id: string): AxiosPromise<APIResponse<Item>> =>
    apiClient.delete(`/items/${id}`),

  getItemsSummary: (): AxiosPromise<APIResponse<ItemsSummary>> =>
    apiClient.get('/items/summary'),

  getTopSellingItems: (limit?: number): AxiosPromise<APIResponse<any[]>> =>
    apiClient.get('/items/top-selling', { params: { limit } }),

  // Import/Export operations
  importItems: (
    items: any[],
    mode: 'create' | 'update' | 'upsert' = 'create'
  ): AxiosPromise<APIResponse<ImportResult>> =>
    apiClient.post('/items/import', { items, mode }),

  validateImportData: (items: any[]): AxiosPromise<APIResponse<ValidationResult>> =>
    apiClient.post('/items/import/validate', { items }),

  importFromGoogleSheets: (
    sheetUrl: string,
    mode: 'create' | 'update' | 'upsert' = 'create'
  ): AxiosPromise<APIResponse<ImportResult>> =>
    apiClient.post('/items/import/google-sheets', { sheetUrl, mode }),

  exportItems: (filters?: {
    includeInactive?: boolean;
    itemIds?: string[];
  }): AxiosPromise<APIResponse<Item[]>> =>
    apiClient.get('/items/export', { params: filters }),
};
