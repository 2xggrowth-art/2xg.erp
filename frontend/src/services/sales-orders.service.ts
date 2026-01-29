import apiClient from './api.client';

export interface SalesOrderItem {
  item_id?: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit_of_measurement: string;
  rate: number;
  amount: number;
  stock_on_hand?: number;
  serial_numbers?: string[];
}

export interface SalesOrder {
  id?: string;
  organization_id?: string;
  sales_order_number?: string;
  customer_id?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  reference_number?: string;
  sales_order_date: string;
  expected_shipment_date?: string;
  payment_terms?: string;
  salesperson_id?: string;
  salesperson_name?: string;
  delivery_method?: string;
  status?: string;
  subtotal: number;
  discount_type?: 'percentage' | 'amount';
  discount_value?: number;
  discount_amount?: number;
  tax_amount?: number;
  tds_tcs_type?: 'TDS' | 'TCS';
  tds_tcs_rate?: number;
  tds_tcs_amount?: number;
  shipping_charges?: number;
  adjustment?: number;
  total_amount: number;
  customer_notes?: string;
  terms_and_conditions?: string;
  items: SalesOrderItem[];
  created_at?: string;
  updated_at?: string;
}

export interface SalesOrderFilters {
  status?: string;
  customer_id?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}

class SalesOrdersService {
  private readonly basePath = '/sales-orders';

  /**
   * Generate a new sales order number
   */
  async generateSalesOrderNumber(): Promise<{ success: boolean; data: { sales_order_number: string } }> {
    try {
      const response = await apiClient.get(`${this.basePath}/generate-number`);
      return response.data;
    } catch (error: any) {
      console.error('Error generating sales order number:', error);
      throw error;
    }
  }

  /**
   * Create a new sales order
   */
  async createSalesOrder(salesOrderData: SalesOrder): Promise<{ success: boolean; data: SalesOrder; message: string }> {
    try {
      const response = await apiClient.post(this.basePath, salesOrderData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating sales order:', error);
      const errorMessage = error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Failed to create sales order';
      const errorDetails = error.response?.data?.details;
      const fullMessage = errorDetails ? `${errorMessage}\n${errorDetails}` : errorMessage;
      throw new Error(fullMessage);
    }
  }

  /**
   * Get all sales orders
   */
  async getAllSalesOrders(filters?: SalesOrderFilters): Promise<{
    success: boolean;
    data: {
      salesOrders: SalesOrder[];
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
      console.error('Error fetching sales orders:', error);
      throw error;
    }
  }

  /**
   * Get a single sales order by ID
   */
  async getSalesOrderById(id: string): Promise<{ success: boolean; data: SalesOrder }> {
    try {
      const response = await apiClient.get(`${this.basePath}/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching sales order:', error);
      throw error;
    }
  }

  /**
   * Update a sales order
   */
  async updateSalesOrder(id: string, salesOrderData: Partial<SalesOrder>): Promise<{ success: boolean; data: SalesOrder; message: string }> {
    try {
      const response = await apiClient.put(`${this.basePath}/${id}`, salesOrderData);
      return response.data;
    } catch (error: any) {
      console.error('Error updating sales order:', error);
      throw error;
    }
  }

  /**
   * Delete a sales order
   */
  async deleteSalesOrder(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(`${this.basePath}/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting sales order:', error);
      throw error;
    }
  }
}

export const salesOrdersService = new SalesOrdersService();
