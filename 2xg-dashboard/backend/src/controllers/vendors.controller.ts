import { Request, Response } from 'express';
import { VendorsService } from '../services/vendors.service';

const vendorsService = new VendorsService();

export const getAllVendors = async (req: Request, res: Response) => {
  try {
    const { isActive, search } = req.query;

    const filters = {
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search: search as string | undefined
    };

    const vendors = await vendorsService.getAllVendors(filters);
    res.json({ success: true, data: vendors });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getVendorsSummary = async (req: Request, res: Response) => {
  try {
    const summary = await vendorsService.getVendorsSummary();
    res.json({ success: true, data: summary });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getVendorById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vendor = await vendorsService.getVendorById(id);
    res.json({ success: true, data: vendor });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createVendor = async (req: Request, res: Response) => {
  try {
    console.log('Creating vendor with data:', req.body);
    const vendor = await vendorsService.createVendor(req.body);
    console.log('Vendor created successfully:', vendor);
    res.status(201).json({ success: true, data: vendor });
  } catch (error: any) {
    console.error('Error creating vendor:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateVendor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vendor = await vendorsService.updateVendor(id, req.body);
    res.json({ success: true, data: vendor });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteVendor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vendor = await vendorsService.deleteVendor(id);
    res.json({ success: true, data: vendor });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
