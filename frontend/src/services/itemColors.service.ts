import api from './api.client';

export interface ItemColor {
    id: string;
    name: string;
}

export const itemColorsService = {
    getAllItemColors: () => api.get<{ success: boolean; data: ItemColor[] }>('/item-colors'),
    createItemColor: (data: { name: string }) => api.post<{ success: boolean; data: ItemColor }>('/item-colors', data),
    deleteItemColor: (id: string) => api.delete<{ success: boolean }>(`/item-colors/${id}`),
};
