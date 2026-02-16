import { Request, Response } from 'express';
import transferTasksService from '../services/transferTasks.service';

export const transferTasksController = {
  async getAll(req: Request, res: Response) {
    try {
      const { status, assigned_to } = req.query;
      const tasks = await transferTasksService.getAll({
        status: status as string,
        assigned_to: assigned_to as string,
      });
      res.json({ success: true, data: tasks });
    } catch (error: any) {
      console.error('Error fetching transfer tasks:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to fetch transfer tasks' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const task = await transferTasksService.getById(id);
      if (!task) {
        return res.status(404).json({ success: false, error: 'Transfer task not found' });
      }
      res.json({ success: true, data: task });
    } catch (error: any) {
      console.error('Error fetching transfer task:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to fetch transfer task' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const task = await transferTasksService.create(req.body);
      res.status(201).json({ success: true, data: task, message: 'Transfer task created' });
    } catch (error: any) {
      console.error('Error creating transfer task:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to create transfer task' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const task = await transferTasksService.update(id, req.body);
      res.json({ success: true, data: task, message: 'Transfer task updated' });
    } catch (error: any) {
      console.error('Error updating transfer task:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to update transfer task' });
    }
  },

  async createFromTransferOrder(req: Request, res: Response) {
    try {
      const { transfer_order_id } = req.body;
      if (!transfer_order_id) {
        return res.status(400).json({ success: false, error: 'transfer_order_id is required' });
      }
      const tasks = await transferTasksService.createFromTransferOrder(transfer_order_id);
      res.status(201).json({ success: true, data: tasks, message: 'Transfer tasks created from order' });
    } catch (error: any) {
      console.error('Error creating transfer tasks:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to create transfer tasks' });
    }
  },
};

export default transferTasksController;
