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

export const getExpenseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const expense = await expensesService.getExpenseById(id);
    res.json({ success: true, data: expense });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message || 'Expense not found' });
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

export const createExpense = async (req: Request, res: Response) => {
  try {
    const expenseData = req.body;

    // Convert string values to proper types (FormData sends everything as strings)
    if (expenseData.amount) {
      expenseData.amount = parseFloat(expenseData.amount);
    }

    // Handle file upload if present
    if (req.file) {
      // Store relative path for the file
      expenseData.voucher_file_url = `/uploads/expenses/${req.file.filename}`;
      expenseData.voucher_file_name = req.file.originalname;
    }

    const newExpense = await expensesService.createExpense(expenseData);
    res.status(201).json({ success: true, data: newExpense });
  } catch (error: any) {
    console.error('Error creating expense:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to create expense' });
  }
};
