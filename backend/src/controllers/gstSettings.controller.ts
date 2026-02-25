import { Request, Response } from 'express';
import { gstSettingsService } from '../services/gstSettings.service';

export const getGstSettings = async (req: Request, res: Response) => {
  try {
    const settings = await gstSettingsService.getSettings();
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateGstSettings = async (req: Request, res: Response) => {
  try {
    const settings = await gstSettingsService.updateSettings(req.body);
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
