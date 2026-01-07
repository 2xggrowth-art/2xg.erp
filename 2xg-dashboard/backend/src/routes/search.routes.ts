import { Router } from 'express';
import * as searchController from '../controllers/search.controller';

const router = Router();

router.get('/', searchController.globalSearch);
router.get('/history', searchController.getSearchHistory);
router.get('/saved', searchController.getSavedSearches);

export default router;
