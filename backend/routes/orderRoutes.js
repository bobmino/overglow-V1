import express from 'express';
import { checkout, getMyOrders } from '../controllers/orderController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/orders/checkout
// Accessible par les utilisateurs connectés ET les invités (optionalAuth)
router.post('/checkout', optionalAuth, checkout);

// GET /api/orders/my-orders
// Réservé aux utilisateurs connectés
router.get('/my-orders', protect, getMyOrders);

export default router;
