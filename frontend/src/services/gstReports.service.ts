import apiClient from './api.client';

export const gstReportsService = {
  getGSTR1: (startDate: string, endDate: string) =>
    apiClient.get('/gst-reports/gstr1', { params: { startDate, endDate } }),
  getGSTR3B: (startDate: string, endDate: string) =>
    apiClient.get('/gst-reports/gstr3b', { params: { startDate, endDate } }),
  getITCReport: (startDate: string, endDate: string) =>
    apiClient.get('/gst-reports/itc', { params: { startDate, endDate } }),
};
