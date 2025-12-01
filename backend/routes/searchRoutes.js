import express from 'express';
import { getAutocomplete, getCategories, getPopularDestinations, advancedSearch } from '../controllers/searchController.js';

const router = express.Router();

router.get('/autocomplete', getAutocomplete);
router.get('/categories', getCategories);
router.get('/destinations', getPopularDestinations);
router.get('/advanced', advancedSearch);

export default router;
