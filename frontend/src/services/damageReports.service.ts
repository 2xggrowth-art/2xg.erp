import apiClient from './api.client';

export interface DamageReport {
  id: string;
  report_number: string;
  item_id: string;
  item_name: string;
  bin_location_id: string | null;
  quantity: number;
  damage_type: string;
  description: string | null;
  photo_urls: string[];
  status: 'reported' | 'reviewed' | 'written_off';
  reported_by_user_id: string | null;
  reported_by_name: string | null;
  reviewed_by_user_id: string | null;
  reviewed_at: string | null;
  stock_adjusted: boolean;
  created_at: string;
  updated_at: string;
}

export const damageReportsService = {
  getAll: async (filters?: { status?: string; item_id?: string }): Promise<DamageReport[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.item_id) params.append('item_id', filters.item_id);
      const queryString = params.toString();
      const url = queryString ? `/damage-reports?${queryString}` : '/damage-reports';
      const response = await apiClient.get(url);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching damage reports:', error);
      return [];
    }
  },

  getById: async (id: string): Promise<DamageReport | null> => {
    try {
      const response = await apiClient.get(`/damage-reports/${id}`);
      return response.data.data || null;
    } catch (error) {
      console.error('Error fetching damage report:', error);
      return null;
    }
  },

  create: async (data: {
    item_id: string;
    item_name?: string;
    bin_location_id?: string;
    quantity: number;
    damage_type?: string;
    description?: string;
    photo_urls?: string[];
  }): Promise<DamageReport> => {
    const response = await apiClient.post('/damage-reports', data);
    return response.data.data;
  },

  updateStatus: async (id: string, status: string, notes?: string): Promise<DamageReport> => {
    const response = await apiClient.patch(`/damage-reports/${id}/status`, { status, notes });
    return response.data.data;
  },
};
