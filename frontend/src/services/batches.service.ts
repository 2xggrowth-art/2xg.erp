import apiClient from './api.client';

export interface ItemBatch {
  id: string;
  item_id: string;
  bill_id: string | null;
  bill_item_id: string | null;
  batch_number: string;
  initial_quantity: number;
  remaining_quantity: number;
  bin_location_id: string | null;
  status: 'active' | 'depleted';
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  bill_number?: string;
  bin_code?: string;
}

export interface BatchDeduction {
  id: string;
  batch_id: string;
  invoice_id: string | null;
  invoice_item_id: string | null;
  transfer_order_id: string | null;
  quantity: number;
  deduction_type: 'sale' | 'transfer' | 'adjustment';
  notes: string | null;
  created_at: string;
  // Joined fields
  invoice_number?: string;
}

class BatchesServiceClient {
  async getBatchesForItem(itemId: string, includeEmpty: boolean = true) {
    try {
      const response = await apiClient.get(`/batches/item/${itemId}?includeEmpty=${includeEmpty}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching batches:', error);
      return { success: false, data: [] };
    }
  }

  async getBatchById(id: string) {
    try {
      const response = await apiClient.get(`/batches/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching batch:', error);
      return { success: false, data: null };
    }
  }

  async getBatchDeductions(batchId: string) {
    try {
      const response = await apiClient.get(`/batches/${batchId}/deductions`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching batch deductions:', error);
      return { success: false, data: [] };
    }
  }
}

export const batchesService = new BatchesServiceClient();
