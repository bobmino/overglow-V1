import mongoose from 'mongoose';
import Product from '../models/productModel.js';
import Operator from '../models/operatorModel.js';
import Schedule from '../models/scheduleModel.js';
import Review from '../models/reviewModel.js';
import Settings from '../models/settingsModel.js';
import User from '../models/userModel.js';
import { validationResult } from 'express-validator';
import { notifyProductPending, notifyProductApproved } from '../utils/notificationService.js';
import { updateProductMetrics, updateOperatorMetrics } from '../utils/badgeService.js';
import crypto from 'crypto';
import { clearCache } from '../middleware/cacheMiddleware.js';
import {
  parseFilterParams,
  buildPublishedProductQuery,
  buildSortOption,
  matchesDurationFilter,
} from '../services/productFilterService.js';
import { localizeProducts, localizeProduct, resolveRequestLang } from '../utils/contentI18n.js';
import { buildProductI18n } from '../utils/catalogLexicon.js';

import connectDB from '../../config/db.js';

const ensureDbConnected = async () => {
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    return;
  }
  console.log('Database not connected. Attempting connection...');
  try {
    await connectDB();
  } catch (err) {
    console.error('Failed to connect to database:', err);
  }
};

const normalizePrice = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const numericPrice = Number(value);
  return Number.isFinite(numericPrice) ? numericPrice : null;
};

const slugify = (input) => {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const buildSeoFields = (payload) => {
  const baseTitle = payload.metaTitle || payload.title;
  const baseDescription = payload.metaDescription || payload.description || '';
  const ogImage = payload.ogImage || payload.imageUrl || (Array.isArray(payload.images) ? payload.images[0] : '');
  return {
    metaTitle: String(baseTitle || '').slice(0, 70),
    metaDescription: String(baseDescription || '').slice(0, 160),
    ogTitle: String(payload.ogTitle || baseTitle || '').slice(0, 70),
    ogDescription: String(payload.ogDescription || baseDescription || '').slice(0, 200),
    ogImage: ogImage || '',
  };
};

const isValidImageUrl = (value) => {
  try {
    const parsed = new URL(String(value || ''));
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildDefaultSchedules = ({ productId, price, startDate = new Date() }) => {
  const entries = [];
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 3);

  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  while (current <= endDate) {
    entries.push({
      product: productId,
      date: new Date(current),
      time: '10:00',
      endTime: '13:00',
      capacity: 20,
      price,
      currency: 'EUR',
    });
    current.setDate(current.getDate() + 1);
  }
  return entries;
};

const getOrCreatePlaceholderOperator = async ({ operatorName = 'Placeholder Partner', operatorEmail }) => {
  const normalizedOperatorName = operatorName || 'Placeholder Partner';
  const syntheticEmail = operatorEmail || `placeholder_${slugify(normalizedOperatorName)}_${Date.now()}@overglow.local`;

  let user = await User.findOne({ email: syntheticEmail });
  if (!user) {
    user = await User.create({
      name: normalizedOperatorName,
      email: syntheticEmail,
      password: crypto.randomBytes(16).toString('hex'),
      role: 'Opérateur',
      isApproved: true,
      approvedAt: new Date(),
    });
  }

  let operator = await Operator.findOne({ user: user._id });
  if (!operator) {
    operator = await Operator.create({
      user: user._id,
      companyName: normalizedOperatorName,
      description: 'Placeholder operator auto-created by import pipeline',
      status: 'Active',
      isFormCompleted: false,
      isClaimed: false,
    });
  }

  return operator;
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Operator
const createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Admin can create products directly, operators need to be Active
    let operator;
    if (req.user.role === 'Admin') {
      // Admin can create products for any operator
      // If operatorId is provided in body, use it
      if (req.body.operatorId) {
        operator = await Operator.findById(req.body.operatorId);
        if (!operator) {
          return res.status(404).json({ message: 'Operator not found' });
        }
      } else {
        // Admin creating system product - we'll handle this differently
        // For now, return error - admin should specify operator
        return res.status(400).json({ message: 'Admin must specify operatorId when creating products' });
      }
    } else {
      operator = await Operator.findOne({ user: req.user._id });
      if (!operator) {
        return res.status(404).json({ message: 'Operator profile not found' });
      }
      // Check if operator is Active (approved)
      if (operator.status !== 'Active') {
        return res.status(403).json({ message: 'Your operator account is not yet approved. Please wait for admin approval.' });
      }
    }

    const {
      title,
      description,
      category,
      city,
      address,
      duration,
      price,
      location,
      images,
      highlights,
      included,
      requirements,
      requiresInquiry,
      inquiryType,
      timeSlots,
      status
    } = req.body;

    const normalizedPrice = normalizePrice(price);
    let finalStatus = status || 'Draft';

    if (normalizedPrice === null) {
      return res.status(400).json({ message: 'Price must be a valid number' });
    }

    if (finalStatus === 'Published' && normalizedPrice <= 0) {
      return res.status(400).json({ message: 'Published products must have a price greater than 0' });
    }

    // Check auto-approval settings
    if (finalStatus === 'Published') {
      // Admin products are always published automatically
      if (req.user.role === 'Admin') {
        finalStatus = 'Published';
      } else {
        // Check operator-specific auto-approval first, then global setting
        const operatorAutoApprove = operator.autoApproveProducts === true;
        const globalAutoApproveSetting = await Settings.findOne({ key: 'autoApproveProducts' });
        const globalAutoApprove = globalAutoApproveSetting ? globalAutoApproveSetting.value : false;
        
        // Auto-approve if operator has auto-approve enabled OR (global setting is enabled and operator is Active)
        if (operatorAutoApprove || (globalAutoApprove && operator.status === 'Active')) {
          finalStatus = 'Published';
        } else {
          finalStatus = 'Pending Review';
        }
      }
    }

    const product = new Product({
      operator: operator._id,
      title,
      description,
      category,
      city,
      address,
      duration,
      price: normalizedPrice,
      location,
      images,
      highlights: Array.isArray(highlights) ? highlights : [],
      included: Array.isArray(included) ? included : [],
      requirements: Array.isArray(requirements) ? requirements : [],
      requiresInquiry: requiresInquiry || false,
      inquiryType: inquiryType || 'none',
      timeSlots: Array.isArray(timeSlots) ? timeSlots : [],
      status: finalStatus,
      user: req.user._id,
    });

    // Auto-generate catalogue i18n from FR source (lexicon-based)
    product.i18n = buildProductI18n(product);

    const createdProduct = await product.save();
    
    // Notify admin if product is pending review
    if (finalStatus === 'Pending Review') {
      const admins = await User.find({ role: 'Admin' });
      const adminIds = admins.map(admin => admin._id);
      await notifyProductPending(createdProduct, adminIds);
    }
    
    // Invalidate cache for search and product listings
    await clearCache('cache:*');
    
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
};

// @desc    Get my products
// @route   GET /api/products/my-products
// @access  Private/Operator
const getMyProducts = async (req, res) => {
  try {
    await ensureDbConnected();

    const operator = await Operator.findOne({ user: req.user._id });
    if (!operator) {
      return res.status(404).json({ message: 'Operator profile not found' });
    }

    const products = await Product.find({ operator: operator._id });
    res.json(products);
  } catch (error) {
    console.error('Get my products error:', error);
    // Return empty list to keep operator dashboard usable even if something transient fails
    res.json([]);
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Operator
const updateProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      category,
      city,
      address,
      duration,
      price,
      location,
      images,
      highlights,
      included,
      requirements,
      requiresInquiry,
      inquiryType,
      timeSlots,
      status
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Admin can update any product, operators can only update their own
    let operator;
    if (req.user.role === 'Admin') {
      // Admin can update any product - no operator check needed
      operator = await Operator.findById(product.operator);
    } else {
      operator = await Operator.findOne({ user: req.user._id });
      if (!operator) {
        return res.status(404).json({ message: 'Operator profile not found' });
      }
      
      // Check if operator is Active (approved)
      if (operator.status !== 'Active') {
        return res.status(403).json({ message: 'Your operator account is not yet approved. Please wait for admin approval.' });
      }

      if (product.operator.toString() !== operator._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this product' });
      }
    }

      const normalizedPrice = price !== undefined ? normalizePrice(price) : null;
      const nextPrice = normalizedPrice !== null ? normalizedPrice : product.price;
      let nextStatus = status || product.status;

      if (normalizedPrice === null && price !== undefined) {
        return res.status(400).json({ message: 'Price must be a valid number' });
      }

      if (nextStatus === 'Published' && (!Number.isFinite(nextPrice) || nextPrice <= 0)) {
        return res.status(400).json({ message: 'Published products must have a price greater than 0' });
      }

      // Check auto-approval settings when updating to Published
      if (nextStatus === 'Published' && product.status !== 'Published') {
        // Admin products are always published automatically
        if (req.user.role === 'Admin') {
          nextStatus = 'Published';
        } else {
          // Check operator-specific auto-approval first, then global setting
          const operatorAutoApprove = operator.autoApproveProducts === true;
          const globalAutoApproveSetting = await Settings.findOne({ key: 'autoApproveProducts' });
          const globalAutoApprove = globalAutoApproveSetting ? globalAutoApproveSetting.value : false;
          
          // Auto-approve if operator has auto-approve enabled OR (global setting is enabled and operator is Active)
          if (operatorAutoApprove || (globalAutoApprove && operator.status === 'Active')) {
            nextStatus = 'Published';
          } else {
            nextStatus = 'Pending Review';
          }
        }
      }

      // Update fields only if provided, otherwise keep existing values
      if (title !== undefined) product.title = title;
      if (description !== undefined) product.description = description;
      if (category !== undefined) product.category = category;
      if (city !== undefined) product.city = city;
      if (address !== undefined) product.address = address;
      if (duration !== undefined) product.duration = duration;
      product.price = nextPrice;
      if (location !== undefined) product.location = location;
      if (images !== undefined) product.images = images;
      if (highlights !== undefined) product.highlights = Array.isArray(highlights) ? highlights : product.highlights;
      if (included !== undefined) product.included = Array.isArray(included) ? included : product.included;
      if (requirements !== undefined) product.requirements = Array.isArray(requirements) ? requirements : product.requirements;
      if (requiresInquiry !== undefined) product.requiresInquiry = requiresInquiry;
      if (inquiryType !== undefined) product.inquiryType = inquiryType;
      if (timeSlots !== undefined) {
        // Validate and clean timeSlots
        if (Array.isArray(timeSlots)) {
          // Filter out invalid timeSlots (must have startTime and endTime)
          const validTimeSlots = timeSlots.filter(slot => 
            slot && 
            typeof slot === 'object' && 
            slot.startTime && 
            slot.endTime &&
            typeof slot.startTime === 'string' &&
            typeof slot.endTime === 'string'
          );
          product.timeSlots = validTimeSlots;
        } else {
          product.timeSlots = product.timeSlots || [];
        }
      }
      product.status = nextStatus;

      // Rebuild multilingual fields when core copy changes
      if (title !== undefined || description !== undefined || highlights !== undefined || included !== undefined || requirements !== undefined) {
        product.i18n = buildProductI18n(product);
      }

      // Validate before saving
      const updatedProduct = await product.save();
      
      // Update product metrics and badges (async, don't wait)
      updateProductMetrics(product._id).catch(err => console.error('Error updating product metrics:', err));
      if (operator) {
        updateOperatorMetrics(operator._id).catch(err => console.error('Error updating operator metrics:', err));
      }
      
      // Invalidate cache
      await clearCache('cache:*');
      
      res.json(updatedProduct);
  } catch (error) {
    console.error('Update product error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to update product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Operator
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      const operator = await Operator.findOne({ user: req.user._id });
      if (!operator || product.operator.toString() !== operator._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to delete this product' });
      }

      await product.deleteOne();
      
      // Invalidate cache
      await clearCache('cache:*');
      
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
};

// @desc    Get published products (public search)
// @route   GET /api/products
// @access  Public
const getPublishedProducts = async (req, res) => {
  try {
    await ensureDbConnected();

    const filters = parseFilterParams(req.query);
    const mongoQuery = buildPublishedProductQuery(filters);
    const sort = buildSortOption(filters.sortBy);
    const skip = (filters.page - 1) * filters.limit;

    // Duration filter requires post-fetch when present
    const needsDurationFilter = filters.durations.length > 0;

    let products = await Product.find(mongoQuery)
      .select('title images city category price duration operator badges skipTheLine metrics tags createdAt')
      .populate('operator', 'companyName status')
      .populate('badges.badgeId', 'name icon color')
      .sort(sort)
      .lean();

    if (needsDurationFilter) {
      products = products.filter((p) => matchesDurationFilter(p.duration, filters.durations));
    }

    const total = products.length;
    const pageProducts = products.slice(skip, skip + filters.limit);
    const lang = resolveRequestLang(req);

    res.json({
      products: localizeProducts(pageProducts, lang),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit) || 1,
      },
      appliedFilters: filters,
      lang,
    });
  } catch (error) {
    console.error('Get published products error:', error);
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    return res.json({
      products: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
    });
  }
};

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const productIdentifier = req.params.id;
    if (!productIdentifier) {
      return res.status(400).json({ message: 'Invalid product identifier' });
    }

    // Support both ObjectId and slug for SEO routes like /experiences/:slug
    let product = mongoose.Types.ObjectId.isValid(productIdentifier)
      ? await Product.findById(productIdentifier).lean()
      : await Product.findOne({ slug: productIdentifier }).lean();
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Populate operator separately with error handling
    try {
      const operator = await Operator.findById(product.operator)
        .select('companyName status isClaimed')
        .lean();
      product.operator = operator || null;
    } catch (err) {
      console.error('Error populating operator:', err);
      product.operator = null;
    }

    // Populate badges separately with error handling
    if (product.badges && Array.isArray(product.badges) && product.badges.length > 0) {
      try {
        const Badge = (await import('../models/badgeModel.js')).default;
        const badgeIds = product.badges
          .map(b => b.badgeId)
          .filter(id => id && mongoose.Types.ObjectId.isValid(id));
        
        if (badgeIds.length > 0) {
          const badges = await Badge.find({ _id: { $in: badgeIds } }).lean();
          const badgeMap = new Map(badges.map(b => [b._id.toString(), b]));
          
          product.badges = product.badges.map(badge => ({
            ...badge,
            badgeId: badge.badgeId && badgeMap.has(badge.badgeId.toString()) 
              ? badgeMap.get(badge.badgeId.toString())
              : null
          }));
        }
      } catch (err) {
        console.error('Error populating badges:', err);
        // Keep badges array but with null badgeId
        product.badges = product.badges.map(badge => ({
          ...badge,
          badgeId: null
        }));
      }
    }

    // Fetch schedules and reviews in parallel
    // CORRECTION: Filtrer les schedules passés pour ne retourner que les futurs
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    
    const [schedules, reviews] = await Promise.all([
      Schedule.find({
        product: product._id,
        date: { $gte: twoHoursAgo.toISOString().split('T')[0] } // Filtrer les dates passées
      }).lean().catch(err => {
        console.error('Error fetching schedules:', err);
        return [];
      }),
      Review.find({ product: product._id })
        .populate('user', 'name')
        .lean()
        .catch(err => {
          console.error('Error fetching reviews:', err);
          return [];
        })
    ]);
    
    // Update product badges if needed (async, don't wait)
    try {
      const { updateProductMetrics } = await import('../utils/badgeService.js');
      updateProductMetrics(product._id).catch(err => 
        console.error('Badge update error:', err)
      );
    } catch (err) {
      // Silently fail if badgeService can't be imported
      console.error('Error importing badgeService:', err);
    }
    
    res.json({ 
      ...localizeProduct(product, resolveRequestLang(req)), 
      schedules: Array.isArray(schedules) ? schedules : [], 
      reviews: Array.isArray(reviews) ? reviews : [] 
    });
  } catch (error) {
    // Log detailed error information
    console.error('Get product error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      productId: req.params.id,
      path: req.path
    });
    
    // Handle specific error types
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }
    
    res.status(500).json({ 
      message: 'Failed to fetch product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Secure webhook import for AI pipelines
// @route   POST /api/products/webhook/import
// @access  Private/Admin (JWT) + optional X-API-KEY if IMPORT_WEBHOOK_API_KEY is set
const webhookImportProduct = async (req, res) => {
  try {
    // [TASK-1] JWT Admin déjà validé par protect + authorize('Admin').
    // Défense en profondeur : si une clé webhook est configurée, elle est aussi exigée.
    if (process.env.IMPORT_WEBHOOK_API_KEY) {
      const apiKey = req.headers['x-api-key'];
      if (apiKey !== process.env.IMPORT_WEBHOOK_API_KEY) {
        return res.status(401).json({ success: false, message: 'Unauthorized webhook key' });
      }
    }

    const {
      title,
      description,
      price,
      city,
      gps,
      imageUrl,
      operatorName,
      operatorEmail,
      category = 'Experiences',
      address,
      duration = '3 hours',
      slug,
      metaTitle,
      metaDescription,
      ogTitle,
      ogDescription,
      ogImage,
      status = 'Published',
    } = req.body || {};

    if (!title || !description || !price || !city || !gps || !imageUrl) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    if (!isValidImageUrl(imageUrl)) {
      return res.status(400).json({ success: false, message: 'Invalid image URL' });
    }

    const normalizedPrice = normalizePrice(price);
    if (normalizedPrice === null || normalizedPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid price' });
    }

    const coordinates = Array.isArray(gps)
      ? gps
      : [Number(gps.lng), Number(gps.lat)];
    if (!Array.isArray(coordinates) || coordinates.length !== 2 || coordinates.some((n) => !Number.isFinite(Number(n)))) {
      return res.status(400).json({ success: false, message: 'Invalid GPS coordinates' });
    }

    const operator = await getOrCreatePlaceholderOperator({ operatorName, operatorEmail });
    const resolvedSlug = slug || `${slugify(title)}-${Date.now()}`;
    const seo = buildSeoFields({ title, description, imageUrl, metaTitle, metaDescription, ogTitle, ogDescription, ogImage });

    const normalizedStatus = String(status || 'Published').toLowerCase() === 'active' ? 'Published' : (status || 'Published');
    let product = await Product.findOne({ slug: resolvedSlug });
    let schedulesCreated = 0;
    let operation = 'updated';

    if (product) {
      product.price = normalizedPrice;
      product.description = description;
      product.images = [imageUrl];
      product.seo = seo;
      product.location = {
        type: 'Point',
        coordinates: [Number(coordinates[0]), Number(coordinates[1])],
      };
      await product.save();
    } else {
      product = await Product.create({
        operator: operator._id,
        title,
        slug: resolvedSlug,
        description,
        category,
        city,
        address: address || city,
        duration,
        price: normalizedPrice,
        location: {
          type: 'Point',
          coordinates: [Number(coordinates[0]), Number(coordinates[1])],
        },
        images: [imageUrl],
        status: normalizedStatus,
        seo,
      });
      const schedules = buildDefaultSchedules({ productId: product._id, price: normalizedPrice });
      await Schedule.insertMany(schedules);
      schedulesCreated = schedules.length;
      operation = 'created';
    }

    // Clear cache upon successful import
    await clearCache('cache:*');

    return res.status(201).json({
      success: true,
      operation,
      productId: product._id,
      slug: product.slug,
      schedulesCreated,
    });
  } catch (error) {
    console.error('Webhook import product error:', error);
    return res.status(500).json({ success: false, message: 'Import failed' });
  }
};

// @desc    Clear cache manually via webhook
// @route   POST /api/products/webhook/clear-cache
// @access  Private via X-API-KEY
const clearCacheWebhook = async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!process.env.IMPORT_WEBHOOK_API_KEY || apiKey !== process.env.IMPORT_WEBHOOK_API_KEY) {
    return res.status(401).json({ success: false, message: 'Unauthorized webhook key' });
  }

  try {
    await clearCache('cache:*');
    return res.json({ success: true, message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Clear cache error:', error);
    return res.status(500).json({ success: false, message: 'Failed to clear cache' });
  }
};

export {
  createProduct,
  getMyProducts,
  updateProduct,
  deleteProduct,
  getPublishedProducts,
  getProductById,
  webhookImportProduct,
  clearCacheWebhook,
};
