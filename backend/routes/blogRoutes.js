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

// Error wrapper to catch all errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error('Blog route error:', error);
    console.error('Error stack:', error.stack);
    // Always return a valid response
    if (req.path === '/categories') {
      return res.json({ categories: [] });
    }
    if (req.path === '/tags') {
      return res.json({ tags: [] });
    }
    if (req.path === '/' || !req.path.includes('/')) {
      return res.json({
        posts: [],
        pagination: {
          page: parseInt(req.query.page) || 1,
          limit: parseInt(req.query.limit) || 10,
          total: 0,
          totalPages: 0,
        },
      });
    }
    next(error);
  });
};

// Public routes with error handling
router.get('/', asyncHandler(getBlogPosts));
router.get('/categories', asyncHandler(getBlogCategories));
router.get('/tags', asyncHandler(getBlogTags));
router.get('/:slug', asyncHandler(getBlogPostBySlug));

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

