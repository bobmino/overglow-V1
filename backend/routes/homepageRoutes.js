import express from 'express';
import { getHomepageLayout } from '../controllers/homepageController.js';
import { cache } from '../middleware/cacheMiddleware.js';

const router = express.Router();

// Cache homepage layout for 5 minutes (300s)
// Homepage data changes infrequently; cache ensures TTFB < 5ms on warm hits
router.get('/layout', cache(300), getHomepageLayout);

export default router;
