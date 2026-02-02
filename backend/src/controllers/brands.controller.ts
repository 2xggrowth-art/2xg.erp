import { Request, Response } from 'express';
import { BrandsService } from '../services/brands.service';

const brandsService = new BrandsService();

export const getAllBrands = async (req: Request, res: Response) => {
    try {
        const brands = await brandsService.getAllBrands();
        res.json({ success: true, data: brands });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getBrandsByManufacturer = async (req: Request, res: Response) => {
    try {
        const { manufacturerId } = req.params;
        const brands = await brandsService.getBrandsByManufacturer(manufacturerId);
        res.json({ success: true, data: brands });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createBrand = async (req: Request, res: Response) => {
    try {
        const brand = await brandsService.createBrand(req.body);
        res.status(201).json({ success: true, data: brand });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const bulkCreateBrands = async (req: Request, res: Response) => {
    try {
        const { brands } = req.body;
        if (!Array.isArray(brands)) {
            return res.status(400).json({ success: false, error: 'Brands must be an array' });
        }
        const created = await brandsService.bulkCreateBrands(brands);
        res.status(201).json({ success: true, data: created });
    } catch (error: any) {
        // Handle unique constraint violations gracefully if needed, generally allow 500 for simplicty or handle specifically
        res.status(500).json({ success: false, error: error.message });
    }
};
