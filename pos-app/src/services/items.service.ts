import { ipc } from './ipc-client';

export interface Item {
  id: string;
  item_name: string;
  sku: string;
  unit_price: number;
  cost_price: number;
  current_stock: number;
  unit_of_measurement: string;
  category_id?: string;
  subcategory_id?: string;
  item_type?: string;
  size?: string;
  color?: string;
  variant?: string;
  barcode?: string;
  hsn_code?: string;
  tax_rate: number;
  is_active: boolean;
  image_url?: string;
}

export const itemsService = {
  async searchItems(query: string): Promise<Item[]> {
    const result = await ipc().searchItems(query);
    return result.success ? result.data : [];
  },

  async getAllItems(): Promise<Item[]> {
    const result = await ipc().getAllItems();
    return result.success ? result.data : [];
  },

  async getItemById(id: string): Promise<Item | null> {
    const result = await ipc().getItemById(id);
    return result.success ? result.data : null;
  },
};
