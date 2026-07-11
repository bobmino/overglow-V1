import express from 'express';
import { cache } from '../middleware/cacheMiddleware.js';
import { getAboutPage, getCulturePage, getContentLangs } from '../controllers/contentController.js';

const router = express.Router();

router.get('/langs', cache(3600), getContentLangs);
router.get('/about', cache(900), getAboutPage);
router.get('/culture', cache(900), getCulturePage);

export default router;
