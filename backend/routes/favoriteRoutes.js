import express from 'express';
import {
  getFavorites,
  getFavoriteLists,
  addFavorite,
  removeFavorite,
  updateFavorite,
  checkFavorite,
  shareList,
  getSharedList,
  getPriceAlerts,
} from '../controllers/favoriteController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route for shared lists
router.get('/shared/:token', getSharedList);

// Protected routes
router.get('/price-alerts', protect, getPriceAlerts);
router.post('/lists/:listName/share', protect, shareList);
router.get('/', protect, getFavorites);
router.get('/lists', protect, getFavoriteLists);
router.get('/check/:productId', protect, checkFavorite);
router.post('/', protect, addFavorite);
router.put('/:id', protect, updateFavorite);
router.delete('/:id', protect, removeFavorite);

export default router;

