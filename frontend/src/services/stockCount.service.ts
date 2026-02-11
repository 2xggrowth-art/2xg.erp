import apiClient from './api.client';

export interface StockCountItem {
  id: string;
  stock_count_id: string;
  item_id: string;
  item_name: string;
  sku: string;
  bin_location_id: string | null;
  bin_code: string | null;
  expected_quantity: number;
  counted_quantity: number | null;
  variance: number | null;
  notes: string | null;
  created_at: string;
}

export interface StockCount {
  id: string;
  stock_count_number: string;
  description: string | null;
  location_id: string | null;
  location_name: string | null;
  assigned_to_user_id: string | null;
  assigned_to_name: string | null;
  status: 'draft' | 'in_progress' | 'submitted' | 'approved' | 'rejected' | 'completed';
  notes: string | null;
  approved_by_user_id: string | null;
  approved_at: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
  items: StockCountItem[];
}

export const stockCountService = {
  getAllStockCounts: async (filters?: { status?: string; location_id?: string; assigned_to?: string }): Promise<StockCount[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.location_id) params.append('location_id', filters.location_id);
      if (filters?.assigned_to) params.append('assigned_to', filters.assigned_to);
      const queryString = params.toString();
      const url = queryString ? `/stock-counts?${queryString}` : '/stock-counts';
      const response = await apiClient.get(url);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching stock counts:', error);
      return [];
    }
  },

  getStockCountById: async (id: string): Promise<StockCount | null> => {
    try {
      const response = await apiClient.get(`/stock-counts/${id}`);
      return response.data.data || null;
    } catch (error) {
      console.error('Error fetching stock count:', error);
      return null;
    }
  },

  generateNumber: async (): Promise<string> => {
    try {
      const response = await apiClient.get('/stock-counts/generate-number');
      return response.data.data?.number || 'SC-00001';
    } catch (error) {
      console.error('Error generating number:', error);
      return 'SC-00001';
    }
  },

  createStockCount: async (data: {
    description?: string;
    location_id?: string;
    location_name?: string;
    assigned_to_user_id?: string;
    assigned_to_name?: string;
    notes?: string;
    items: Array<{ item_id: string; bin_location_id?: string; bin_code?: string; expected_quantity?: number }>;
  }): Promise<StockCount> => {
    const response = await apiClient.post('/stock-counts', data);
    return response.data.data;
  },

  updateStockCount: async (id: string, data: any): Promise<StockCount> => {
    const response = await apiClient.put(`/stock-counts/${id}`, data);
    return response.data.data;
  },

  deleteStockCount: async (id: string): Promise<boolean> => {
    await apiClient.delete(`/stock-counts/${id}`);
    return true;
  },

  updateStatus: async (id: string, status: string, notes?: string): Promise<StockCount> => {
    const response = await apiClient.patch(`/stock-counts/${id}/status`, { status, notes });
    return response.data.data;
  },

  updateCountedQuantities: async (id: string, items: Array<{
    id: string;
    counted_quantity: number;
    notes?: string;
  }>): Promise<StockCount> => {
    const response = await apiClient.patch(`/stock-counts/${id}/items`, { items });
    return response.data.data;
  },

  getItemByBarcode: async (barcode: string): Promise<any | null> => {
    try {
      const response = await apiClient.get(`/items/barcode/${encodeURIComponent(barcode)}`);
      return response.data.data || null;
    } catch {
      return null;
    }
  },

  saveBinScan: async (data: {
    bin_location_id: string;
    bin_code: string;
    location_id?: string;
    location_name?: string;
    scanned_by_user_id?: string;
    scanned_by_name?: string;
    items: Array<{
      item_id: string;
      item_name: string;
      sku: string;
      expected_quantity: number;
      counted_quantity: number;
    }>;
  }): Promise<StockCount> => {
    const response = await apiClient.post('/stock-counts/bin-scan', data);
    return response.data.data;
  },
};
