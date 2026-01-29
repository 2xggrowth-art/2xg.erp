import apiClient, { APIResponse } from './api.client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  department?: string;
  status: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
  phone?: string;
  department?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

const TOKEN_KEY = 'authToken';
const USER_KEY = 'authUser';

class AuthService {
  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<APIResponse<LoginResponse>>(
      '/auth/login',
      credentials
    );

    if (response.data.success && response.data.data) {
      // Store token and user data in localStorage
      this.setToken(response.data.data.token);
      this.setUser(response.data.data.user);

      return response.data.data;
    }

    throw new Error(response.data.error || 'Login failed');
  }

  /**
   * Register a new user (Admin only)
   */
  async register(userData: RegisterData): Promise<User> {
    const response = await apiClient.post<APIResponse<{ user: User }>>(
      '/auth/register',
      userData
    );

    if (response.data.success && response.data.data) {
      return response.data.data.user;
    }

    throw new Error(response.data.error || 'Registration failed');
  }

  /**
   * Verify current token and get user data
   */
  async verifyToken(): Promise<User> {
    const token = this.getToken();

    if (!token) {
      throw new Error('No token found');
    }

    const response = await apiClient.get<APIResponse<{ user: User }>>(
      '/auth/verify',
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (response.data.success && response.data.data) {
      // Update stored user data
      this.setUser(response.data.data.user);
      return response.data.data.user;
    }

    throw new Error(response.data.error || 'Token verification failed');
  }

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordData): Promise<void> {
    const token = this.getToken();

    if (!token) {
      throw new Error('No token found');
    }

    const response = await apiClient.post<APIResponse<void>>(
      '/auth/change-password',
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Password change failed');
    }
  }

  /**
   * Get all users (Admin only)
   */
  async getUsers(): Promise<User[]> {
    const token = this.getToken();

    if (!token) {
      throw new Error('No token found');
    }

    const response = await apiClient.get<APIResponse<User[]>>(
      '/auth/users',
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error || 'Failed to fetch users');
  }

  /**
   * Update user (Admin only)
   */
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const token = this.getToken();

    if (!token) {
      throw new Error('No token found');
    }

    const response = await apiClient.put<APIResponse<User>>(
      `/auth/users/${id}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error || 'Failed to update user');
  }

  /**
   * Delete user (Admin only)
   */
  async deleteUser(id: string): Promise<void> {
    const token = this.getToken();

    if (!token) {
      throw new Error('No token found');
    }

    const response = await apiClient.delete<APIResponse<void>>(
      `/auth/users/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete user');
    }
  }

  /**
   * Logout - clear local storage
   */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  /**
   * Store token in localStorage
   */
  private setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  /**
   * Get token from localStorage
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Store user data in localStorage
   */
  private setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  /**
   * Get user data from localStorage
   */
  getUser(): User | null {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Get authorization header
   */
  getAuthHeader(): { Authorization: string } | {} {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

// Export singleton instance
export const authService = new AuthService();

// Configure axios interceptor to add token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors (token expired/invalid)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if the error is 401 and NOT from the login endpoint
    if (error.response?.status === 401 && !error.config.url?.includes('/auth/login')) {
      // Token is invalid or expired, logout user
      authService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
