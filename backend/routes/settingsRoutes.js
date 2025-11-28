import express from 'express';
import { getSettings, updateSetting, getSetting } from '../controllers/settingsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('Admin'), getSettings);
router.get('/:key', getSetting);
router.put('/:key', protect, authorize('Admin'), updateSetting);

export default router;

