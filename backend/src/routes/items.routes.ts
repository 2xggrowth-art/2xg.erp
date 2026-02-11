import { Router } from 'express';
import * as itemsController from '../controllers/items.controller';

const router = Router();

router.get('/', itemsController.getAllItems);
router.get('/categories', itemsController.getCategories);
router.post('/categories', itemsController.createCategory);
router.delete('/categories/:id', itemsController.deleteCategory);
router.get('/categories/:categoryId/subcategories', itemsController.getSubcategories);
router.post('/categories/:categoryId/subcategories', itemsController.createSubcategory);
router.get('/subcategories', itemsController.getAllSubcategories);
router.delete('/subcategories/:id', itemsController.deleteSubcategory);
router.get('/generate-sku', itemsController.generateSku);
router.get('/summary', itemsController.getItemsSummary);
router.get('/top-selling', itemsController.getTopSellingItems);
router.get('/export', itemsController.exportItems);
router.post('/import', itemsController.importItems);
router.post('/import/validate', itemsController.validateImportData);
router.post('/import/google-sheets', itemsController.importFromGoogleSheets);
router.get('/barcode/:barcode', itemsController.getItemByBarcode);
router.get('/:id', itemsController.getItemById);
router.post('/', itemsController.createItem);
router.put('/:id', itemsController.updateItem);
router.delete('/:id', itemsController.deleteItem);

export default router;
