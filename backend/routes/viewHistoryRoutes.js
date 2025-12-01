import express from 'express';
import {
  recordView,
  getViewHistory,
  clearViewHistory,
} from '../controllers/viewHistoryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/', recordView);
router.get('/', getViewHistory);
router.delete('/', clearViewHistory);

export default router;

