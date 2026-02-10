import { Router } from 'express';
import * as expensesController from '../controllers/expenses.controller';
import { uploadExpenseVoucher } from '../middleware/upload.middleware';

const router = Router();

router.get('/', expensesController.getAllExpenses);
router.get('/summary', expensesController.getExpensesSummary);
router.get('/by-category', expensesController.getExpensesByCategory);
router.get('/categories', expensesController.getExpenseCategories);
router.post('/categories', expensesController.createExpenseCategory);
router.delete('/categories/:id', expensesController.deleteExpenseCategory);
router.get('/:id', expensesController.getExpenseById);
router.delete('/:id', expensesController.deleteExpense);
router.post('/', ...uploadExpenseVoucher.single('voucher'), expensesController.createExpense);

export default router;
