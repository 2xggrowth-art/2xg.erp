import apiClient from './api.client';

export interface Pricelist {
  id: string;
  name: string;
  description?: string;
  is_default: boolean;
  is_active: boolean;
  items?: PricelistItem[];
}

export interface PricelistItem {
  id: string;
  pricelist_id: string;
  item_id: string;
  price: number;
  item_name?: string;
}

export const pricelistsService = {
  getAll: () => apiClient.get('/pricelists'),
  getById: (id: string) => apiClient.get(`/pricelists/${id}`),
  create: (data: Partial<Pricelist>) => apiClient.post('/pricelists', data),
  update: (id: string, data: Partial<Pricelist>) => apiClient.put(`/pricelists/${id}`, data),
  delete: (id: string) => apiClient.delete(`/pricelists/${id}`),
  getItems: (id: string) => apiClient.get(`/pricelists/${id}/items`),
  setItems: (id: string, items: { item_id: string; price: number }[]) => apiClient.put(`/pricelists/${id}/items`, { items }),
};
