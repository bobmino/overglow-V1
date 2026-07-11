import express from 'express';
import { getAutocomplete, getCategories, getPopularDestinations, advancedSearch, getSearchSuggestions, getSearchFacets } from '../controllers/searchController.js';
import { cache } from '../middleware/cacheMiddleware.js';

const router = express.Router();

router.get('/autocomplete', cache(900), getAutocomplete);
router.get('/suggestions', cache(900), getSearchSuggestions);
router.get('/categories', cache(3600), getCategories);
router.get('/destinations', getPopularDestinations);
router.get('/facets', cache(600), getSearchFacets);
router.get('/advanced', advancedSearch);

export default router;
