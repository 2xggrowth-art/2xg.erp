import { supabaseAdmin } from '../config/supabase';

export class ItemSizesService {
    async getAllItemSizes() {
        const { data, error } = await supabaseAdmin
            .from('item_sizes')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return data;
    }

    async createItemSize(data: { name: string }) {
        const { data: result, error } = await supabaseAdmin
            .from('item_sizes')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return result;
    }

    async deleteItemSize(id: string) {
        const { error } = await supabaseAdmin
            .from('item_sizes')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}
