import { Request, Response } from 'express';
import { ManufacturersService } from '../services/manufacturers.service';

const manufacturersService = new ManufacturersService();

export const getAllManufacturers = async (req: Request, res: Response) => {
    try {
        const manufacturers = await manufacturersService.getAllManufacturers();
        res.json({ success: true, data: manufacturers });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createManufacturer = async (req: Request, res: Response) => {
    try {
        const manufacturer = await manufacturersService.createManufacturer(req.body);
        res.status(201).json({ success: true, data: manufacturer });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const bulkCreateManufacturers = async (req: Request, res: Response) => {
    try {
        const { manufacturers } = req.body;
        if (!Array.isArray(manufacturers)) {
            return res.status(400).json({ success: false, error: 'Manufacturers must be an array' });
        }
        const created = await manufacturersService.bulkCreateManufacturers(manufacturers);
        res.status(201).json({ success: true, data: created });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
