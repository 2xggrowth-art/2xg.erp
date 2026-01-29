import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

export interface TransferOrderItem {
  id?: string;
  transfer_order_id?: string;
  item_id?: string;
  item_name: string;
  description?: string;
  source_availability?: number;
  destination_availability?: number;
  transfer_quantity: number;
  unit_of_measurement?: string;
}

export interface TransferOrder {
  id: string;
  organization_id: string;
  transfer_order_number: string;
  transfer_date: string;
  source_location: string;
  destination_location: string;
  reason?: string;
  status: 'draft' | 'initiated' | 'in_transit' | 'received' | 'cancelled';
  total_items: number;
  total_quantity: number;
  notes?: string;
  attachment_urls?: string[];
  created_at: string;
  updated_at: string;
  items?: TransferOrderItem[];
}

export interface CreateTransferOrderData {
  transfer_order_number?: string;
  transfer_date: string;
  source_location: string;
  destination_location: string;
  reason?: string;
  status?: string;
  notes?: string;
  attachment_urls?: string[];
  items: Omit<TransferOrderItem, 'id' | 'transfer_order_id'>[];
}

export interface TransferOrdersFilters {
  status?: string;
  source_location?: string;
  destination_location?: string;
  from_date?: string;
  to_date?: string;
  search?: string;
}

export interface TransferOrdersSummary {
  total_orders: number;
  draft_count: number;
  initiated_count: number;
  in_transit_count: number;
  received_count: number;
  cancelled_count: number;
  total_items: number;
  total_quantity: number;
}

interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const transferOrdersService = {
  /**
   * Get all transfer orders with optional filters
   */
  getAllTransferOrders: async (filters?: TransferOrdersFilters): Promise<APIResponse<TransferOrder[]>> => {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.source_location) params.append('source_location', filters.source_location);
      if (filters?.destination_location) params.append('destination_location', filters.destination_location);
      if (filters?.from_date) params.append('from_date', filters.from_date);
      if (filters?.to_date) params.append('to_date', filters.to_date);
      if (filters?.search) params.append('search', filters.search);

      const response = await axios.get<APIResponse<TransferOrder[]>>(
        `${API_BASE_URL}/transfer-orders?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching transfer orders:', error);
      throw error;
    }
  },

  /**
   * Get a single transfer order by ID
   */
  getTransferOrderById: async (id: string): Promise<APIResponse<TransferOrder>> => {
    try {
      const response = await axios.get<APIResponse<TransferOrder>>(
        `${API_BASE_URL}/transfer-orders/${id}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching transfer order:', error);
      throw error;
    }
  },

  /**
   * Generate a new transfer order number
   */
  generateTransferOrderNumber: async (): Promise<APIResponse<{ transfer_order_number: string }>> => {
    try {
      const response = await axios.get<APIResponse<{ transfer_order_number: string }>>(
        `${API_BASE_URL}/transfer-orders/generate-transfer-order-number`
      );
      return response.data;
    } catch (error) {
      console.error('Error generating transfer order number:', error);
      throw error;
    }
  },

  /**
   * Create a new transfer order
   */
  createTransferOrder: async (data: CreateTransferOrderData): Promise<APIResponse<TransferOrder>> => {
    try {
      const response = await axios.post<APIResponse<TransferOrder>>(
        `${API_BASE_URL}/transfer-orders`,
        data
      );
      return response.data;
    } catch (error: any) {
      console.error('Error creating transfer order:', error);
      // Re-throw with the backend error message
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  /**
   * Update an existing transfer order
   */
  updateTransferOrder: async (id: string, data: Partial<CreateTransferOrderData>): Promise<APIResponse<TransferOrder>> => {
    try {
      const response = await axios.put<APIResponse<TransferOrder>>(
        `${API_BASE_URL}/transfer-orders/${id}`,
        data
      );
      return response.data;
    } catch (error: any) {
      console.error('Error updating transfer order:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  /**
   * Update transfer order status
   */
  updateTransferOrderStatus: async (id: string, status: string): Promise<APIResponse<TransferOrder>> => {
    try {
      const response = await axios.patch<APIResponse<TransferOrder>>(
        `${API_BASE_URL}/transfer-orders/${id}/status`,
        { status }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating transfer order status:', error);
      throw error;
    }
  },

  /**
   * Delete a transfer order
   */
  deleteTransferOrder: async (id: string): Promise<APIResponse<TransferOrder>> => {
    try {
      const response = await axios.delete<APIResponse<TransferOrder>>(
        `${API_BASE_URL}/transfer-orders/${id}`
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting transfer order:', error);
      throw error;
    }
  },

  /**
   * Get transfer orders summary/statistics
   */
  getTransferOrdersSummary: async (): Promise<APIResponse<TransferOrdersSummary>> => {
    try {
      const response = await axios.get<APIResponse<TransferOrdersSummary>>(
        `${API_BASE_URL}/transfer-orders/summary`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching transfer orders summary:', error);
      throw error;
    }
  },
};

export default transferOrdersService;
