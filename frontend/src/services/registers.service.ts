import apiClient from './api.client';

export interface Register {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export const registersService = {
  getAll: () => apiClient.get('/registers'),
  create: (data: Partial<Register>) => apiClient.post('/registers', data),
  update: (id: string, data: Partial<Register>) => apiClient.put(`/registers/${id}`, data),
  delete: (id: string) => apiClient.delete(`/registers/${id}`),
};
