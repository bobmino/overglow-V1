import Blog from '../models/blogModel.js';
import { validationResult } from 'express-validator';

// @desc    Get all published blog posts
// @route   GET /api/blog
// @access  Public
export const getBlogPosts = async (req, res) => {
  try {
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

    // Search filter
    if (search) {
      query.$text = { $search: search };
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
        sort = { publishedAt: -1 };
        break;
    }

    const posts = await Blog.find(query)
      .select('title slug excerpt featuredImage category tags publishedAt views readingTime featured')
      .populate('author', 'name')
      .sort(sort)
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
    console.error('Get blog posts error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des articles' });
  }
};

// @desc    Get blog post by slug
// @route   GET /api/blog/:slug
// @access  Public
export const getBlogPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const post = await Blog.findOne({ slug, isPublished: true })
      .populate('author', 'name email')
      .populate('relatedProducts', 'title images city price')
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
    const categories = await Blog.distinct('category', { isPublished: true });
    res.json({ categories });
  } catch (error) {
    console.error('Get blog categories error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des catégories' });
  }
};

// @desc    Get blog tags
// @route   GET /api/blog/tags
// @access  Public
export const getBlogTags = async (req, res) => {
  try {
    const tags = await Blog.distinct('tags', { isPublished: true });
    res.json({ tags: tags.filter(Boolean) });
  } catch (error) {
    console.error('Get blog tags error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des tags' });
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
      .populate('author', 'name email')
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
      .populate('author', 'name email')
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
      .populate('author', 'name email')
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

