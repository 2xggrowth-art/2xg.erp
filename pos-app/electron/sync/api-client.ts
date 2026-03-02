import axios, { AxiosInstance } from 'axios';
import { getDb } from '../db/database';

let apiClient: AxiosInstance | null = null;

export function getApiClient(): AxiosInstance | null {
  if (apiClient) return apiClient;

  try {
    const db = getDb();
    const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get('cloud_url') as { value: string } | undefined;
    const tokenRow = db.prepare('SELECT value FROM app_settings WHERE key = ?').get('cloud_token') as { value: string } | undefined;

    if (!row?.value) return null;

    apiClient = axios.create({
      baseURL: row.value,
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });

    if (tokenRow?.value) {
      apiClient.interceptors.request.use((config) => {
        config.headers.Authorization = `Bearer ${tokenRow.value}`;
        return config;
      });
    }

    return apiClient;
  } catch {
    return null;
  }
}

export function resetApiClient(): void {
  apiClient = null;
}

export async function testConnection(url: string, token?: string): Promise<{ success: boolean; message: string }> {
  try {
    const client = axios.create({
      baseURL: url,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      timeout: 10000,
    });
    const response = await client.get('/health');
    return { success: true, message: 'Connected successfully' };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Connection failed',
    };
  }
}
