import api from './api.client';

export interface Brand {
    id: string;
    name: string;
    description?: string;
    manufacturer_id?: string;
    manufacturer_name?: string;
}

export const brandsService = {
    getAllBrands: () => api.get<{ success: boolean; data: Brand[] }>('/brands'),
    getBrandsByManufacturer: (manufacturerId: string) => api.get<{ success: boolean; data: Brand[] }>(`/brands/by-manufacturer/${manufacturerId}`),
    createBrand: (data: { name: string; description?: string; manufacturer_id?: string }) => api.post<{ success: boolean; data: Brand }>('/brands', data),
    bulkCreateBrands: (brands: { name: string; description?: string; manufacturer_id?: string }[]) => api.post<{ success: boolean; data: Brand[] }>('/brands/bulk', { brands })
};
