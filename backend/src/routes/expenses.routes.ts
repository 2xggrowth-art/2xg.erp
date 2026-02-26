import { Router } from 'express';
import * as expensesController from '../controllers/expenses.controller';
import { uploadExpenseVoucher } from '../middleware/upload.middleware';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', expensesController.getAllExpenses);
router.get('/summary', expensesController.getExpensesSummary);
router.get('/by-category', expensesController.getExpensesByCategory);
router.get('/categories', expensesController.getExpenseCategories);
router.post('/categories', requireRole('Admin', 'Manager'), expensesController.createExpenseCategory);
router.delete('/categories/:id', requireRole('Admin', 'Manager'), expensesController.deleteExpenseCategory);
router.get('/:id', expensesController.getExpenseById);
router.delete('/:id', requireRole('Admin', 'Manager'), expensesController.deleteExpense);
router.post('/', ...uploadExpenseVoucher.single('voucher'), expensesController.createExpense);

export default router;
