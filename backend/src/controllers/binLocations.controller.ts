import { Request, Response } from 'express';
import { BinLocationsService } from '../services/binLocations.service';

const binLocationsService = new BinLocationsService();

export const getAllBinLocations = async (req: Request, res: Response) => {
  try {
    const { location_id, status, search } = req.query;

    const filters = {
      location_id: location_id as string | undefined,
      status: status as string | undefined,
      search: search as string | undefined
    };

    const binLocations = await binLocationsService.getAllBinLocations(filters);
    res.json({ success: true, data: binLocations });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBinLocationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const binLocation = await binLocationsService.getBinLocationById(id);
    res.json({ success: true, data: binLocation });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createBinLocation = async (req: Request, res: Response) => {
  try {
    // Validate required fields
    if (!req.body.bin_code || !req.body.location_id) {
      return res.status(400).json({
        success: false,
        error: 'Bin code and location are required fields'
      });
    }

    const binLocation = await binLocationsService.createBinLocation(req.body);
    res.status(201).json({ success: true, data: binLocation });
  } catch (error: any) {
    console.error('Error creating bin location:', error);

    // Return 400 for duplicate bin code error
    if (error.message.includes('already exists')) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateBinLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const binLocation = await binLocationsService.updateBinLocation(id, req.body);
    res.json({ success: true, data: binLocation });
  } catch (error: any) {
    console.error('Error updating bin location:', error);

    // Return 400 for duplicate bin code error
    if (error.message.includes('already exists')) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteBinLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const binLocation = await binLocationsService.deleteBinLocation(id);
    res.json({ success: true, data: binLocation });
  } catch (error: any) {
    console.error('Error deleting bin location:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBinLocationsWithStock = async (req: Request, res: Response) => {
  try {
    const binsWithStock = await binLocationsService.getBinLocationsWithStock();
    res.json({ success: true, data: binsWithStock });
  } catch (error: any) {
    console.error('Error fetching bin locations with stock:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBinLocationsForItem = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    const binLocations = await binLocationsService.getBinLocationsForItem(itemId);
    res.json({ success: true, data: binLocations });
  } catch (error: any) {
    console.error('Error fetching bin locations for item:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
