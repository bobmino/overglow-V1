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

// @desc    Initialize default blog posts (admin only - one-time setup)
// @route   POST /api/blog/admin/initialize
// @access  Private/Admin
export const initializeBlogPosts = async (req, res) => {
  try {
    const samplePosts = [
      {
        title: 'Les 10 meilleures destinations au Maroc pour 2025',
        excerpt: 'Découvrez les destinations les plus tendances du Maroc pour votre prochaine aventure. De Marrakech à Chefchaouen, explorez les perles cachées du royaume.',
        content: `
          <h2>Introduction</h2>
          <p>Le Maroc continue d'être une destination de choix pour les voyageurs en quête d'authenticité, de culture riche et de paysages époustouflants. En 2025, certaines destinations marocaines se démarquent particulièrement.</p>
          
          <h2>1. Marrakech - La Perle du Sud</h2>
          <p>Marrakech reste incontournable avec sa médina animée, ses palais historiques et sa place Jemaa el-Fnaa, classée au patrimoine mondial de l'UNESCO.</p>
          
          <h2>2. Chefchaouen - La Ville Bleue</h2>
          <p>Niché dans les montagnes du Rif, Chefchaouen séduit par ses ruelles bleues et son atmosphère paisible. Parfait pour une escapade reposante.</p>
          
          <h2>3. Fès - La Capitale Spirituelle</h2>
          <p>Fès abrite la plus ancienne médina du monde arabe et offre un voyage dans le temps à travers ses souks traditionnels et ses médersas.</p>
          
          <h2>Conclusion</h2>
          <p>Que vous recherchiez l'aventure, la culture ou la détente, le Maroc a quelque chose à offrir à chaque voyageur. Planifiez votre voyage avec Overglow Trip pour une expérience authentique et mémorable.</p>
        `,
        category: 'Destinations',
        tags: ['Maroc', 'Voyage', 'Destinations', 'Tourisme'],
        featured: true,
        isPublished: true,
        metaTitle: 'Les 10 meilleures destinations au Maroc 2025',
        metaDescription: 'Découvrez les destinations les plus tendances du Maroc pour 2025. Guide complet avec conseils pratiques et recommandations.',
        keywords: ['Maroc', 'destinations', 'voyage', 'tourisme', 'Marrakech', 'Chefchaouen'],
        relatedDestinations: ['Marrakech', 'Chefchaouen', 'Fès', 'Casablanca'],
      },
      {
        title: 'Comment voyager de manière responsable au Maroc',
        excerpt: 'Conseils pratiques pour un tourisme durable et respectueux de l\'environnement et des communautés locales au Maroc.',
        content: `
          <h2>Pourquoi voyager responsable ?</h2>
          <p>Le tourisme responsable au Maroc permet de préserver les sites culturels, soutenir les communautés locales et minimiser l'impact environnemental.</p>
          
          <h2>Conseils pratiques</h2>
          <ul>
            <li>Choisissez des opérateurs locaux certifiés</li>
            <li>Respectez les coutumes et traditions</li>
            <li>Évitez le gaspillage d'eau</li>
            <li>Privilégiez les transports durables</li>
            <li>Soutenez l'artisanat local</li>
          </ul>
          
          <h2>Impact positif</h2>
          <p>En voyageant de manière responsable, vous contribuez directement au développement économique local et à la préservation du patrimoine marocain.</p>
        `,
        category: 'Conseils de voyage',
        tags: ['Tourisme responsable', 'Développement durable', 'Éthique'],
        featured: true,
        isPublished: true,
        metaTitle: 'Tourisme responsable au Maroc - Guide pratique',
        metaDescription: 'Découvrez comment voyager de manière responsable au Maroc avec nos conseils pratiques pour un tourisme durable.',
        keywords: ['tourisme responsable', 'développement durable', 'Maroc', 'voyage éthique'],
      },
      {
        title: 'Guide complet : Organiser votre premier voyage solo au Maroc',
        excerpt: 'Tout ce que vous devez savoir pour partir en toute sécurité et profiter pleinement de votre première aventure solo au Maroc.',
        content: `
          <h2>Pourquoi voyager solo au Maroc ?</h2>
          <p>Le Maroc est une destination idéale pour les voyageurs solo grâce à sa sécurité, son hospitalité légendaire et ses nombreuses activités adaptées.</p>
          
          <h2>Préparations essentielles</h2>
          <ul>
            <li>Renseignez-vous sur les coutumes locales</li>
            <li>Apprenez quelques mots d'arabe ou de français</li>
            <li>Préparez votre itinéraire à l'avance</li>
            <li>Informez vos proches de votre localisation</li>
          </ul>
          
          <h2>Conseils de sécurité</h2>
          <p>Le Maroc est généralement sûr pour les voyageurs solo, mais restez vigilant dans les zones touristiques et évitez de vous promener seul la nuit dans les médinas.</p>
          
          <h2>Expériences recommandées</h2>
          <p>Participez à des visites guidées, séjournez dans des riads traditionnels et n'hésitez pas à interagir avec les locaux pour une expérience authentique.</p>
        `,
        category: 'Guides pratiques',
        tags: ['Voyage solo', 'Sécurité', 'Conseils'],
        featured: false,
        isPublished: true,
        metaTitle: 'Voyage solo au Maroc - Guide complet 2025',
        metaDescription: 'Guide complet pour organiser votre premier voyage solo au Maroc. Conseils pratiques, sécurité et recommandations.',
        keywords: ['voyage solo', 'Maroc', 'sécurité', 'guide voyage'],
      },
    ];

    // Helper function to generate slug from title
    const generateSlug = (title) => {
      return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    };

    let created = 0;
    let skipped = 0;

    for (const postData of samplePosts) {
      const slug = generateSlug(postData.title);
      
      // Check if post with this slug already exists
      const existingPost = await Blog.findOne({ slug });
      
      if (existingPost) {
        skipped++;
        continue;
      }

      const post = new Blog({
        ...postData,
        slug,
        author: req.user._id,
        publishedAt: new Date(),
      });
      
      await post.save();
      created++;
    }

    const totalPosts = await Blog.countDocuments({});

    res.json({
      message: 'Articles de blog initialisés avec succès',
      created,
      skipped,
      totalPosts,
    });
  } catch (error) {
    console.error('Initialize blog posts error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'initialisation des articles' });
  }
};

