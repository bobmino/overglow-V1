import Product from '../models/productModel.js';
import Operator from '../models/operatorModel.js';
import Schedule from '../models/scheduleModel.js';
import Review from '../models/reviewModel.js';
import Settings from '../models/settingsModel.js';
import User from '../models/userModel.js';
import { validationResult } from 'express-validator';
import { notifyProductPending, notifyProductApproved } from '../utils/notificationService.js';

const normalizePrice = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const numericPrice = Number(value);
  return Number.isFinite(numericPrice) ? numericPrice : null;
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

    const createdProduct = await product.save();
    
    // Notify admin if product is pending review
    if (finalStatus === 'Pending Review') {
      const admins = await User.find({ role: 'Admin' });
      const adminIds = admins.map(admin => admin._id);
      await notifyProductPending(createdProduct, adminIds);
    }
    
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
    const operator = await Operator.findOne({ user: req.user._id });
    if (!operator) {
      return res.status(404).json({ message: 'Operator profile not found' });
    }

    const products = await Product.find({ operator: operator._id });
    res.json(products);
  } catch (error) {
    console.error('Get my products error:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
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
        return res.status(401).json({ message: 'Not authorized to update this product' });
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

      // Validate before saving
      const updatedProduct = await product.save();
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
      if (product.operator.toString() !== operator._id.toString()) {
        return res.status(401).json({ message: 'Not authorized to delete this product' });
      }

      await product.deleteOne();
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
  const { city, category, date } = req.query;
  let query = { status: 'Published' };

  if (city) {
    query.city = { $regex: city, $options: 'i' };
  }
  if (category) {
    query.category = category;
  }

  // Date filtering would typically involve checking schedules, which is more complex.
  // For simplicity, we'll filter products first, and if date is present, we might need aggregation or separate logic.
  // Here we just return products matching basic criteria.

  const products = await Product.find(query);
  res.json(products);
};

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('operator', 'companyName');

    if (product) {
      const schedules = await Schedule.find({ product: product._id });
      const reviews = await Review.find({ product: product._id }).populate('user', 'name');
      
      res.json({ ...product.toObject(), schedules, reviews });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
};

export {
  createProduct,
  getMyProducts,
  updateProduct,
  deleteProduct,
  getPublishedProducts,
  getProductById,
};
