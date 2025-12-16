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
  initializeBlogPosts,
} from '../controllers/blogController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { body } from 'express-validator';

const router = express.Router();

// Fallback handlers - ALWAYS return valid responses, NEVER throw errors
const fallbackCategories = (req, res) => {
  console.warn('[BLOG] Using fallback categories handler');
  return res.status(200).json({ categories: [] });
};

const fallbackTags = (req, res) => {
  console.warn('[BLOG] Using fallback tags handler');
  return res.status(200).json({ tags: [] });
};

const fallbackPosts = (req, res) => {
  console.warn('[BLOG] Using fallback posts handler');
  return res.status(200).json({
    posts: [],
    pagination: {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      total: 0,
      totalPages: 0,
    },
  });
};

// Ultra-safe error wrapper - catches EVERYTHING and returns valid responses
const ultraSafeHandler = (handler, fallback) => {
  return (req, res, next) => {
    // Wrap in try-catch for sync errors
    try {
      // Call handler and catch promise rejections
      const result = handler(req, res, next);
      
      // If it's a promise, catch errors
      if (result && typeof result.catch === 'function') {
        return result.catch((error) => {
          console.error('[BLOG] Handler promise error:', error?.message || error);
          console.error('[BLOG] Error stack:', error?.stack);
          // Use fallback - NEVER let error propagate
          try {
            return fallback(req, res);
          } catch (fallbackError) {
            console.error('[BLOG] Even fallback failed!', fallbackError);
            // Last resort - send minimal valid response
            return res.status(200).json({});
          }
        });
      }
      
      // If handler already sent response, return
      if (res.headersSent) {
        return;
      }
      
      return result;
    } catch (error) {
      console.error('[BLOG] Handler sync error:', error?.message || error);
      console.error('[BLOG] Error stack:', error?.stack);
      // Use fallback - NEVER let error propagate
      try {
        return fallback(req, res);
      } catch (fallbackError) {
        console.error('[BLOG] Even fallback failed!', fallbackError);
        // Last resort - send minimal valid response
        return res.status(200).json({});
      }
    }
  };
};

// Public routes - ALWAYS return valid responses, NEVER 500 errors
router.get('/categories', ultraSafeHandler(getBlogCategories, fallbackCategories));
router.get('/tags', ultraSafeHandler(getBlogTags, fallbackTags));
router.get('/', ultraSafeHandler(getBlogPosts, fallbackPosts));
router.get('/:slug', ultraSafeHandler(getBlogPostBySlug, (req, res) => res.status(404).json({ message: 'Article non trouvé' })));

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
  ultraSafeHandler(createBlogPost, (req, res) => res.status(500).json({ message: 'Service non disponible' }))
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
  ultraSafeHandler(updateBlogPost, (req, res) => res.status(500).json({ message: 'Service non disponible' }))
);

router.delete('/:id', protect, authorize('Admin'), ultraSafeHandler(deleteBlogPost, (req, res) => res.status(500).json({ message: 'Service non disponible' })));
router.get('/admin/all', protect, authorize('Admin'), ultraSafeHandler(getAllBlogPosts, fallbackPosts));
router.post('/admin/initialize', protect, authorize('Admin'), ultraSafeHandler(initializeBlogPosts, (req, res) => res.status(500).json({ message: 'Service non disponible' })));

export default router;
