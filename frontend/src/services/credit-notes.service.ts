import apiClient from './api.client';

export interface CreditNoteItem {
  item_id: string;
  item_name: string;
  quantity: number;
  rate: number;
  amount: number;
  reason?: string;
}

export interface CreditNote {
  id: string;
  credit_note_number: string;
  invoice_id?: string;
  invoice_number?: string;
  customer_id?: string;
  customer_name?: string;
  credit_date: string;
  reason?: string;
  sub_total: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  items?: CreditNoteItem[];
  created_at: string;
}

export const creditNotesService = {
  generateNumber: () => apiClient.get('/credit-notes/generate-number'),
  getAll: (filters?: Record<string, any>) => apiClient.get('/credit-notes', { params: filters }),
  getById: (id: string) => apiClient.get(`/credit-notes/${id}`),
  create: (data: { invoice_id?: string; invoice_number?: string; customer_id?: string; customer_name?: string; reason?: string; items: CreditNoteItem[] }) =>
    apiClient.post('/credit-notes', data),
  updateStatus: (id: string, status: string) => apiClient.put(`/credit-notes/${id}/status`, { status }),
};
