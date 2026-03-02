import { ipc } from './ipc-client';

export interface BinLocation {
  id: string;
  bin_code: string;
  warehouse?: string;
  location_name?: string;
  status: string;
}

export interface BinStockForItem {
  bin_id: string;
  bin_code: string;
  location_name: string;
  quantity: number;
  unit_of_measurement?: string;
}

export const binLocationService = {
  async getBinLocationsForItem(itemId: string): Promise<{ success: boolean; data: BinStockForItem[] }> {
    return await ipc().getBinLocationsForItem(itemId);
  },

  async getAllBinLocations(): Promise<{ success: boolean; data: BinLocation[] }> {
    return await ipc().getAllBinLocations();
  },
};
