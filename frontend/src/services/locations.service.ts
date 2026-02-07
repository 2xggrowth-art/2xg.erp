import apiClient, { APIResponse } from './api.client';

export interface Location {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at?: string;
}

export interface CreateLocationData {
  name: string;
  description?: string;
  status?: 'active' | 'inactive';
}

class LocationsService {
  async getAllLocations(filters?: { status?: string; search?: string }): Promise<APIResponse<Location[]>> {
    try {
      const params = new URLSearchParams();

      if (filters?.status) {
        params.append('status', filters.status);
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }

      const queryString = params.toString();
      const url = `/locations${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get<APIResponse<Location[]>>(url);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching locations:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || error.message || 'Failed to fetch locations'
      };
    }
  }

  async getLocationById(id: string): Promise<APIResponse<Location>> {
    try {
      const response = await apiClient.get<APIResponse<Location>>(`/locations/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching location:', error);
      return {
        success: false,
        data: null as any,
        error: error.response?.data?.error || error.message || 'Failed to fetch location'
      };
    }
  }

  async createLocation(data: CreateLocationData): Promise<APIResponse<Location>> {
    try {
      const response = await apiClient.post<APIResponse<Location>>('/locations', data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating location:', error);
      return {
        success: false,
        data: null as any,
        error: error.response?.data?.error || error.message || 'Failed to create location'
      };
    }
  }

  async updateLocation(id: string, data: Partial<CreateLocationData>): Promise<APIResponse<Location>> {
    try {
      const response = await apiClient.put<APIResponse<Location>>(`/locations/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating location:', error);
      return {
        success: false,
        data: null as any,
        error: error.response?.data?.error || error.message || 'Failed to update location'
      };
    }
  }

  async deleteLocation(id: string): Promise<APIResponse<Location>> {
    try {
      const response = await apiClient.delete<APIResponse<Location>>(`/locations/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting location:', error);
      return {
        success: false,
        data: null as any,
        error: error.response?.data?.error || error.message || 'Failed to delete location'
      };
    }
  }
}

export const locationsService = new LocationsService();
