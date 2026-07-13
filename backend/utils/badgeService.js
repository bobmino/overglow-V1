import Badge from '../models/badgeModel.js';
import Operator from '../models/operatorModel.js';
import Product from '../models/productModel.js';
import Review from '../models/reviewModel.js';
import Booking from '../models/bookingModel.js';
import Inquiry from '../models/inquiryModel.js';
import { logger } from './logger.js';

/**
 * Calculate operator metrics and update badges
 */
export const updateOperatorMetrics = async (operatorId) => {
  try {
    const operator = await Operator.findById(operatorId);
    if (!operator) return;

    // Get all products for this operator
    const products = await Product.find({ operator: operatorId });
    
    // Get all bookings
    const bookings = await Booking.find({ 
      operator: operatorId,
      status: { $ne: 'Cancelled' }
    });

    // Get all reviews for operator's products
    const productIds = products.map(p => p._id);
    const reviews = await Review.find({ 
      product: { $in: productIds },
      status: 'Approved'
    });

    // Calculate metrics
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || b.totalAmount || 0), 0);
    
    // Calculate average rating
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    // Calculate average response time (from inquiries)
    const inquiries = await Inquiry.find({ 
      product: { $in: productIds },
      status: { $in: ['answered', 'approved'] }
    });
    
    let responseTime = null;
    if (inquiries.length > 0) {
      const responseTimes = inquiries
        .filter(i => i.answeredAt && i.createdAt)
        .map(i => {
          const diff = new Date(i.answeredAt) - new Date(i.createdAt);
          return diff / (1000 * 60 * 60); // Convert to hours
        });
      
      if (responseTimes.length > 0) {
        responseTime = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;
      }
    }

    // Calculate completion rate
    const completedBookings = bookings.filter(b => b.status === 'Confirmed').length;
    const completionRate = totalBookings > 0 
      ? (completedBookings / totalBookings) * 100 
      : 100;

    // Update operator metrics
    operator.metrics = {
      totalBookings,
      totalRevenue,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews: reviews.length,
      responseTime: responseTime ? Math.round(responseTime * 10) / 10 : null,
      completionRate: Math.round(completionRate),
      isVerified: operator.status === 'Active',
      isLocal: operator.location?.country === 'Morocco' || operator.location?.country === 'Maroc',
    };

    await operator.save();

    // Update badges
    await assignOperatorBadges(operatorId);
  } catch (error) {
    logger.error('Error updating operator metrics:', error);
  }
};

/**
 * Calculate product metrics and update badges
 */
export const updateProductMetrics = async (productId) => {
  try {
    const product = await Product.findById(productId);
    if (!product) return;

    // Get reviews
    const reviews = await Review.find({ 
      product: productId,
      status: 'Approved'
    });

    // Get bookings
    const Schedule = (await import('../models/scheduleModel.js')).default;
    const schedules = await Schedule.find({ product: productId });
    const scheduleIds = schedules.map(s => s._id);
    const bookings = await Booking.find({
      schedule: { $in: scheduleIds },
      status: { $ne: 'Cancelled' }
    });

    // Calculate metrics
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    // Check if product is new (created in last 30 days)
    const daysSinceCreation = (new Date() - new Date(product.createdAt)) / (1000 * 60 * 60 * 24);
    const isNew = daysSinceCreation <= 30;

    // Check if product is best value (price below average for category)
    const categoryProducts = await Product.find({ 
      category: product.category,
      status: 'Published'
    });
    const avgCategoryPrice = categoryProducts.length > 0
      ? categoryProducts.reduce((sum, p) => sum + (p.price || 0), 0) / categoryProducts.length
      : product.price;
    const isBestValue = product.price < avgCategoryPrice * 0.9; // 10% below average

    // Check if product has last minute availability
    const lastMinuteSchedules = await Schedule.find({ 
      product: productId,
      date: { $gte: new Date(), $lte: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      capacity: { $gt: 0 }
    });
    const isLastMinute = lastMinuteSchedules.length > 0;

    // Update product metrics
    product.metrics = {
      viewCount: product.metrics?.viewCount || 0, // Keep existing view count
      bookingCount: bookings.length,
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount: reviews.length,
      isPopular: bookings.length >= 10 || reviews.length >= 5,
      isBestValue,
      isNew,
      isLastMinute,
    };

    // Save without validation to avoid errors on required fields like duration
    // This is safe because we're only updating metrics, not core product fields
    await product.save({ validateBeforeSave: false });

    // Update badges
    await assignProductBadges(productId);
  } catch (error) {
    logger.error('Error updating product metrics:', error);
  }
};

/**
 * Assign badges to operator based on criteria
 */
const assignOperatorBadges = async (operatorId) => {
  try {
    const operator = await Operator.findById(operatorId);
    if (!operator) return;

    const badges = await Badge.find({ 
      type: 'operator',
      isActive: true,
      isAutomatic: true
    });

    const earnedBadges = [];

    for (const badge of badges) {
      const criteria = badge.criteria;
      let meetsCriteria = true;

      // Check each criterion
      if (criteria.minRating && operator.metrics.averageRating < criteria.minRating) {
        meetsCriteria = false;
      }
      if (criteria.minReviews && operator.metrics.totalReviews < criteria.minReviews) {
        meetsCriteria = false;
      }
      if (criteria.minBookings && operator.metrics.totalBookings < criteria.minBookings) {
        meetsCriteria = false;
      }
      if (criteria.minRevenue && operator.metrics.totalRevenue < criteria.minRevenue) {
        meetsCriteria = false;
      }
      if (criteria.maxResponseTime && operator.metrics.responseTime && operator.metrics.responseTime > criteria.maxResponseTime) {
        meetsCriteria = false;
      }
      if (criteria.minCompletionRate && operator.metrics.completionRate < criteria.minCompletionRate) {
        meetsCriteria = false;
      }
      if (criteria.isVerified !== undefined && operator.metrics.isVerified !== criteria.isVerified) {
        meetsCriteria = false;
      }
      if (criteria.isLocal !== undefined && operator.metrics.isLocal !== criteria.isLocal) {
        meetsCriteria = false;
      }
      if (criteria.isLocal100 !== undefined && operator.authenticity?.isLocal100 !== criteria.isLocal100) {
        meetsCriteria = false;
      }
      if (criteria.isArtisan !== undefined && operator.authenticity?.isArtisan !== criteria.isArtisan) {
        meetsCriteria = false;
      }
      if (criteria.isAuthenticLocal !== undefined && operator.authenticity?.isAuthenticLocal !== criteria.isAuthenticLocal) {
        meetsCriteria = false;
      }
      if (criteria.isEcoFriendly !== undefined && operator.authenticity?.isEcoFriendly !== criteria.isEcoFriendly) {
        meetsCriteria = false;
      }
      if (criteria.isTraditional !== undefined && operator.authenticity?.isTraditional !== criteria.isTraditional) {
        meetsCriteria = false;
      }

      if (meetsCriteria) {
        // Check if operator already has this badge
        const hasBadge = operator.badges.some(b => b.badgeId.toString() === badge._id.toString());
        if (!hasBadge) {
          operator.badges.push({
            badgeId: badge._id,
            earnedAt: new Date(),
          });
          earnedBadges.push(badge);
        }
      }
    }

    if (earnedBadges.length > 0) {
      // Save without validation to avoid errors on required fields
      await operator.save({ validateBeforeSave: false });
    }

    return earnedBadges;
  } catch (error) {
    logger.error('Error assigning operator badges:', error);
    return [];
  }
};

/**
 * Assign badges to product based on criteria
 */
const assignProductBadges = async (productId) => {
  try {
    const product = await Product.findById(productId);
    if (!product) return;

    const badges = await Badge.find({ 
      type: 'product',
      isActive: true,
      isAutomatic: true
    });

    const earnedBadges = [];

    for (const badge of badges) {
      const criteria = badge.criteria;
      let meetsCriteria = true;

      // Check each criterion
      if (criteria.minRating && product.metrics.averageRating < criteria.minRating) {
        meetsCriteria = false;
      }
      if (criteria.minReviews && product.metrics.reviewCount < criteria.minReviews) {
        meetsCriteria = false;
      }
      if (criteria.minBookings && product.metrics.bookingCount < criteria.minBookings) {
        meetsCriteria = false;
      }
      if (criteria.minViewCount && product.metrics.viewCount < criteria.minViewCount) {
        meetsCriteria = false;
      }
      if (criteria.isNew !== undefined && product.metrics.isNew !== criteria.isNew) {
        meetsCriteria = false;
      }
      if (criteria.isBestValue !== undefined && product.metrics.isBestValue !== criteria.isBestValue) {
        meetsCriteria = false;
      }
      if (criteria.isLastMinute !== undefined && product.metrics.isLastMinute !== criteria.isLastMinute) {
        meetsCriteria = false;
      }
      if (criteria.isArtisan !== undefined && product.authenticity?.isArtisan !== criteria.isArtisan) {
        meetsCriteria = false;
      }
      if (criteria.isAuthenticLocal !== undefined && product.authenticity?.isAuthenticLocal !== criteria.isAuthenticLocal) {
        meetsCriteria = false;
      }
      if (criteria.isEcoFriendly !== undefined && product.authenticity?.isEcoFriendly !== criteria.isEcoFriendly) {
        meetsCriteria = false;
      }
      if (criteria.hasSkipTheLine !== undefined && product.skipTheLine?.enabled !== criteria.hasSkipTheLine) {
        meetsCriteria = false;
      }

      if (meetsCriteria) {
        // Check if product already has this badge
        const hasBadge = product.badges.some(b => b.badgeId.toString() === badge._id.toString());
        if (!hasBadge) {
          product.badges.push({
            badgeId: badge._id,
            earnedAt: new Date(),
          });
          earnedBadges.push(badge);
        }
      }
    }

    if (earnedBadges.length > 0) {
      // Save without validation to avoid errors on required fields like duration
      await product.save({ validateBeforeSave: false });
    }

    return earnedBadges;
  } catch (error) {
    logger.error('Error assigning product badges:', error);
    return [];
  }
};

/**
 * Initialize default badges (to be called on startup or by admin)
 */
export const initializeDefaultBadges = async () => {
  try {
    const defaultBadges = [
      // Operator badges
      {
        name: 'Vérifié',
        type: 'operator',
        icon: '✓',
        color: '#059669',
        description: 'Opérateur vérifié et approuvé',
        criteria: { isVerified: true },
      },
      {
        name: 'Artisan',
        type: 'operator',
        icon: '🧵',
        color: '#7C3AED',
        description: 'Opérateur artisanal ou métier de tradition',
        criteria: { isArtisan: true },
        isAutomatic: false, // Nécessite validation admin
      },
      {
        name: 'Éco-responsable',
        type: 'operator',
        icon: '🌱',
        color: '#16A34A',
        description: 'Opérateur engagé dans des pratiques durables',
        criteria: { isEcoFriendly: true },
        isAutomatic: false, // Nécessite validation admin
      },
      {
        name: '100% Marocain',
        type: 'operator',
        icon: '🕌',
        color: '#B91C1C',
        description: 'Opérateur purement local et authentique',
        criteria: { isLocal: true, isLocal100: true },
      },
      {
        name: 'Local Authentique',
        type: 'operator',
        icon: '🇲🇦',
        color: '#C8102E',
        description: 'Opérateur marocain authentique',
        criteria: { isLocal: true, isAuthenticLocal: true },
      },
      {
        name: 'Meilleur Opérateur',
        type: 'operator',
        icon: '⭐',
        color: '#FFD700',
        description: 'Excellent opérateur avec plus de 50 réservations et note > 4.5',
        criteria: { minBookings: 50, minRating: 4.5 },
      },
      {
        name: 'Réponse Rapide',
        type: 'operator',
        icon: '⚡',
        color: '#3B82F6',
        description: 'Répond aux demandes en moins de 2 heures',
        criteria: { maxResponseTime: 2 },
      },
      {
        name: 'Opérateur de Confiance',
        type: 'operator',
        icon: '🛡️',
        color: '#8B5CF6',
        description: 'Plus de 100 réservations et taux de complétion > 95%',
        criteria: { minBookings: 100, minCompletionRate: 95 },
      },
      // Product badges
      {
        name: 'Populaire',
        type: 'product',
        icon: '🔥',
        color: '#EF4444',
        description: 'Produit très populaire',
        criteria: { minBookings: 10 },
      },
      {
        name: 'Meilleure Valeur',
        type: 'product',
        icon: '💰',
        color: '#10B981',
        description: 'Excellent rapport qualité/prix',
        criteria: { isBestValue: true },
      },
      {
        name: 'Skip-the-Line',
        type: 'product',
        icon: '⚡',
        color: '#F59E0B',
        description: 'Évitez les files d\'attente avec cette option',
        criteria: { hasSkipTheLine: true },
        isAutomatic: true,
      },
      {
        name: 'Artisan',
        type: 'product',
        icon: '🧵',
        color: '#7C3AED',
        description: 'Expérience ou produit artisanal',
        criteria: { isArtisan: true },
        isAutomatic: false, // Nécessite validation admin
      },
      {
        name: 'Authentique locale',
        type: 'product',
        icon: '🏡',
        color: '#C2410C',
        description: 'Expérience ancrée dans la tradition locale',
        criteria: { isAuthenticLocal: true },
        isAutomatic: true, // Automatique si isAuthenticLocal est true
      },
      {
        name: 'Éco-responsable',
        type: 'product',
        icon: '🌱',
        color: '#16A34A',
        description: 'Expérience respectueuse de l\'environnement',
        criteria: { isEcoFriendly: true },
        isAutomatic: false, // Nécessite validation admin
      },
      {
        name: 'Traditionnel',
        type: 'product',
        icon: '🕌',
        color: '#92400E',
        description: 'Expérience traditionnelle marocaine',
        criteria: { isTraditional: true },
        isAutomatic: false, // Nécessite validation admin
      },
      {
        name: 'Nouveau',
        type: 'product',
        icon: '🆕',
        color: '#06B6D4',
        description: 'Nouveau produit ajouté récemment',
        criteria: { isNew: true },
      },
      {
        name: 'Dernières Places',
        type: 'product',
        icon: '⏰',
        color: '#F59E0B',
        description: 'Disponible dans les 24 prochaines heures',
        criteria: { isLastMinute: true },
      },
      {
        name: 'Excellent',
        type: 'product',
        icon: '⭐',
        color: '#FCD34D',
        description: 'Note moyenne supérieure à 4.5',
        criteria: { minRating: 4.5, minReviews: 5 },
      },
    ];

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const badgeData of defaultBadges) {
      try {
        const result = await Badge.findOneAndUpdate(
          { name: badgeData.name, type: badgeData.type },
          badgeData,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        if (result.isNew) {
          created++;
        } else {
          updated++;
        }
      } catch (error) {
        // Handle duplicate key error (badge already exists with same name but different type)
        if (error.code === 11000 || error.codeName === 'DuplicateKey') {
          // Try to find existing badge and update it
          try {
            const existingBadge = await Badge.findOne({ name: badgeData.name, type: badgeData.type });
            if (existingBadge) {
              // Update existing badge
              Object.assign(existingBadge, badgeData);
              await existingBadge.save();
              updated++;
            } else {
              // Badge exists with same name but different type - skip
              skipped++;
              logger.info(`⚠️  Skipping badge "${badgeData.name}" (type: ${badgeData.type}) - duplicate name exists`);
            }
          } catch (updateError) {
            skipped++;
            logger.error(`⚠️  Error updating badge "${badgeData.name}":`, updateError.message);
          }
        } else {
          skipped++;
          logger.error(`⚠️  Error creating badge "${badgeData.name}":`, error.message);
        }
      }
    }

    logger.info(`Default badges initialized: ${created} created, ${updated} updated, ${skipped} skipped`);
  } catch (error) {
    logger.error('Error initializing default badges:', error);
    throw error;
  }
};
