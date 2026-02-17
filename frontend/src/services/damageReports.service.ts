import apiClient from './api.client';

export interface DamageReport {
  id: string;
  stock_count_id?: string;
  item_id?: string;
  item_name: string;
  serial_number?: string;
  bin_location_id?: string;
  bin_code?: string;
  damaged_bin_id?: string;
  damage_description?: string;
  photo_base64?: string;
  photo_url?: string;
  reported_by?: string;
  reported_by_name?: string;
  reported_at: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  items?: {
    id: string;
    item_name: string;
    sku?: string;
    variant?: string;
    color?: string;
    size?: string;
  };
  bin_locations?: {
    id: string;
    bin_code: string;
  };
  damaged_bins?: {
    id: string;
    bin_code: string;
  };
}

export const damageReportsService = {
  // Get all damage reports
  async getAll(filters?: { status?: string; item_id?: string; stock_count_id?: string }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.item_id) params.append('item_id', filters.item_id);
    if (filters?.stock_count_id) params.append('stock_count_id', filters.stock_count_id);

    const queryString = params.toString();
    const url = queryString ? `/damage-reports?${queryString}` : '/damage-reports';
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get a single damage report
  async getById(id: string) {
    const response = await apiClient.get(`/damage-reports/${id}`);
    return response.data;
  },

  // Get pending count
  async getPendingCount() {
    const response = await apiClient.get('/damage-reports/pending-count');
    return response.data;
  },

  // Review (approve/reject) a damage report
  async review(id: string, data: { status: 'approved' | 'rejected'; review_notes?: string }) {
    const response = await apiClient.put(`/damage-reports/${id}/review`, data);
    return response.data;
  },

  // Clear photo from a damage report (save storage)
  async clearPhoto(id: string) {
    const response = await apiClient.put(`/damage-reports/${id}/clear-photo`);
    return response.data;
  },

  // Delete a damage report
  async delete(id: string) {
    const response = await apiClient.delete(`/damage-reports/${id}`);
    return response.data;
  },
};

export default damageReportsService;
