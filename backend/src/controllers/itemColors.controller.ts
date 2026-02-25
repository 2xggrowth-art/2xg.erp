import { Request, Response } from 'express';
import { ItemColorsService } from '../services/itemColors.service';

const itemColorsService = new ItemColorsService();

export const getAllItemColors = async (req: Request, res: Response) => {
    try {
        const colors = await itemColorsService.getAllItemColors();
        res.json({ success: true, data: colors });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createItemColor = async (req: Request, res: Response) => {
    try {
        const color = await itemColorsService.createItemColor(req.body);
        res.status(201).json({ success: true, data: color });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteItemColor = async (req: Request, res: Response) => {
    try {
        await itemColorsService.deleteItemColor(req.params.id);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
