import apiClient from './api.client';
import { APIResponse, LeadReporting, Customer } from '../types';

export const crmService = {
  getLeadReporting: (startDate: string, endDate: string): Promise<APIResponse<LeadReporting>> =>
    apiClient.get('/crm/leads/reporting', { params: { startDate, endDate } }),

  getCustomers: (startDate: string, endDate: string): Promise<APIResponse<Customer[]>> =>
    apiClient.get('/crm/customers/list', { params: { startDate, endDate } })
};
