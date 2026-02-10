import { Router } from 'express';
import { BatchesController } from '../controllers/batches.controller';

const router = Router();
const batchesController = new BatchesController();

// Get all batches for an item
router.get('/item/:itemId', batchesController.getBatchesForItem);

// Get a single batch by ID
router.get('/:id', batchesController.getBatchById);

// Get deductions for a batch
router.get('/:id/deductions', batchesController.getBatchDeductions);

export default router;
