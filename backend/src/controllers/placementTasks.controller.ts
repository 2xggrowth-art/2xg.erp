import { Request, Response } from 'express';
import placementTasksService from '../services/placementTasks.service';

export const placementTasksController = {
  async getAll(req: Request, res: Response) {
    try {
      const { status } = req.query;
      const tasks = await placementTasksService.getAll({
        status: status as string,
      });
      res.json({ success: true, data: tasks });
    } catch (error: any) {
      console.error('Error fetching placement tasks:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to fetch placement tasks' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const task = await placementTasksService.getById(id);
      if (!task) {
        return res.status(404).json({ success: false, error: 'Placement task not found' });
      }
      res.json({ success: true, data: task });
    } catch (error: any) {
      console.error('Error fetching placement task:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to fetch placement task' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const task = await placementTasksService.create(req.body);
      res.status(201).json({ success: true, data: task, message: 'Placement task created' });
    } catch (error: any) {
      console.error('Error creating placement task:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to create placement task' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const task = await placementTasksService.update(id, req.body);
      res.json({ success: true, data: task, message: 'Placement task updated' });
    } catch (error: any) {
      console.error('Error updating placement task:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to update placement task' });
    }
  },

  async createFromBill(req: Request, res: Response) {
    try {
      const { bill_id, bill_number } = req.body;
      if (!bill_id || !bill_number) {
        return res.status(400).json({ success: false, error: 'bill_id and bill_number are required' });
      }
      const tasks = await placementTasksService.createFromBill(bill_id, bill_number);
      res.status(201).json({ success: true, data: tasks, message: 'Placement tasks created from bill' });
    } catch (error: any) {
      console.error('Error creating placement tasks from bill:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to create placement tasks' });
    }
  },
};

export default placementTasksController;
