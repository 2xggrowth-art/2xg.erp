import apiClient from './api.client';

export interface PutawayTask {
  id: string;
  task_number: string;
  bill_id: string;
  bill_item_id: string;
  item_id: string;
  item_name: string;
  sku: string | null;
  serial_number: string | null;
  quantity: number;
  placed_quantity: number;
  suggested_bin_id: string | null;
  suggested_bin_code: string | null;
  actual_bin_id: string | null;
  actual_bin_code: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to_user_id: string | null;
  assigned_to_name: string | null;
  priority: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface PutawayStats {
  pending_count: number;
  in_progress_count: number;
  completed_today: number;
  queued_offline: number;
}

export interface AdminStats {
  total_bins: number;
  total_items: number;
  utilization_pct: number;
  total_capacity: number;
  pending_placements: number;
  pending_stock_counts: number;
}

export interface BinSuggestion {
  bin_id: string;
  bin_code: string;
  reason: string;
}

export const putawayService = {
  getPending: async (userId?: string) => {
    const params = userId ? { assigned_to: userId } : {};
    const res = await apiClient.get('/putaway/pending', { params });
    return res.data;
  },

  getInProgress: async (userId?: string) => {
    const params = userId ? { assigned_to: userId } : {};
    const res = await apiClient.get('/putaway/in-progress', { params });
    return res.data;
  },

  getHistory: async (limit = 20) => {
    const res = await apiClient.get('/putaway/history', { params: { limit } });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await apiClient.get(`/putaway/${id}`);
    return res.data;
  },

  getStats: async (userId?: string) => {
    const params = userId ? { user_id: userId } : {};
    const res = await apiClient.get('/putaway/stats', { params });
    return res.data;
  },

  getAdminStats: async () => {
    const res = await apiClient.get('/putaway/admin-stats');
    return res.data;
  },

  suggestBin: async (itemId: string) => {
    const res = await apiClient.get(`/putaway/suggest-bin/${itemId}`);
    return res.data;
  },

  startTask: async (taskId: string) => {
    const res = await apiClient.patch(`/putaway/${taskId}/start`);
    return res.data;
  },

  placeItem: async (taskId: string, data: { bin_location_id: string; quantity: number }) => {
    const res = await apiClient.post(`/putaway/${taskId}/place`, data);
    return res.data;
  },

  createFromBill: async (billId: string) => {
    const res = await apiClient.post('/putaway/from-bill', { bill_id: billId });
    return res.data;
  },
};
