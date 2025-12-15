import express from 'express';
import { body } from 'express-validator';
import {
  getFAQs,
  getFAQById,
  getFAQCategories,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  submitFAQFeedback,
} from '../controllers/faqController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Validation rules
const faqValidation = [
  body('question')
    .trim()
    .notEmpty()
    .withMessage('La question est requise')
    .isLength({ max: 500 })
    .withMessage('La question ne peut pas dépasser 500 caractères'),
  body('answer')
    .trim()
    .notEmpty()
    .withMessage('La réponse est requise')
    .isLength({ max: 5000 })
    .withMessage('La réponse ne peut pas dépasser 5000 caractères'),
  body('category')
    .optional()
    .isIn([
      'general',
      'booking',
      'payment',
      'cancellation',
      'account',
      'operator',
      'products',
      'reviews',
      'technical',
      'safety',
    ])
    .withMessage('Catégorie invalide'),
  body('language')
    .optional()
    .isIn(['fr', 'ar', 'en', 'es'])
    .withMessage('Langue invalide'),
];

// Public routes
router.get('/', getFAQs);
router.get('/categories', getFAQCategories);
router.get('/:id', getFAQById);
router.post('/:id/feedback', submitFAQFeedback);

// Admin routes
router.post('/', protect, authorize('Admin'), faqValidation, createFAQ);
router.put('/:id', protect, authorize('Admin'), faqValidation, updateFAQ);
router.delete('/:id', protect, authorize('Admin'), deleteFAQ);

export default router;

