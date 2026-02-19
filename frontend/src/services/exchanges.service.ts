import apiClient from './api.client';

export interface ExchangeItem {
  id: string;
  item_name: string;
  condition: 'good' | 'ok' | 'bad';
  invoice_reference?: string;
  customer_name?: string;
  estimated_price?: number;
  photo_base64?: string;
  exchange_bin_id?: string;
  received_by?: string;
  received_by_name?: string;
  status: 'received' | 'listed' | 'sold';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ExchangeStats {
  total: number;
  by_status: { received: number; listed: number; sold: number };
  by_condition: { good: number; ok: number; bad: number };
}

export const exchangesService = {
  async getAll(filters?: { status?: string; condition?: string }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.condition) params.append('condition', filters.condition);
    const queryString = params.toString();
    const url = queryString ? `/exchanges?${queryString}` : '/exchanges';
    const response = await apiClient.get(url);
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/exchanges/${id}`);
    return response.data;
  },

  async getStats() {
    const response = await apiClient.get('/exchanges/stats');
    return response.data;
  },

  async updateStatus(id: string, status: string) {
    const response = await apiClient.put(`/exchanges/${id}/status`, { status });
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete(`/exchanges/${id}`);
    return response.data;
  },
};

export default exchangesService;
