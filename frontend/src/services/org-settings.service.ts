import apiClient, { APIResponse } from './api.client';

export interface OrgSettings {
  id: string;
  organization_id: string;
  company_name: string;
  tagline?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  state_code?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  gstin?: string;
  gst_registration_type?: string;
  pan?: string;
  logo_url?: string;
  bank_name?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  bank_branch?: string;
  bank_account_type?: string;
  invoice_prefix?: string;
  session_prefix?: string;
  default_notes?: string;
  default_payment_terms?: string;
  default_register?: string;
  place_of_supply?: string;
  theme_color?: string;
  accent_color?: string;
}

class OrgSettingsService {
  async getOrgSettings(): Promise<OrgSettings> {
    const response = await apiClient.get<APIResponse<OrgSettings>>('/org-settings');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch org settings');
  }

  async updateOrgSettings(data: Partial<OrgSettings>): Promise<OrgSettings> {
    const response = await apiClient.put<APIResponse<OrgSettings>>('/org-settings', data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to update org settings');
  }

  async getCompanyInfo(): Promise<any> {
    const response = await apiClient.get<APIResponse<any>>('/org-settings/company-info');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch company info');
  }
}

export const orgSettingsService = new OrgSettingsService();
