import express from 'express';
import { getSettings, updateSetting, getSetting } from '../controllers/settingsController.js';
import { protect, authorize, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('Admin'), getSettings);
// Public allowlist keys; Admin can read any key (optionalAuth attaches user if token present)
router.get('/:key', optionalAuth, getSetting);
router.put('/:key', protect, authorize('Admin'), updateSetting);

export default router;
