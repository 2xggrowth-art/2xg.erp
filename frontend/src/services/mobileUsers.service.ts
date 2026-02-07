import apiClient from './api.client';

export interface MobileUser {
  id: string;
  phone_number: string;
  employee_name: string;
  employee_id?: string;
  branch: string;
  is_active: boolean;
  created_at: string;
}

class MobileUsersService {
  private baseUrl = '/mobile-auth';

  async getAllUsers(): Promise<{ success: boolean; data: MobileUser[] }> {
    const response = await apiClient.get(`${this.baseUrl}/users`);
    return response.data;
  }

  async createUser(data: {
    phone_number: string;
    pin: string;
    employee_name: string;
    employee_id?: string;
    branch?: string;
  }): Promise<{ success: boolean; data: MobileUser; message: string }> {
    const response = await apiClient.post(`${this.baseUrl}/users`, data);
    return response.data;
  }

  async updatePin(userId: string, newPin: string): Promise<{ success: boolean; data: MobileUser; message: string }> {
    const response = await apiClient.put(`${this.baseUrl}/users/${userId}/pin`, { pin: newPin });
    return response.data;
  }
}

export const mobileUsersService = new MobileUsersService();
