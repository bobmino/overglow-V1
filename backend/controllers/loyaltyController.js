import User from '../models/userModel.js';
import {
  getLoyaltyBenefits,
  redeemPoints,
  calculatePointsForBooking,
} from '../utils/loyaltyService.js';

// @desc    Get user loyalty status
// @route   GET /api/loyalty/status
// @access  Private
const getLoyaltyStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const benefits = getLoyaltyBenefits(user.loyaltyLevel || 'Bronze');
    const pointsToNextLevel = getPointsToNextLevel(user.totalSpent || 0, user.loyaltyLevel || 'Bronze');

    res.json({
      loyaltyPoints: user.loyaltyPoints || 0,
      loyaltyLevel: user.loyaltyLevel || 'Bronze',
      totalSpent: user.totalSpent || 0,
      totalBookings: user.totalBookings || 0,
      benefits,
      pointsToNextLevel,
      pointsHistory: user.loyaltyPointsHistory?.slice(-10) || [], // Last 10 transactions
    });
  } catch (error) {
    console.error('Get loyalty status error:', error);
    res.status(500).json({ message: 'Failed to fetch loyalty status' });
  }
};

// @desc    Redeem loyalty points
// @route   POST /api/loyalty/redeem
// @access  Private
const redeemLoyaltyPoints = async (req, res) => {
  try {
    const { points } = req.body;

    if (!points || points <= 0) {
      return res.status(400).json({ message: 'Invalid points amount' });
    }

    const result = await redeemPoints(req.user._id, points);

    res.json({
      message: 'Points redeemed successfully',
      discountAmount: result.discountAmount,
      remainingPoints: result.remainingPoints,
    });
  } catch (error) {
    console.error('Redeem points error:', error);
    res.status(500).json({ message: error.message || 'Failed to redeem points' });
  }
};

// @desc    Get loyalty points history
// @route   GET /api/loyalty/history
// @access  Private
const getLoyaltyHistory = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const user = await User.findById(req.user._id)
      .select('loyaltyPointsHistory')
      .limit(parseInt(limit));

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const history = (user.loyaltyPointsHistory || [])
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, parseInt(limit));

    res.json(history);
  } catch (error) {
    console.error('Get loyalty history error:', error);
    res.status(500).json({ message: 'Failed to fetch loyalty history' });
  }
};

// Helper function to calculate points needed for next level
const getPointsToNextLevel = (totalSpent, currentLevel) => {
  const thresholds = {
    Bronze: 500,
    Silver: 2000,
    Gold: 5000,
    Platinum: Infinity,
  };

  const currentThreshold = thresholds[currentLevel] || 500;
  const nextThreshold = currentLevel === 'Platinum' 
    ? null 
    : Object.values(thresholds).find(t => t > currentThreshold);

  if (!nextThreshold) {
    return { amount: 0, level: null, message: 'Niveau maximum atteint' };
  }

  const amountNeeded = nextThreshold - totalSpent;
  const nextLevel = Object.keys(thresholds).find(
    level => thresholds[level] === nextThreshold
  );

  return {
    amount: Math.max(0, amountNeeded),
    level: nextLevel,
    message: `Dépensez encore ${amountNeeded.toFixed(2)}€ pour atteindre le niveau ${nextLevel}`,
  };
};

export {
  getLoyaltyStatus,
  redeemLoyaltyPoints,
  getLoyaltyHistory,
};

