import api from './api.client';

export interface Manufacturer {
    id: string;
    name: string;
    description?: string;
}

export const manufacturersService = {
    getAllManufacturers: () => api.get<{ success: boolean; data: Manufacturer[] }>('/manufacturers'),
    createManufacturer: (data: { name: string; description?: string }) => api.post<{ success: boolean; data: Manufacturer }>('/manufacturers', data),
    bulkCreateManufacturers: (manufacturers: { name: string; description?: string }[]) => api.post<{ success: boolean; data: Manufacturer[] }>('/manufacturers/bulk', { manufacturers })
};
