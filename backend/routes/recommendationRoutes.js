import express from 'express';
import {
  getRecommendations,
  getSimilar,
  getTrending,
  getNewUserRecs,
} from '../controllers/recommendationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getRecommendations);
router.get('/similar/:productId', getSimilar);
router.get('/trending', getTrending);
router.get('/new-user', getNewUserRecs);

export default router;

