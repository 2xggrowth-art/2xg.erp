import api from './api.client';

export interface Brand {
    id: string;
    name: string;
    description?: string;
}

export const brandsService = {
    getAllBrands: () => api.get<{ success: boolean; data: Brand[] }>('/brands'),
    createBrand: (data: { name: string; description?: string }) => api.post<{ success: boolean; data: Brand }>('/brands', data),
    bulkCreateBrands: (brands: { name: string; description?: string }[]) => api.post<{ success: boolean; data: Brand[] }>('/brands/bulk', { brands })
};
