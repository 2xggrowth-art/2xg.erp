import apiClient, { APIResponse } from './api.client';

export interface BinLocation {
  id: string;
  bin_code: string;
  warehouse: string;
  description: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at?: string;
}

export interface CreateBinLocationData {
  bin_code: string;
  warehouse: string;
  description?: string;
  status?: 'active' | 'inactive';
}

export interface BinLocationFilters {
  warehouse?: string;
  status?: string;
  search?: string;
}

export interface BinItemStock {
  item_id: string;
  item_name: string;
  quantity: number;
  unit_of_measurement: string;
  transactions: Array<{
    type: 'purchase' | 'sale';
    reference: string;
    date: string;
    quantity: number;
    created_at: string;
  }>;
}

export interface BinLocationWithStock extends BinLocation {
  items: BinItemStock[];
  total_items: number;
  total_quantity: number;
}

class BinLocationService {
  /**
   * Get all bin locations with optional filters
   */
  async getAllBinLocations(filters?: BinLocationFilters): Promise<APIResponse<BinLocation[]>> {
    try {
      const params = new URLSearchParams();

      if (filters?.warehouse) {
        params.append('warehouse', filters.warehouse);
      }
      if (filters?.status) {
        params.append('status', filters.status);
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }

      const queryString = params.toString();
      const url = `/bin-locations${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get<APIResponse<BinLocation[]>>(url);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching bin locations:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || error.message || 'Failed to fetch bin locations'
      };
    }
  }

  /**
   * Get a single bin location by ID
   */
  async getBinLocationById(id: string): Promise<APIResponse<BinLocation>> {
    try {
      const response = await apiClient.get<APIResponse<BinLocation>>(`/bin-locations/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching bin location:', error);
      return {
        success: false,
        data: null as any,
        error: error.response?.data?.error || error.message || 'Failed to fetch bin location'
      };
    }
  }

  /**
   * Create a new bin location
   */
  async createBinLocation(data: CreateBinLocationData): Promise<APIResponse<BinLocation>> {
    try {
      const response = await apiClient.post<APIResponse<BinLocation>>('/bin-locations', data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating bin location:', error);
      return {
        success: false,
        data: null as any,
        error: error.response?.data?.error || error.message || 'Failed to create bin location'
      };
    }
  }

  /**
   * Update an existing bin location
   */
  async updateBinLocation(id: string, data: Partial<CreateBinLocationData>): Promise<APIResponse<BinLocation>> {
    try {
      const response = await apiClient.put<APIResponse<BinLocation>>(`/bin-locations/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating bin location:', error);
      return {
        success: false,
        data: null as any,
        error: error.response?.data?.error || error.message || 'Failed to update bin location'
      };
    }
  }

  /**
   * Delete a bin location
   */
  async deleteBinLocation(id: string): Promise<APIResponse<BinLocation>> {
    try {
      const response = await apiClient.delete<APIResponse<BinLocation>>(`/bin-locations/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting bin location:', error);
      return {
        success: false,
        data: null as any,
        error: error.response?.data?.error || error.message || 'Failed to delete bin location'
      };
    }
  }

  /**
   * Get all bin locations with their current stock
   */
  async getBinLocationsWithStock(): Promise<APIResponse<BinLocationWithStock[]>> {
    try {
      const response = await apiClient.get<APIResponse<BinLocationWithStock[]>>('/bin-locations/stock/all');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching bin locations with stock:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || error.message || 'Failed to fetch bin stock information'
      };
    }
  }

  /**
   * Get bin locations for a specific item
   */
  async getBinLocationsForItem(itemId: string): Promise<APIResponse<any[]>> {
    try {
      const response = await apiClient.get<APIResponse<any[]>>(`/bin-locations/item/${itemId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching bin locations for item:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || error.message || 'Failed to fetch item bin locations'
      };
    }
  }
}

export const binLocationService = new BinLocationService();
