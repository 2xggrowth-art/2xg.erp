import { supabaseAdmin as supabase } from '../config/supabase';

export class GstSettingsService {
  async getSettings() {
    const { data, error } = await supabase
      .from('gst_settings')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateSettings(settingsData: any) {
    // Check if settings exist
    const existing = await this.getSettings();

    if (existing) {
      const { data, error } = await supabase
        .from('gst_settings')
        .update({
          company_gstin: settingsData.company_gstin || existing.company_gstin,
          registered_state: settingsData.registered_state || existing.registered_state,
          state_code: settingsData.state_code || existing.state_code,
          gst_registration_type: settingsData.gst_registration_type || existing.gst_registration_type,
          financial_year_start: settingsData.financial_year_start || existing.financial_year_start,
          e_invoice_enabled: settingsData.e_invoice_enabled ?? existing.e_invoice_enabled,
          e_invoice_username: settingsData.e_invoice_username || existing.e_invoice_username,
          e_invoice_password: settingsData.e_invoice_password || existing.e_invoice_password,
          eway_bill_enabled: settingsData.eway_bill_enabled ?? existing.eway_bill_enabled,
          composition_rate: settingsData.composition_rate ?? existing.composition_rate,
          company_name: settingsData.company_name || existing.company_name,
          company_address: settingsData.company_address || existing.company_address,
          company_phone: settingsData.company_phone || existing.company_phone,
          company_email: settingsData.company_email || existing.company_email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('gst_settings')
        .insert({
          company_gstin: settingsData.company_gstin,
          registered_state: settingsData.registered_state || 'Karnataka',
          state_code: settingsData.state_code || '29',
          gst_registration_type: settingsData.gst_registration_type || 'regular',
          company_name: settingsData.company_name,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }
}

export const gstSettingsService = new GstSettingsService();
