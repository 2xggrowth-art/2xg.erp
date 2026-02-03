import * as SecureStore from 'expo-secure-store';

// API Base URL - Change this for production
const API_BASE_URL = __DEV__
  ? 'http://192.168.31.45:5000/api' // Change to your local IP for development
  : 'https://api.erp.2xg.in/api';

// Helper function for API requests
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = await SecureStore.getItemAsync('auth_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
};

// Auth Service
export const authService = {
  login: async (phoneNumber: string, pin: string) => {
    return apiRequest('/mobile-auth/login', {
      method: 'POST',
      body: JSON.stringify({
        phone_number: phoneNumber,
        pin: pin,
      }),
    });
  },

  verify: async () => {
    return apiRequest('/mobile-auth/verify');
  },
};

// Expense Service
export const expenseService = {
  getCategories: async () => {
    return apiRequest('/expenses/categories');
  },

  createExpense: async (expenseData: any, imageUri?: string) => {
    const token = await SecureStore.getItemAsync('auth_token');

    if (imageUri) {
      // Create form data for file upload
      const formData = new FormData();

      // Add image
      const filename = imageUri.split('/').pop() || 'receipt.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('voucher', {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      // Add expense data
      Object.keys(expenseData).forEach((key) => {
        if (expenseData[key] !== undefined && expenseData[key] !== null) {
          formData.append(key, String(expenseData[key]));
        }
      });

      const response = await fetch(`${API_BASE_URL}/expenses`, {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create expense');
      }
      return data;
    } else {
      return apiRequest('/expenses', {
        method: 'POST',
        body: JSON.stringify(expenseData),
      });
    }
  },
};

export default { authService, expenseService };
