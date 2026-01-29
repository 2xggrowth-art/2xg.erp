import apiClient from './api.client';
import { APIResponse, ShipmentSummary, DeliverySummary } from '../types';

export const logisticsService = {
  getShipmentSummary: (startDate: string, endDate: string): Promise<APIResponse<ShipmentSummary>> =>
    apiClient.get('/logistics/shipments/summary', { params: { startDate, endDate } }),

  getDeliverySummary: (startDate: string, endDate: string): Promise<APIResponse<DeliverySummary>> =>
    apiClient.get('/logistics/deliveries/summary', { params: { startDate, endDate } })
};
