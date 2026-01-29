import apiClient from './api.client';

export interface DeliveryChallanItem {
  item_id?: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit_of_measurement: string;
  rate: number;
  amount: number;
  stock_on_hand?: number;
}

export interface DeliveryChallan {
  id?: string;
  organization_id?: string;
  challan_number?: string;
  customer_id?: string;
  customer_name: string;
  reference_number?: string;
  challan_date: string;
  challan_type: string;
  location?: string;
  status?: string;
  subtotal: number;
  adjustment?: number;
  total_amount: number;
  notes?: string;
  items: DeliveryChallanItem[];
  created_at?: string;
  updated_at?: string;
}

export interface DeliveryChallanFilters {
  status?: string;
  customer_id?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}

class DeliveryChallansService {
  private readonly basePath = '/delivery-challans';

  /**
   * Generate a new delivery challan number
   */
  async generateChallanNumber(): Promise<{ success: boolean; data: { challan_number: string } }> {
    try {
      const response = await apiClient.get(`${this.basePath}/generate-number`);
      return response.data;
    } catch (error: any) {
      console.error('Error generating challan number:', error);
      throw error;
    }
  }

  /**
   * Create a new delivery challan
   */
  async createDeliveryChallan(challanData: DeliveryChallan): Promise<{ success: boolean; data: DeliveryChallan; message: string }> {
    try {
      const response = await apiClient.post(this.basePath, challanData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating delivery challan:', error);
      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.message ||
                          error.message ||
                          'Failed to create delivery challan';
      const errorDetails = error.response?.data?.details;
      const fullMessage = errorDetails ? `${errorMessage}\n${errorDetails}` : errorMessage;
      throw new Error(fullMessage);
    }
  }

  /**
   * Get all delivery challans
   */
  async getAllDeliveryChallans(filters?: DeliveryChallanFilters): Promise<{
    success: boolean;
    data: {
      deliveryChallans: DeliveryChallan[];
      total: number;
      page: number;
      limit: number;
    }
  }> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.customer_id) params.append('customer_id', filters.customer_id);
      if (filters?.from_date) params.append('from_date', filters.from_date);
      if (filters?.to_date) params.append('to_date', filters.to_date);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const url = params.toString() ? `${this.basePath}?${params.toString()}` : this.basePath;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching delivery challans:', error);
      throw error;
    }
  }

  /**
   * Get a single delivery challan by ID
   */
  async getDeliveryChallanById(id: string): Promise<{ success: boolean; data: DeliveryChallan }> {
    try {
      const response = await apiClient.get(`${this.basePath}/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching delivery challan:', error);
      throw error;
    }
  }

  /**
   * Update a delivery challan
   */
  async updateDeliveryChallan(id: string, challanData: Partial<DeliveryChallan>): Promise<{ success: boolean; data: DeliveryChallan; message: string }> {
    try {
      const response = await apiClient.put(`${this.basePath}/${id}`, challanData);
      return response.data;
    } catch (error: any) {
      console.error('Error updating delivery challan:', error);
      throw error;
    }
  }

  /**
   * Delete a delivery challan
   */
  async deleteDeliveryChallan(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(`${this.basePath}/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting delivery challan:', error);
      throw error;
    }
  }
}

export const deliveryChallansService = new DeliveryChallansService();
