import { Request, Response } from 'express';
import { ItemSizesService } from '../services/itemSizes.service';

const itemSizesService = new ItemSizesService();

export const getAllItemSizes = async (req: Request, res: Response) => {
    try {
        const sizes = await itemSizesService.getAllItemSizes();
        res.json({ success: true, data: sizes });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createItemSize = async (req: Request, res: Response) => {
    try {
        const size = await itemSizesService.createItemSize(req.body);
        res.status(201).json({ success: true, data: size });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteItemSize = async (req: Request, res: Response) => {
    try {
        await itemSizesService.deleteItemSize(req.params.id);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
