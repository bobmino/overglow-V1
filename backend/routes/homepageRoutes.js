import express from 'express';
import { getHomepageLayout } from '../controllers/homepageController.js';
import { cache } from '../middleware/cacheMiddleware.js';

const router = express.Router();

router.get('/layout', cache(900), getHomepageLayout);

export default router;
