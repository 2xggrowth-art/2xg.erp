import apiClient from './api.client';
import { APIResponse, TicketTotal, TicketCategory } from '../types';

export const careService = {
  getTotalTickets: (startDate: string, endDate: string): Promise<APIResponse<TicketTotal>> =>
    apiClient.get('/care/tickets/total', { params: { startDate, endDate } }),

  getTicketsByCategory: (startDate: string, endDate: string): Promise<APIResponse<TicketCategory[]>> =>
    apiClient.get('/care/tickets/by-category', { params: { startDate, endDate } })
};
