import express from 'express';
import { getTaxonomyTree, searchTaxonomy } from '../controllers/taxonomyController.js';

const router = express.Router();

router.get('/', getTaxonomyTree);
router.get('/search', searchTaxonomy);

export default router;
