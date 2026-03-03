import { Request, Response } from 'express';
import { RegistersService } from '../services/registers.service';

const registersService = new RegistersService();

export class RegistersController {
  /**
   * Get all registers
   */
  getAllRegisters = async (req: Request, res: Response) => {
    try {
      const registers = await registersService.getAllRegisters(
        (req as any).user?.organizationId
      );

      res.json({
        success: true,
        data: registers,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch registers',
      });
    }
  };

  /**
   * Create a new register
   */
  createRegister = async (req: Request, res: Response) => {
    try {
      const { name } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Register name is required',
        });
      }

      const register = await registersService.createRegister(
        req.body,
        (req as any).user?.organizationId
      );

      res.status(201).json({
        success: true,
        data: register,
        message: 'Register created successfully',
      });
    } catch (error: any) {
      console.error('Error creating register:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create register',
      });
    }
  };

  /**
   * Update a register
   */
  updateRegister = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const register = await registersService.updateRegister(id, req.body);

      res.json({
        success: true,
        data: register,
        message: 'Register updated successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update register',
      });
    }
  };

  /**
   * Soft delete a register
   */
  deleteRegister = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const register = await registersService.deleteRegister(id);

      res.json({
        success: true,
        data: register,
        message: 'Register deactivated successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete register',
      });
    }
  };
}
