import { Router } from 'express';
import * as expensesController from '../controllers/expenses.controller';

const router = Router();

router.get('/', expensesController.getAllExpenses);
router.get('/summary', expensesController.getExpensesSummary);
router.get('/by-category', expensesController.getExpensesByCategory);
router.get('/categories', expensesController.getExpenseCategories);

export default router;
