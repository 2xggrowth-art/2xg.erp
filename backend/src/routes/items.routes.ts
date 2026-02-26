import { Router } from 'express';
import { requireRole } from '../middleware/auth.middleware';
import * as itemsController from '../controllers/items.controller';

const router = Router();

router.get('/', itemsController.getAllItems);
router.get('/categories', itemsController.getCategories);
router.post('/categories', requireRole('Admin', 'Manager'), itemsController.createCategory);
router.delete('/categories/:id', requireRole('Admin', 'Manager'), itemsController.deleteCategory);
router.get('/categories/:categoryId/subcategories', itemsController.getSubcategories);
router.post('/categories/:categoryId/subcategories', requireRole('Admin', 'Manager'), itemsController.createSubcategory);
router.get('/subcategories', itemsController.getAllSubcategories);
router.delete('/subcategories/:id', requireRole('Admin', 'Manager'), itemsController.deleteSubcategory);
router.get('/generate-sku', itemsController.generateSku);
router.get('/summary', itemsController.getItemsSummary);
router.get('/top-selling', itemsController.getTopSellingItems);
router.get('/export', itemsController.exportItems);
router.post('/import', requireRole('Admin', 'Manager'), itemsController.importItems);
router.post('/import/validate', requireRole('Admin', 'Manager'), itemsController.validateImportData);
router.post('/import/google-sheets', requireRole('Admin', 'Manager'), itemsController.importFromGoogleSheets);
router.get('/barcode/:barcode', itemsController.getItemByBarcode);
router.get('/:id/bins', itemsController.getItemBins);
router.get('/:id', itemsController.getItemById);
router.post('/', requireRole('Admin', 'Manager'), itemsController.createItem);
router.put('/:id', requireRole('Admin', 'Manager'), itemsController.updateItem);
router.delete('/:id', requireRole('Admin', 'Manager'), itemsController.deleteItem);

export default router;
