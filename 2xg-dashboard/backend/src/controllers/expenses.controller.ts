import { Request, Response } from 'express';
import { ExpensesService } from '../services/expenses.service';

const expensesService = new ExpensesService();

export const getAllExpenses = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const expenses = await expensesService.getAllExpenses(startDate as string, endDate as string);
    res.json({ success: true, data: expenses });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getExpensesSummary = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const summary = await expensesService.getExpensesSummary(startDate as string, endDate as string);
    res.json({ success: true, data: summary });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getExpensesByCategory = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await expensesService.getExpensesByCategory(startDate as string, endDate as string);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getExpenseCategories = async (req: Request, res: Response) => {
  try {
    const categories = await expensesService.getExpenseCategories();
    res.json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
