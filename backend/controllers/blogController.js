import Blog from '../models/blogModel.js';
import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import connectDB from '../../config/db.js';
import { logger } from '../utils/logger.js';
import { sanitizeHtml, sanitizeText, sanitizeName } from '../utils/sanitizer.js';

/** Sanitize UGC fields on blog create/update payloads. */
const sanitizeBlogPayload = (body = {}) => {
  const next = { ...body };
  if (next.title !== undefined) next.title = sanitizeName(next.title);
  if (next.content !== undefined) next.content = sanitizeHtml(next.content || '');
  if (next.excerpt !== undefined) next.excerpt = sanitizeText(next.excerpt || '');
  if (next.metaDescription !== undefined) next.metaDescription = sanitizeText(next.metaDescription || '');
  if (Array.isArray(next.tags)) next.tags = next.tags.map((t) => sanitizeText(String(t)));
  if (next.language !== undefined) {
    const lang = String(next.language).slice(0, 2).toLowerCase();
    next.language = ['fr', 'en', 'es', 'ar'].includes(lang) ? lang : 'fr';
  }
  return next;
};

const ensureDbConnected = async () => {
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    return;
  }
  logger.info('Database not connected. Attempting connection...');
  try {
    await connectDB();
  } catch (err) {
    logger.error('Failed to connect to database:', err);
  }
};

// @desc    Get all published blog posts
// @route   GET /api/blog
// @access  Public
export const getBlogPosts = async (req, res) => {
  // Always return valid response, even if everything fails
  try {
    // Check if Blog model exists
    if (!Blog) {
      logger.warn('Blog model not available, returning empty posts');
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

    await ensureDbConnected();

    const {
      category,
      tag,
      featured,
      search,
      language,
      page = 1,
      limit = 10,
      sortBy = 'publishedAt',
    } = req.query;

    const query = { isPublished: true };

    // Language filter (FAQ-style). Missing language treated as FR for legacy posts.
    const headerLang = (req.headers['accept-language'] || 'fr').toString().slice(0, 2).toLowerCase();
    const langRaw = typeof language === 'string' && language.trim()
      ? language.trim().toLowerCase().slice(0, 2)
      : headerLang;
    const lang = ['fr', 'en', 'ar', 'es'].includes(langRaw) ? langRaw : 'fr';

    if (lang === 'fr') {
      query.$and = [
        {
          $or: [
            { language: 'fr' },
            { language: { $exists: false } },
            { language: null },
          ],
        },
      ];
    } else {
      query.language = lang;
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Tag filter
    if (tag) {
      // Case-insensitive exact match to avoid tag casing issues (Eco vs eco)
      const escaped = String(tag).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.tags = { $in: [new RegExp(`^${escaped}$`, 'i')] };
    }

    // Featured filter
    if (featured === 'true') {
      query.featured = true;
    }

    // Search filter (only if text index exists)
    if (search) {
      const searchClause = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { excerpt: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } },
        ],
      };
      if (query.$and) {
        query.$and.push(searchClause);
      } else {
        Object.assign(query, searchClause);
      }
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort options
    let sort = {};
    switch (sortBy) {
      case 'views':
        sort = { views: -1 };
        break;
      case 'title':
        sort = { title: 1 };
        break;
      case 'publishedAt':
      default:
        // Sort by publishedAt, but handle null values by using createdAt as fallback
        sort = { publishedAt: -1, createdAt: -1 };
        break;
    }

    const posts = await Blog.find(query)
      .select('title slug excerpt featuredImage category tags publishedAt views readingTime featured createdAt language')
      .populate({
        path: 'author',
        select: 'name',
        strictPopulate: false
      })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean()
      .catch(err => {
        logger.error('Database query error in getBlogPosts:', err);
        return [];
      });

    const total = await Blog.countDocuments(query).catch(err => {
        logger.error('Count documents error:', err);
        return 0;
      });

    return res.json({
      posts: posts || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total || 0,
        totalPages: Math.ceil((total || 0) / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Get blog posts error:', error);
    logger.error('Error stack:', error.stack);
    // Always return a valid response, even on error
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
};

// @desc    Get blog post by slug
// @route   GET /api/blog/:slug
// @access  Public
export const getBlogPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const langRaw =
      (typeof req.query.language === 'string' && req.query.language.trim()
        ? req.query.language
        : (req.headers['accept-language'] || 'fr')
      )
        .toString()
        .trim()
        .toLowerCase()
        .slice(0, 2);
    const lang = ['fr', 'en', 'es', 'ar'].includes(langRaw) ? langRaw : 'fr';

    let post = await Blog.findOne({ slug, isPublished: true, language: lang })
      .populate({
        path: 'author',
        select: 'name email',
        strictPopulate: false
      })
      .populate({
        path: 'relatedProducts',
        select: 'title images city price',
        strictPopulate: false
      })
      .lean();

    // Legacy posts without language (treat as FR) or cross-locale slug fallback
    if (!post) {
      post = await Blog.findOne({
        slug,
        isPublished: true,
        $or: [
          { language: lang },
          ...(lang === 'fr'
            ? [{ language: { $exists: false } }, { language: null }]
            : []),
        ],
      })
        .populate({
          path: 'author',
          select: 'name email',
          strictPopulate: false
        })
        .populate({
          path: 'relatedProducts',
          select: 'title images city price',
          strictPopulate: false
        })
        .lean();
    }

    if (!post) {
      return res.status(404).json({ message: 'Article non trouvé' });
    }

    // Increment views (async, don't wait)
    Blog.findByIdAndUpdate(post._id, { $inc: { views: 1 } }).catch(err => 
      logger.error('Error incrementing views:', err)
    );

    const relatedLang = post.language || 'fr';
    const relatedPosts = await Blog.find({
      _id: { $ne: post._id },
      isPublished: true,
      language: relatedLang,
      $or: [
        { category: post.category },
        { tags: { $in: post.tags || [] } },
      ],
    })
      .select('title slug excerpt featuredImage publishedAt views readingTime language')
      .limit(3)
      .lean();

    res.json({
      ...post,
      relatedPosts,
    });
  } catch (error) {
    logger.error('Get blog post error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'article' });
  }
};

// @desc    Get blog categories
// @route   GET /api/blog/categories
// @access  Public
export const getBlogCategories = async (req, res) => {
  try {
    await ensureDbConnected();

    // Try to get categories, return empty array if collection doesn't exist or query fails
    let categories = [];
    try {
      categories = await Blog.distinct('category', { isPublished: true });
    } catch (err) {
      // If collection doesn't exist or query fails, return empty array
      // This is expected if no blog posts have been created yet
      logger.warn('Could not fetch blog categories (collection may not exist):', err.message);
      categories = [];
    }
    
    return res.json({ categories: Array.isArray(categories) ? categories : [] });
  } catch (error) {
    logger.error('Get blog categories error:', error);
    logger.error('Error stack:', error.stack);
    logger.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      mongooseState: mongoose.connection.readyState
    });
    // Always return a valid response, even on error
    return res.json({ categories: [] });
  }
};

// @desc    Get blog tags
// @route   GET /api/blog/tags
// @access  Public
export const getBlogTags = async (req, res) => {
  // Always return valid response, even if everything fails
  try {
    // Check if Blog model exists
    if (!Blog) {
      logger.warn('Blog model not available, returning empty tags');
      return res.json({ tags: [] });
    }

    await ensureDbConnected();

    // Try to get tags, return empty array if collection doesn't exist or query fails
    let tags = [];
    try {
      tags = await Blog.distinct('tags', { isPublished: true });
    } catch (err) {
      // If collection doesn't exist or query fails, return empty array
      // This is expected if no blog posts have been created yet
      logger.warn('Could not fetch blog tags (collection may not exist):', err.message);
      tags = [];
    }
    
    // Flatten and filter tags array
    const flatTags = Array.isArray(tags) ? tags.flat().filter(Boolean) : [];
    return res.json({ tags: flatTags });
  } catch (error) {
    logger.error('Get blog tags error:', error);
    logger.error('Error stack:', error.stack);
    logger.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      mongooseState: mongoose.connection?.readyState
    });
    // Always return a valid response, even on error
    return res.json({ tags: [] });
  }
};

// @desc    Create blog post
// @route   POST /api/blog
// @access  Private/Admin
export const createBlogPost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Ensure slug is generated if not provided
    let slug = req.body.slug;
    if (!slug && req.body.title) {
      slug = req.body.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      // Ensure slug is not empty
      if (!slug || slug.length === 0) {
        slug = `article-${Date.now()}`;
      }
    }

    // Check if slug already exists
    if (slug) {
      const existingPost = await Blog.findOne({ slug });
      if (existingPost) {
        // Append timestamp to make it unique
        slug = `${slug}-${Date.now()}`;
      }
    }

    const sanitized = sanitizeBlogPayload(req.body);
    const post = new Blog({
      ...sanitized,
      slug: slug || `article-${Date.now()}`,
      author: req.user._id,
    });

    const createdPost = await post.save();
    const populatedPost = await Blog.findById(createdPost._id)
      .populate({
        path: 'author',
        select: 'name email',
        strictPopulate: false
      })
      .lean();

    res.status(201).json(populatedPost);
  } catch (error) {
    logger.error('Create blog post error:', error);
    logger.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue,
      errors: error.errors,
      stack: error.stack
    });
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'slug';
      return res.status(400).json({ 
        message: `Un article avec ce ${field} existe déjà`,
        field,
        value: error.keyValue?.[field]
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors || {}).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({ 
        message: 'Erreurs de validation',
        errors: validationErrors
      });
    }
    
    res.status(500).json({ 
      message: 'Erreur lors de la création de l\'article',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update blog post
// @route   PUT /api/blog/:id
// @access  Private/Admin
export const updateBlogPost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const post = await Blog.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Article non trouvé' });
    }

    // Update fields (sanitize UGC before persistence)
    const sanitized = sanitizeBlogPayload(req.body);
    Object.keys(sanitized).forEach((key) => {
      if (sanitized[key] !== undefined) {
        post[key] = sanitized[key];
      }
    });

    const updatedPost = await post.save();
    const populatedPost = await Blog.findById(updatedPost._id)
      .populate({
        path: 'author',
        select: 'name email',
        strictPopulate: false
      })
      .lean();

    res.json(populatedPost);
  } catch (error) {
    logger.error('Update blog post error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Un article avec ce slug existe déjà' });
    }
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'article' });
  }
};

// @desc    Delete blog post
// @route   DELETE /api/blog/:id
// @access  Private/Admin
export const deleteBlogPost = async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Article non trouvé' });
    }

    await post.deleteOne();
    res.json({ message: 'Article supprimé avec succès' });
  } catch (error) {
    logger.error('Delete blog post error:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'article' });
  }
};

// @desc    Get all blog posts (admin)
// @route   GET /api/blog/admin/all
// @access  Private/Admin
export const getAllBlogPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (status === 'published') {
      query.isPublished = true;
    } else if (status === 'draft') {
      query.isPublished = false;
    }

    // Get all fields including content for admin
    const posts = await Blog.find(query)
      .populate({
        path: 'author',
        select: 'name email',
        strictPopulate: false
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Blog.countDocuments(query);

    res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Get all blog posts error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des articles' });
  }
};

// @desc    Initialize SEO blog posts (admin — idempotent by slug)
// @route   POST /api/blog/admin/initialize
// @access  Private/Admin
export const initializeBlogPosts = async (req, res) => {
  try {
    const { SEO_BLOG_SEED } = await import('../data/seoBlogSeed.js');

    let created = 0;
    let skipped = 0;

    for (const postData of SEO_BLOG_SEED) {
      const slug = postData.slug;
      const existingPost = await Blog.findOne({ slug });

      if (existingPost) {
        skipped++;
        continue;
      }

      const post = new Blog({
        ...postData,
        author: req.user._id,
        publishedAt: new Date(),
      });

      await post.save();
      created++;
    }

    const totalPosts = await Blog.countDocuments({});

    res.json({
      message: 'Articles SEO initialisés avec succès (INT-03 Wave 1)',
      created,
      skipped,
      totalPosts,
    });
  } catch (error) {
    logger.error('Initialize blog posts error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'initialisation des articles' });
  }
};

