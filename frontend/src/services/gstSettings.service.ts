import apiClient from './api.client';

export const gstSettingsService = {
  getSettings: () => apiClient.get('/gst-settings'),
  updateSettings: (data: any) => apiClient.put('/gst-settings', data),
};
