import { supabaseAdmin } from '../config/supabase';

export class ItemColorsService {
    async getAllItemColors() {
        const { data, error } = await supabaseAdmin
            .from('item_colors')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return data;
    }

    async createItemColor(data: { name: string }) {
        const { data: result, error } = await supabaseAdmin
            .from('item_colors')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return result;
    }

    async deleteItemColor(id: string) {
        const { error } = await supabaseAdmin
            .from('item_colors')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}
