import User from '../models/userModel.js';
import Booking from '../models/bookingModel.js';

/**
 * Calculate loyalty level based on total spent
 * @param {Number} totalSpent - Total amount spent by user
 * @returns {String} Loyalty level
 */
export const calculateLoyaltyLevel = (totalSpent) => {
  if (totalSpent >= 5000) return 'Platinum';
  if (totalSpent >= 2000) return 'Gold';
  if (totalSpent >= 500) return 'Silver';
  return 'Bronze';
};

/**
 * Calculate points earned for a booking
 * @param {Number} amount - Booking amount
 * @param {String} level - Current loyalty level
 * @returns {Number} Points earned
 */
export const calculatePointsForBooking = (amount, level) => {
  // Base: 1 point per 10€ spent
  let basePoints = Math.floor(amount / 10);
  
  // Level multipliers
  const multipliers = {
    Bronze: 1.0,
    Silver: 1.2,
    Gold: 1.5,
    Platinum: 2.0,
  };
  
  const multiplier = multipliers[level] || 1.0;
  return Math.floor(basePoints * multiplier);
};

/**
 * Add points to user account
 * @param {String} userId - User ID
 * @param {Number} points - Points to add
 * @param {String} reason - Reason for points
 * @param {String} bookingId - Optional booking ID
 * @returns {Object} Updated user
 */
export const addLoyaltyPoints = async (userId, points, reason, bookingId = null) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.loyaltyPoints = (user.loyaltyPoints || 0) + points;
    
    // Add to history
    user.loyaltyPointsHistory.push({
      points,
      reason,
      bookingId,
      createdAt: new Date(),
    });

    // Update loyalty level based on total spent
    const newLevel = calculateLoyaltyLevel(user.totalSpent || 0);
    if (newLevel !== user.loyaltyLevel) {
      user.loyaltyLevel = newLevel;
    }

    await user.save();
    return user;
  } catch (error) {
    console.error('Add loyalty points error:', error);
    throw error;
  }
};

/**
 * Redeem points for discount
 * @param {String} userId - User ID
 * @param {Number} pointsToRedeem - Points to redeem
 * @returns {Object} { discountAmount, remainingPoints }
 */
export const redeemPoints = async (userId, pointsToRedeem) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.loyaltyPoints < pointsToRedeem) {
      throw new Error('Insufficient points');
    }

    // 100 points = 10€ discount
    const discountAmount = (pointsToRedeem / 100) * 10;
    user.loyaltyPoints -= pointsToRedeem;

    // Add redemption to history
    user.loyaltyPointsHistory.push({
      points: -pointsToRedeem,
      reason: `Rédemption de ${pointsToRedeem} points pour ${discountAmount.toFixed(2)}€ de réduction`,
      createdAt: new Date(),
    });

    await user.save();

    return {
      discountAmount: Math.round(discountAmount * 100) / 100,
      remainingPoints: user.loyaltyPoints,
    };
  } catch (error) {
    console.error('Redeem points error:', error);
    throw error;
  }
};

/**
 * Update user stats after booking
 * @param {String} userId - User ID
 * @param {Number} amount - Booking amount
 */
export const updateUserStatsAfterBooking = async (userId, amount) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    user.totalSpent = (user.totalSpent || 0) + amount;
    user.totalBookings = (user.totalBookings || 0) + 1;

    // Calculate and add points
    const pointsEarned = calculatePointsForBooking(amount, user.loyaltyLevel || 'Bronze');
    await addLoyaltyPoints(userId, pointsEarned, `Points gagnés pour réservation de ${amount.toFixed(2)}€`);

    // Update loyalty level
    const newLevel = calculateLoyaltyLevel(user.totalSpent);
    if (newLevel !== user.loyaltyLevel) {
      user.loyaltyLevel = newLevel;
      await user.save();
    }
  } catch (error) {
    console.error('Update user stats error:', error);
  }
};

/**
 * Get loyalty benefits for a level
 * @param {String} level - Loyalty level
 * @returns {Object} Benefits
 */
export const getLoyaltyBenefits = (level) => {
  const benefits = {
    Bronze: {
      pointsMultiplier: 1.0,
      discount: 0,
      freeCancellation: false,
      prioritySupport: false,
      exclusiveDeals: false,
    },
    Silver: {
      pointsMultiplier: 1.2,
      discount: 5, // 5% discount
      freeCancellation: false,
      prioritySupport: false,
      exclusiveDeals: true,
    },
    Gold: {
      pointsMultiplier: 1.5,
      discount: 10, // 10% discount
      freeCancellation: true,
      prioritySupport: true,
      exclusiveDeals: true,
    },
    Platinum: {
      pointsMultiplier: 2.0,
      discount: 15, // 15% discount
      freeCancellation: true,
      prioritySupport: true,
      exclusiveDeals: true,
      conciergeService: true,
    },
  };

  return benefits[level] || benefits.Bronze;
};

