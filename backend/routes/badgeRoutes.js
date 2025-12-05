import express from 'express';
import {
  getBadges,
  getOperatorBadges,
  getProductBadges,
  updateOperatorBadges,
  updateProductBadges,
  initializeBadges,
} from '../controllers/badgeController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getBadges);
// Get requestable badges (manual badges) - accessible to operators
router.get('/requestable', async (req, res) => {
  try {
    const { type } = req.query;
    const Badge = (await import('../models/badgeModel.js')).default;
    
    const query = { isAutomatic: false, isActive: true };
    if (type) query.type = type;

    const badges = await Badge.find(query).sort({ name: 1 });
    res.json(badges);
  } catch (error) {
    console.error('Get requestable badges error:', error);
    res.status(500).json({ message: 'Failed to fetch requestable badges' });
  }
});
router.get('/operator/:operatorId', getOperatorBadges);
router.get('/product/:productId', getProductBadges);
router.post('/update-operator/:operatorId', protect, updateOperatorBadges);
router.post('/update-product/:productId', protect, updateProductBadges);
router.post('/initialize', protect, authorize('Admin'), initializeBadges);

export default router;
