import express from 'express';
import {
  getBlogPosts,
  getBlogPostBySlug,
  getBlogCategories,
  getBlogTags,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  getAllBlogPosts,
} from '../controllers/blogController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { body } from 'express-validator';

const router = express.Router();

// Public routes
router.get('/', getBlogPosts);
router.get('/categories', getBlogCategories);
router.get('/tags', getBlogTags);
router.get('/:slug', getBlogPostBySlug);

// Admin routes
router.post(
  '/',
  protect,
  authorize('Admin'),
  [
    body('title').trim().notEmpty().withMessage('Le titre est requis'),
    body('excerpt').trim().notEmpty().withMessage('Le résumé est requis'),
    body('content').trim().notEmpty().withMessage('Le contenu est requis'),
    body('category').isIn([
      'Destinations',
      'Conseils de voyage',
      'Culture',
      'Gastronomie',
      'Aventures',
      'Actualités',
      'Guides pratiques',
    ]).withMessage('Catégorie invalide'),
  ],
  createBlogPost
);

router.put(
  '/:id',
  protect,
  authorize('Admin'),
  [
    body('title').optional().trim().notEmpty(),
    body('excerpt').optional().trim().notEmpty(),
    body('content').optional().trim().notEmpty(),
  ],
  updateBlogPost
);

router.delete('/:id', protect, authorize('Admin'), deleteBlogPost);
router.get('/admin/all', protect, authorize('Admin'), getAllBlogPosts);

export default router;

