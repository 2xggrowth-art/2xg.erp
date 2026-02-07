import { Request, Response } from 'express';
import { LocationsService } from '../services/locations.service';

const locationsService = new LocationsService();

export const getAllLocations = async (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;

    const filters = {
      status: status as string | undefined,
      search: search as string | undefined
    };

    const locations = await locationsService.getAllLocations(filters);
    res.json({ success: true, data: locations });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getLocationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const location = await locationsService.getLocationById(id);
    res.json({ success: true, data: location });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createLocation = async (req: Request, res: Response) => {
  try {
    if (!req.body.name) {
      return res.status(400).json({
        success: false,
        error: 'Location name is required'
      });
    }

    const location = await locationsService.createLocation(req.body);
    res.status(201).json({ success: true, data: location });
  } catch (error: any) {
    console.error('Error creating location:', error);

    if (error.message.includes('already exists')) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const location = await locationsService.updateLocation(id, req.body);
    res.json({ success: true, data: location });
  } catch (error: any) {
    console.error('Error updating location:', error);

    if (error.message.includes('already exists')) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const location = await locationsService.deleteLocation(id);
    res.json({ success: true, data: location });
  } catch (error: any) {
    console.error('Error deleting location:', error);

    if (error.message.includes('Cannot delete')) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.status(500).json({ success: false, error: error.message });
  }
};
