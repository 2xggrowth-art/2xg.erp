import apiClient from './api.client';
import {
  APIResponse,
  SalesTotalResponse,
  CategorySales,
  OverdueResponse,
  InventoryItem
} from '../types';

export const erpService = {
  getTotalSales: (startDate: string, endDate: string): Promise<APIResponse<SalesTotalResponse>> =>
    apiClient.get('/erp/sales/total', { params: { startDate, endDate } }),

  getSalesByCategory: (startDate: string, endDate: string): Promise<APIResponse<CategorySales[]>> =>
    apiClient.get('/erp/sales/by-category', { params: { startDate, endDate } }),

  getOverdueAmount: (startDate: string, endDate: string): Promise<APIResponse<OverdueResponse>> =>
    apiClient.get('/erp/sales/overdue', { params: { startDate, endDate } }),

  getHotSellingItems: (): Promise<APIResponse<InventoryItem[]>> =>
    apiClient.get('/erp/inventory/hot-selling'),

  getLowStockItems: (): Promise<APIResponse<InventoryItem[]>> =>
    apiClient.get('/erp/inventory/low-stock')
};
