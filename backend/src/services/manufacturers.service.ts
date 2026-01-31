import { supabaseAdmin } from '../config/supabase';

export class ManufacturersService {
    async getAllManufacturers() {
        const { data, error } = await supabaseAdmin
            .from('manufacturers')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return data;
    }

    async createManufacturer(data: { name: string; description?: string }) {
        const { data: result, error } = await supabaseAdmin
            .from('manufacturers')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return result;
    }

    async bulkCreateManufacturers(manufacturers: { name: string; description?: string }[]) {
        const { data, error } = await supabaseAdmin
            .from('manufacturers')
            .insert(manufacturers)
            .select();

        if (error) throw error;
        return data;
    }
}
