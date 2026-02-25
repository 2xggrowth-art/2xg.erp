import { supabaseAdmin } from '../config/supabase';

export class PosCodesService {
  async getAllPosCodes() {
    const { data, error } = await supabaseAdmin
      .from('pos_codes')
      .select('*')
      .order('employee_name', { ascending: true });

    if (error) throw error;
    return data;
  }

  async createPosCode(payload: { code: string; employee_name: string }) {
    const { data, error } = await supabaseAdmin
      .from('pos_codes')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updatePosCode(id: string, payload: { code?: string; employee_name?: string; is_active?: boolean }) {
    const { data, error } = await supabaseAdmin
      .from('pos_codes')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deletePosCode(id: string) {
    const { error } = await supabaseAdmin
      .from('pos_codes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async verifyCode(code: string) {
    const { data, error } = await supabaseAdmin
      .from('pos_codes')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;
    return data;
  }
}
