import Blog from '../models/blogModel.js';
import mongoose from 'mongoose';
import { validationResult } from 'express-validator';

// @desc    Get all published blog posts
// @route   GET /api/blog
// @access  Public
export const getBlogPosts = async (req, res) => {
  // Always return valid response, even if everything fails
  try {
    // Check if Blog model exists
    if (!Blog) {
      console.warn('Blog model not available, returning empty posts');
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

    // Check MongoDB connection
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      console.warn('MongoDB not connected, returning empty posts');
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

    const {
      category,
      tag,
      featured,
      search,
      page = 1,
      limit = 10,
      sortBy = 'publishedAt',
    } = req.query;

    const query = { isPublished: true };

    // Category filter
    if (category) {
      query.category = category;
    }

    // Tag filter
    if (tag) {
      query.tags = { $in: [tag] };
    }

    // Featured filter
    if (featured === 'true') {
      query.featured = true;
    }

    // Search filter (only if text index exists)
    if (search) {
      // Use regex search instead of $text to avoid index requirement
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
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
      .select('title slug excerpt featuredImage category tags publishedAt views readingTime featured createdAt')
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
        console.error('Database query error in getBlogPosts:', err);
        return [];
      });

    const total = await Blog.countDocuments(query).catch(err => {
        console.error('Count documents error:', err);
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
    console.error('Get blog posts error:', error);
    console.error('Error stack:', error.stack);
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

    const post = await Blog.findOne({ slug, isPublished: true })
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

    if (!post) {
      return res.status(404).json({ message: 'Article non trouvé' });
    }

    // Increment views (async, don't wait)
    Blog.findByIdAndUpdate(post._id, { $inc: { views: 1 } }).catch(err => 
      console.error('Error incrementing views:', err)
    );

    // Get related posts
    const relatedPosts = await Blog.find({
      _id: { $ne: post._id },
      isPublished: true,
      $or: [
        { category: post.category },
        { tags: { $in: post.tags } },
      ],
    })
      .select('title slug excerpt featuredImage publishedAt views readingTime')
      .limit(3)
      .lean();

    res.json({
      ...post,
      relatedPosts,
    });
  } catch (error) {
    console.error('Get blog post error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'article' });
  }
};

// @desc    Get blog categories
// @route   GET /api/blog/categories
// @access  Public
export const getBlogCategories = async (req, res) => {
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.warn('MongoDB not connected, returning empty categories');
      return res.json({ categories: [] });
    }

    // Try to get categories, return empty array if collection doesn't exist or query fails
    let categories = [];
    try {
      categories = await Blog.distinct('category', { isPublished: true });
    } catch (err) {
      // If collection doesn't exist or query fails, return empty array
      // This is expected if no blog posts have been created yet
      console.warn('Could not fetch blog categories (collection may not exist):', err.message);
      categories = [];
    }
    
    return res.json({ categories: Array.isArray(categories) ? categories : [] });
  } catch (error) {
    console.error('Get blog categories error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
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
      console.warn('Blog model not available, returning empty tags');
      return res.json({ tags: [] });
    }

    // Check MongoDB connection
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      console.warn('MongoDB not connected, returning empty tags');
      return res.json({ tags: [] });
    }

    // Try to get tags, return empty array if collection doesn't exist or query fails
    let tags = [];
    try {
      tags = await Blog.distinct('tags', { isPublished: true });
    } catch (err) {
      // If collection doesn't exist or query fails, return empty array
      // This is expected if no blog posts have been created yet
      console.warn('Could not fetch blog tags (collection may not exist):', err.message);
      tags = [];
    }
    
    // Flatten and filter tags array
    const flatTags = Array.isArray(tags) ? tags.flat().filter(Boolean) : [];
    return res.json({ tags: flatTags });
  } catch (error) {
    console.error('Get blog tags error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
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

    const post = new Blog({
      ...req.body,
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
    console.error('Create blog post error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Un article avec ce slug existe déjà' });
    }
    res.status(500).json({ message: 'Erreur lors de la création de l\'article' });
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

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        post[key] = req.body[key];
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
    console.error('Update blog post error:', error);
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
    console.error('Delete blog post error:', error);
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
    console.error('Get all blog posts error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des articles' });
  }
};

