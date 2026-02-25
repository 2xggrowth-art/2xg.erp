import api from './api.client';

export interface PosCode {
  id: string;
  code: string;
  employee_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const posCodesService = {
  getAllPosCodes: () => api.get<{ success: boolean; data: PosCode[] }>('/pos-codes'),
  createPosCode: (data: { code: string; employee_name: string }) =>
    api.post<{ success: boolean; data: PosCode }>('/pos-codes', data),
  updatePosCode: (id: string, data: Partial<PosCode>) =>
    api.put<{ success: boolean; data: PosCode }>(`/pos-codes/${id}`, data),
  deletePosCode: (id: string) => api.delete<{ success: boolean }>(`/pos-codes/${id}`),
  verifyCode: (code: string) =>
    api.post<{ success: boolean; data: PosCode }>('/pos-codes/verify', { code }),
};
