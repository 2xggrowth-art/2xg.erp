import api from './api.client';

export interface ItemSize {
    id: string;
    name: string;
}

export const itemSizesService = {
    getAllItemSizes: () => api.get<{ success: boolean; data: ItemSize[] }>('/item-sizes'),
    createItemSize: (data: { name: string }) => api.post<{ success: boolean; data: ItemSize }>('/item-sizes', data),
    deleteItemSize: (id: string) => api.delete<{ success: boolean }>(`/item-sizes/${id}`),
};
