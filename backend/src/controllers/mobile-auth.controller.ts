import { Request, Response } from 'express';
import { MobileAuthService } from '../services/mobile-auth.service';

const mobileAuthService = new MobileAuthService();

export const mobileLogin = async (req: Request, res: Response) => {
  try {
    const { phone_number, pin } = req.body;

    if (!phone_number || !pin) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and PIN are required'
      });
    }

    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        error: 'PIN must be 4 digits'
      });
    }

    const result = await mobileAuthService.login(phone_number, pin);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Mobile login error:', error.message);
    res.status(401).json({
      success: false,
      error: error.message || 'Authentication failed'
    });
  }
};

export const verifyMobileToken = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    const user = await mobileAuthService.verifyToken(token);

    res.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error.message || 'Invalid token'
    });
  }
};

export const getMobileUsers = async (req: Request, res: Response) => {
  try {
    const users = await mobileAuthService.getAllUsers();
    res.json({
      success: true,
      data: users
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch users'
    });
  }
};

export const createMobileUser = async (req: Request, res: Response) => {
  try {
    const { phone_number, pin, employee_name, employee_id, branch } = req.body;

    if (!phone_number || !pin || !employee_name) {
      return res.status(400).json({
        success: false,
        error: 'Phone number, PIN, and employee name are required'
      });
    }

    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        error: 'PIN must be 4 digits'
      });
    }

    const user = await mobileAuthService.createUser({
      phone_number,
      pin,
      employee_name,
      employee_id,
      branch
    });

    res.status(201).json({
      success: true,
      data: user,
      message: 'Mobile user created successfully'
    });
  } catch (error: any) {
    console.error('Create mobile user error:', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create user'
    });
  }
};

export const updateMobileUserPin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({
        success: false,
        error: 'New PIN is required'
      });
    }

    const user = await mobileAuthService.updatePin(id, pin);

    res.json({
      success: true,
      data: user,
      message: 'PIN updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update PIN'
    });
  }
};
