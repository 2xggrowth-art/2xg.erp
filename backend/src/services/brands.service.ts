import { supabaseAdmin } from '../config/supabase';

export class BrandsService {
    async getAllBrands() {
        const { data, error } = await supabaseAdmin
            .from('brands')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return data;
    }

    async createBrand(brandData: { name: string; description?: string }) {
        const { data, error } = await supabaseAdmin
            .from('brands')
            .insert(brandData)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async bulkCreateBrands(brands: { name: string; description?: string }[]) {
        // Supabase supports bulk insert
        const { data, error } = await supabaseAdmin
            .from('brands')
            .insert(brands)
            .select();

        if (error) throw error;
        return data;
    }
}
