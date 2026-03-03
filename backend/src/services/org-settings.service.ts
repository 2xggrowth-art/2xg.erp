import { supabaseAdmin as supabase } from '../config/supabase';

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

export class OrgSettingsService {
  async getOrgSettings(orgId: string): Promise<OrgSettings | null> {
    const { data, error } = await supabase
      .from('org_settings')
      .select('*')
      .eq('organization_id', orgId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  async updateOrgSettings(orgId: string, updates: Partial<OrgSettings>): Promise<OrgSettings> {
    const { id, organization_id, ...cleanUpdates } = updates as any;
    cleanUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('org_settings')
      .update(cleanUpdates)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getCompanyInfo(orgId: string) {
    const settings = await this.getOrgSettings(orgId);
    if (!settings) return null;

    return {
      name: settings.company_name,
      tagline: settings.tagline || '',
      address: settings.address_line1 || '',
      addressLine2: settings.address_line2 || '',
      city: settings.city || '',
      state: settings.state || '',
      postalCode: settings.postal_code || '',
      country: settings.country || 'India',
      phone: settings.phone || '',
      email: settings.email || '',
      website: settings.website || '',
      gstin: settings.gstin || '',
      bankName: settings.bank_name || '',
      accountHolder: settings.bank_account_name || '',
      accountNumber: settings.bank_account_number || '',
      ifscCode: settings.bank_ifsc || '',
      branchName: settings.bank_branch || '',
      accountType: settings.bank_account_type || '',
    };
  }

  async getOrgSettingsWithFallback(orgId?: string): Promise<OrgSettings | null> {
    if (orgId) {
      return this.getOrgSettings(orgId);
    }
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)
      .single();

    if (org) {
      return this.getOrgSettings(org.id);
    }
    return null;
  }
}
