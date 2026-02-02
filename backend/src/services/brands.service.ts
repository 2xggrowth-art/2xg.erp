import { supabaseAdmin } from '../config/supabase';

export class BrandsService {
    async getAllBrands() {
        const { data, error} = await supabaseAdmin
            .from('brands')
            .select(`
                *,
                manufacturer:manufacturers(id, name)
            `)
            .order('name', { ascending: true });

        if (error) throw error;

        // Flatten manufacturer data
        return data?.map(brand => ({
            ...brand,
            manufacturer_name: brand.manufacturer?.name || null
        }));
    }

    async getBrandsByManufacturer(manufacturerId: string) {
        const { data, error } = await supabaseAdmin
            .from('brands')
            .select('*')
            .eq('manufacturer_id', manufacturerId)
            .order('name', { ascending: true });

        if (error) throw error;
        return data;
    }

    async createBrand(brandData: { name: string; description?: string; manufacturer_id?: string }) {
        const { data, error } = await supabaseAdmin
            .from('brands')
            .insert(brandData)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async bulkCreateBrands(brands: { name: string; description?: string; manufacturer_id?: string }[]) {
        // Supabase supports bulk insert
        const { data, error } = await supabaseAdmin
            .from('brands')
            .insert(brands)
            .select();

        if (error) throw error;
        return data;
    }
}
