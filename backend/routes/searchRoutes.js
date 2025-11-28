import express from 'express';
import { getAutocomplete, getCategories, getPopularDestinations } from '../controllers/searchController.js';

const router = express.Router();

router.get('/autocomplete', getAutocomplete);
router.get('/categories', getCategories);
router.get('/destinations', getPopularDestinations);

export default router;
