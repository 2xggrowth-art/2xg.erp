import { supabaseAdmin } from '../config/supabase';
import { DateRangeParams } from '../types';

export class TasksService {
  /**
   * Get all tasks
   */
  async getAllTasks(filters?: {
    status?: string;
    priority?: string;
    assignedTo?: string;
    projectId?: string;
  }) {
    let query = supabaseAdmin
      .from('tasks')
      .select(`
        *,
        projects (name)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }
    if (filters?.projectId) {
      query = query.eq('project_id', filters.projectId);
    }

    const { data, error} = await query;
    if (error) throw error;
    return data;
  }

  /**
   * Get tasks summary
   */
  async getTasksSummary() {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select('status, priority, due_date, progress_percentage');

    if (error) throw error;

    const totalTasks = data.length;
    const todoTasks = data.filter(t => t.status === 'todo').length;
    const inProgressTasks = data.filter(t => t.status === 'in_progress').length;
    const completedTasks = data.filter(t => t.status === 'completed').length;
    const overdueTasks = data.filter(t =>
      t.status !== 'completed' && t.due_date && new Date(t.due_date) < new Date()
    ).length;
    const averageProgress = data.reduce((sum, t) => sum + (t.progress_percentage || 0), 0) / totalTasks;

    return {
      totalTasks,
      todoTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
      averageProgress: Math.round(averageProgress)
    };
  }

  /**
   * Get tasks by status
   */
  async getTasksByStatus() {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select('status');

    if (error) throw error;

    const statusMap = new Map<string, number>();

    data.forEach((task: any) => {
      const count = statusMap.get(task.status) || 0;
      statusMap.set(task.status, count + 1);
    });

    return Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count
    }));
  }

  /**
   * Get projects
   */
  async getAllProjects() {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Get task comments
   */
  async getTaskComments(taskId: string) {
    const { data, error } = await supabaseAdmin
      .from('task_comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}
