import { Request, Response } from 'express';
import { TasksService } from '../services/tasks.service';

const tasksService = new TasksService();

export const getAllTasks = async (req: Request, res: Response) => {
  try {
    const { status, priority, assignedTo, projectId } = req.query;
    const filters = {
      status: status as string | undefined,
      priority: priority as string | undefined,
      assignedTo: assignedTo as string | undefined,
      projectId: projectId as string | undefined
    };
    const tasks = await tasksService.getAllTasks(filters);
    res.json({ success: true, data: tasks });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getTasksSummary = async (req: Request, res: Response) => {
  try {
    const summary = await tasksService.getTasksSummary();
    res.json({ success: true, data: summary });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getTasksByStatus = async (req: Request, res: Response) => {
  try {
    const data = await tasksService.getTasksByStatus();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllProjects = async (req: Request, res: Response) => {
  try {
    const projects = await tasksService.getAllProjects();
    res.json({ success: true, data: projects });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
