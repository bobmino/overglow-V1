import express from 'express';
import { logger } from '../utils/logger.js';
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
import { body, param, validationResult } from 'express-validator';

const router = express.Router();

// Fallback handlers - ALWAYS return valid responses, NEVER throw errors
const fallbackCategories = (req, res) => {
  logger.warn('[BLOG] Using fallback categories handler');
  return res.status(200).json({ categories: [] });
};

const fallbackTags = (req, res) => {
  logger.warn('[BLOG] Using fallback tags handler');
  return res.status(200).json({ tags: [] });
};

const fallbackPosts = (req, res) => {
  logger.warn('[BLOG] Using fallback posts handler');
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
    try {
      const result = handler(req, res, next);

      if (result && typeof result.catch === 'function') {
        return result.catch((error) => {
          logger.error('[BLOG] Handler promise error:', error?.message || error);
          try {
            return fallback(req, res);
          } catch (fallbackError) {
            logger.error('[BLOG] Even fallback failed!', fallbackError);
            return res.status(200).json({});
          }
        });
      }

      if (res.headersSent) {
        return;
      }

      return result;
    } catch (error) {
      logger.error('[BLOG] Handler sync error:', error?.message || error);
      try {
        return fallback(req, res);
      } catch (fallbackError) {
        logger.error('[BLOG] Even fallback failed!', fallbackError);
        return res.status(200).json({});
      }
    }
  };
};

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  return next();
};

// [TASK-7] Slug: lowercase alphanumerics + hyphens only (blocks reserved "admin")
const slugValidation = [
  param('slug')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug invalide')
    .custom((value) => {
      if (value === 'admin') {
        throw new Error('Slug réservé');
      }
      return true;
    }),
  handleValidation,
];

// Public static routes
router.get('/categories', ultraSafeHandler(getBlogCategories, fallbackCategories));
router.get('/tags', ultraSafeHandler(getBlogTags, fallbackTags));
router.get('/', ultraSafeHandler(getBlogPosts, fallbackPosts));

// [TASK-7] Admin routes MUST be registered BEFORE /:slug
router.get('/admin/all', protect, authorize('Admin'), ultraSafeHandler(getAllBlogPosts, fallbackPosts));
router.post(
  '/admin/initialize',
  protect,
  authorize('Admin'),
  ultraSafeHandler(initializeBlogPosts, (req, res) => res.status(500).json({ message: 'Service non disponible' }))
);

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

router.delete(
  '/:id',
  protect,
  authorize('Admin'),
  ultraSafeHandler(deleteBlogPost, (req, res) => res.status(500).json({ message: 'Service non disponible' }))
);

// Public slug route LAST (after /admin/*)
router.get(
  '/:slug',
  slugValidation,
  ultraSafeHandler(getBlogPostBySlug, (req, res) => res.status(404).json({ message: 'Article non trouvé' }))
);

export default router;
