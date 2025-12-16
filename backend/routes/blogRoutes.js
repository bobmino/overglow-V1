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

// Fallback handlers - always return valid responses
const fallbackCategories = (req, res) => {
  console.warn('Using fallback categories handler');
  return res.json({ categories: [] });
};

const fallbackTags = (req, res) => {
  console.warn('Using fallback tags handler');
  return res.json({ tags: [] });
};

const fallbackPosts = (req, res) => {
  console.warn('Using fallback posts handler');
  return res.json({
    posts: [],
    pagination: {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      total: 0,
      totalPages: 0,
    },
  });
};

// Error wrapper - catches all errors and returns valid responses
const safeHandler = (handler, fallback) => {
  return async (req, res, next) => {
    try {
      const result = handler(req, res, next);
      // If handler returns a promise, catch its errors
      if (result && typeof result.catch === 'function') {
        return result.catch((error) => {
          console.error('Blog handler promise error:', error);
          console.error('Error stack:', error.stack);
          // Use fallback handler to return valid response
          return fallback(req, res);
        });
      }
      return result;
    } catch (error) {
      console.error('Blog handler sync error:', error);
      console.error('Error stack:', error.stack);
      // Use fallback handler to return valid response
      return fallback(req, res);
    }
  };
};

// Public routes - always return valid responses even on error
router.get('/categories', safeHandler(getBlogCategories, fallbackCategories));
router.get('/tags', safeHandler(getBlogTags, fallbackTags));
router.get('/', safeHandler(getBlogPosts, fallbackPosts));
router.get('/:slug', safeHandler(getBlogPostBySlug, (req, res) => res.status(404).json({ message: 'Article non trouvé' })));

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
  safeHandler(createBlogPost, (req, res) => res.status(500).json({ message: 'Service non disponible' }))
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
  safeHandler(updateBlogPost, (req, res) => res.status(500).json({ message: 'Service non disponible' }))
);

router.delete('/:id', protect, authorize('Admin'), safeHandler(deleteBlogPost, (req, res) => res.status(500).json({ message: 'Service non disponible' })));
router.get('/admin/all', protect, authorize('Admin'), safeHandler(getAllBlogPosts, fallbackPosts));

export default router;
