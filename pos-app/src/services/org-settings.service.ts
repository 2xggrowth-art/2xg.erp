import { ipc } from './ipc-client';

export interface OrgSettings {
  id: string;
  organization_id?: string;
  company_name: string;
  tagline?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  state_code?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  gstin?: string;
  pan?: string;
  logo_url?: string;
  bank_name?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  invoice_prefix?: string;
  session_prefix?: string;
  default_register?: string;
  place_of_supply?: string;
  default_notes?: string;
  theme_color?: string;
}

class OrgSettingsService {
  async getOrgSettings(): Promise<OrgSettings> {
    const result = await ipc().getOrgSettings();
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error(result.error || 'Failed to fetch org settings');
  }
}

export const orgSettingsService = new OrgSettingsService();
