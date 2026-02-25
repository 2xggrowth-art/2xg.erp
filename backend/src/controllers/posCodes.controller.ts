import { Request, Response } from 'express';
import { PosCodesService } from '../services/posCodes.service';

const posCodesService = new PosCodesService();

export const getAllPosCodes = async (req: Request, res: Response) => {
  try {
    const codes = await posCodesService.getAllPosCodes();
    res.json({ success: true, data: codes });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createPosCode = async (req: Request, res: Response) => {
  try {
    const { code, employee_name } = req.body;
    if (!code || !employee_name) {
      return res.status(400).json({ success: false, error: 'Code and employee name are required' });
    }
    const result = await posCodesService.createPosCode({ code, employee_name });
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'This code already exists' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updatePosCode = async (req: Request, res: Response) => {
  try {
    const result = await posCodesService.updatePosCode(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'This code already exists' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deletePosCode = async (req: Request, res: Response) => {
  try {
    await posCodesService.deletePosCode(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const verifyPosCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: 'Code is required' });
    }
    const result = await posCodesService.verifyCode(code);
    if (!result) {
      return res.status(401).json({ success: false, error: 'Invalid code' });
    }
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
