import FAQ from '../models/faqModel.js';
import { validationResult } from 'express-validator';
import { logger } from '../utils/logger.js';

// @desc    Get all FAQs with filters
// @route   GET /api/faq
// @access  Public
const getFAQs = async (req, res) => {
  try {
    const { category, language, search, limit = 50, page = 1 } = req.query;
    
    const query = { isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    if (language) {
      query.language = language;
    } else {
      // Default to French if no language specified
      query.language = 'fr';
    }
    
    if (search) {
      query.$or = [
        { question: { $regex: search, $options: 'i' } },
        { answer: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const faqs = await FAQ.find(query)
      .sort({ order: 1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .select('-__v')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    const total = await FAQ.countDocuments(query);
    
    res.json({
      faqs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Get FAQs error:', error);
    res.status(500).json({ message: 'Failed to fetch FAQs' });
  }
};

// @desc    Get FAQ by ID
// @route   GET /api/faq/:id
// @access  Public
const getFAQById = async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    if (!faq || !faq.isActive) {
      return res.status(404).json({ message: 'FAQ not found' });
    }
    
    // Increment views
    faq.views += 1;
    await faq.save({ validateBeforeSave: false });
    
    res.json(faq);
  } catch (error) {
    logger.error('Get FAQ by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch FAQ' });
  }
};

// @desc    Get FAQ categories
// @route   GET /api/faq/categories
// @access  Public
const getFAQCategories = async (req, res) => {
  try {
    const { language = 'fr' } = req.query;
    
    const categories = await FAQ.aggregate([
      { $match: { isActive: true, language } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    
    const categoryLabels = {
      general: 'Général',
      booking: 'Réservation',
      payment: 'Paiement',
      cancellation: 'Annulation',
      account: 'Compte',
      operator: 'Opérateur',
      products: 'Produits',
      reviews: 'Avis',
      technical: 'Technique',
      safety: 'Sécurité',
    };
    
    const formattedCategories = categories.map((cat) => ({
      value: cat._id,
      label: categoryLabels[cat._id] || cat._id,
      count: cat.count,
    }));
    
    res.json(formattedCategories);
  } catch (error) {
    logger.error('Get FAQ categories error:', error);
    res.status(500).json({ message: 'Failed to fetch FAQ categories' });
  }
};

// @desc    Create FAQ (Admin only)
// @route   POST /api/faq
// @access  Private/Admin
const createFAQ = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const {
      question,
      answer,
      category,
      subcategory,
      tags,
      language,
      order,
    } = req.body;
    
    const faq = await FAQ.create({
      question,
      answer,
      category,
      subcategory,
      tags: tags || [],
      language: language || 'fr',
      order: order || 0,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });
    
    res.status(201).json(faq);
  } catch (error) {
    logger.error('Create FAQ error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.keys(error.errors).map((key) => ({
          field: key,
          message: error.errors[key].message,
        })),
      });
    }
    res.status(500).json({ message: 'Failed to create FAQ' });
  }
};

// @desc    Update FAQ (Admin only)
// @route   PUT /api/faq/:id
// @access  Private/Admin
const updateFAQ = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const faq = await FAQ.findById(req.params.id);
    
    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found' });
    }
    
    const {
      question,
      answer,
      category,
      subcategory,
      tags,
      language,
      order,
      isActive,
    } = req.body;
    
    if (question !== undefined) faq.question = question;
    if (answer !== undefined) faq.answer = answer;
    if (category !== undefined) faq.category = category;
    if (subcategory !== undefined) faq.subcategory = subcategory;
    if (tags !== undefined) faq.tags = tags;
    if (language !== undefined) faq.language = language;
    if (order !== undefined) faq.order = order;
    if (isActive !== undefined) faq.isActive = isActive;
    
    faq.updatedBy = req.user._id;
    await faq.save();
    
    res.json(faq);
  } catch (error) {
    logger.error('Update FAQ error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.keys(error.errors).map((key) => ({
          field: key,
          message: error.errors[key].message,
        })),
      });
    }
    res.status(500).json({ message: 'Failed to update FAQ' });
  }
};

// @desc    Delete FAQ (Admin only)
// @route   DELETE /api/faq/:id
// @access  Private/Admin
const deleteFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    
    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found' });
    }
    
    await faq.deleteOne();
    
    res.json({ message: 'FAQ deleted successfully' });
  } catch (error) {
    logger.error('Delete FAQ error:', error);
    res.status(500).json({ message: 'Failed to delete FAQ' });
  }
};

// @desc    Mark FAQ as helpful/not helpful
// @route   POST /api/faq/:id/feedback
// @access  Public
const submitFAQFeedback = async (req, res) => {
  try {
    const { helpful } = req.body;
    const faq = await FAQ.findById(req.params.id);
    
    if (!faq || !faq.isActive) {
      return res.status(404).json({ message: 'FAQ not found' });
    }
    
    if (helpful === true) {
      faq.helpful += 1;
    } else if (helpful === false) {
      faq.notHelpful += 1;
    }
    
    await faq.save({ validateBeforeSave: false });
    
    res.json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    logger.error('Submit FAQ feedback error:', error);
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
};

// @desc    Initialize default FAQs (idempotent)
// @route   POST /api/faq/admin/initialize
// @access  Private/Admin
const initializeFAQs = async (req, res) => {
  try {
    const { FAQ_SEED } = await import('../data/faqSeed.js');
    const { ensureSafeTextIndexes } = await import('../utils/fixTextLanguageIndex.js');
    await ensureSafeTextIndexes(FAQ, 'faq_text_search', {
      question: 'text',
      answer: 'text',
    });
    let created = 0;
    let skipped = 0;

    for (const item of FAQ_SEED) {
      const existing = await FAQ.findOne({
        question: item.question,
        language: item.language,
      });
      if (existing) {
        skipped += 1;
        continue;
      }
      await FAQ.create({
        ...item,
        isActive: true,
        createdBy: req.user._id,
        updatedBy: req.user._id,
      });
      created += 1;
    }

    const total = await FAQ.countDocuments({});
    res.json({
      message: 'FAQ initialisées',
      created,
      skipped,
      total,
    });
  } catch (error) {
    logger.error('Initialize FAQs error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'initialisation des FAQ' });
  }
};

// @desc    Admin list all FAQs (including inactive)
// @route   GET /api/faq/admin/all
// @access  Private/Admin
const getAdminFAQs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const language = typeof req.query.language === 'string' ? req.query.language.slice(0, 2) : '';
    const filter = {};
    if (language && ['fr', 'en', 'es', 'ar'].includes(language)) {
      filter.language = language;
    }
    const [faqs, total] = await Promise.all([
      FAQ.find(filter)
        .sort({ language: 1, order: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      FAQ.countDocuments(filter),
    ]);
    res.json({
      faqs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    logger.error('Get admin FAQs error:', error);
    res.status(500).json({ message: 'Failed to fetch FAQs' });
  }
};

export {
  getFAQs,
  getFAQById,
  getFAQCategories,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  submitFAQFeedback,
  initializeFAQs,
  getAdminFAQs,
};

