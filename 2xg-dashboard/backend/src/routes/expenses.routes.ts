import { Router } from 'express';
import * as expensesController from '../controllers/expenses.controller';
import { uploadExpenseVoucher } from '../middleware/upload.middleware';

const router = Router();

router.get('/', expensesController.getAllExpenses);
router.get('/summary', expensesController.getExpensesSummary);
router.get('/by-category', expensesController.getExpensesByCategory);
router.get('/categories', expensesController.getExpenseCategories);
router.get('/:id', expensesController.getExpenseById);
router.post('/', uploadExpenseVoucher.single('voucher'), expensesController.createExpense);

export default router;
