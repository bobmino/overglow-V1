import express from 'express';
import { check } from 'express-validator';
import { registerUser, loginUser, getMe, updateProfile, refreshTokenHandler, logout } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post(
  '/register',
  authLimiter, // Rate limiting: 5 tentatives / 15 min
  [
    check('name', 'Name is required')
      .trim()
      .notEmpty()
      .isLength({ min: 2, max: 100 })
      .escape(),
    check('email', 'Please include a valid email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .isLength({ max: 255 }),
    check('password', 'Please enter a password with 6 or more characters')
      .isLength({ min: 6, max: 128 }),
  ],
  registerUser
);

router.post(
  '/login',
  authLimiter, // Rate limiting: 5 tentatives / 15 min
  [
    check('email', 'Please include a valid email')
      .trim()
      .isEmail()
      .normalizeEmail(),
    check('password', 'Password is required')
      .exists()
      .notEmpty(),
  ],
  loginUser
);

router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/refresh', refreshTokenHandler);
router.post('/logout', protect, logout);

export default router;
