import express from 'express';
import { getAutocomplete, getCategories, getPopularDestinations, advancedSearch, getSearchSuggestions } from '../controllers/searchController.js';
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';

const router = express.Router();

router.get('/autocomplete', cacheMiddleware(900), getAutocomplete);
router.get('/suggestions', cacheMiddleware(900), getSearchSuggestions);
router.get('/categories', cacheMiddleware(3600), getCategories);
router.get('/destinations', getPopularDestinations);
router.get('/advanced', advancedSearch);

export default router;
