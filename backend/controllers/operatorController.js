import Booking from '../models/bookingModel.js';
import Operator from '../models/operatorModel.js';
import Product from '../models/productModel.js'; // [BUG-01] Required by getOperatorAnalytics
import { sanitizeBody } from '../utils/sanitizeBody.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { logger } from '../utils/logger.js';

// [TASK-6] Allowlists for future operator mutations (current handlers are read-only)
export const OPERATOR_UPDATE_FIELDS = ['companyName', 'phone', 'whatsapp', 'description', 'logo'];

/**
 * Helper exposé pour les mises à jour opérateur (évite mass-assignment).
 */
export const sanitizeOperatorUpdate = (body) => sanitizeBody(body, OPERATOR_UPDATE_FIELDS);

// @desc    Get operator bookings
// @route   GET /api/operator/bookings
// @access  Private/Operator
const getOperatorBookings = asyncHandler(async (req, res) => {
  const operator = await Operator.findOne({ user: req.user._id });
  if (!operator) {
    res.status(404);
    throw new Error('Operator profile not found');
  }

  const bookings = await Booking.find({ operator: operator._id })
    .populate('user', 'name email')
    .populate({
      path: 'schedule',
      populate: {
        path: 'product',
        select: 'title',
      },
    });

  res.json(bookings);
});

// @desc    Get operator analytics
// @route   GET /api/operator/analytics
// @access  Private/Operator
const getOperatorAnalytics = asyncHandler(async (req, res) => {
  const operator = await Operator.findOne({ user: req.user._id });
  if (!operator) {
    res.status(404);
    throw new Error('Operator profile not found');
  }

  const products = await Product.find({ operator: operator._id });
  const activeProducts = products.filter((product) => product.status === 'Published').length;

  const bookings = await Booking.find({
    operator: operator._id,
    status: { $ne: 'Cancelled' },
  }).populate({
    path: 'schedule',
    populate: { path: 'product', select: 'title' },
  });

  const totalRevenue = bookings.reduce(
    (sum, booking) => sum + (booking.totalPrice ?? booking.totalAmount ?? 0),
    0
  );
  const totalBookings = bookings.length;
  const avgRevenuePerBooking = totalBookings ? totalRevenue / totalBookings : 0;

  const revenueBuckets = bookings.reduce((acc, booking) => {
    const date = booking.schedule?.date ? new Date(booking.schedule.date) : null;
    if (!date || Number.isNaN(date.valueOf())) {
      return acc;
    }
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    acc[key] = (acc[key] || 0) + (booking.totalPrice ?? booking.totalAmount ?? 0);
    return acc;
  }, {});

  const revenueData = Object.keys(revenueBuckets)
    .map((key) => {
      const [year, month] = key.split('-').map(Number);
      const dateObj = new Date(year, month);
      return {
        name: dateObj.toLocaleString('default', { month: 'short', year: 'numeric' }),
        revenue: revenueBuckets[key],
        timestamp: dateObj.getTime(),
      };
    })
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(({ name, revenue }) => ({ name, revenue }));

  const productStats = bookings.reduce((acc, booking) => {
    const title = booking.schedule?.product?.title || 'Unknown';
    acc[title] = (acc[title] || 0) + 1;
    return acc;
  }, {});

  const productData = Object.keys(productStats).map((title) => ({
    name: title,
    bookings: productStats[title],
  }));

  res.json({
    totalRevenue,
    totalBookings,
    avgRevenuePerBooking,
    activeProducts,
    totalProducts: products.length,
    revenueData,
    productData,
  });
});

// @desc    Get operator dashboard stats
// @route   GET /api/operator/dashboard-stats
// @access  Private/Operator
const getOperatorDashboardStats = asyncHandler(async (req, res) => {
  const operator = await Operator.findOne({ user: req.user._id });
  if (!operator) {
    res.status(404);
    throw new Error('Operator profile not found');
  }

  const bookings = await Booking.find({
    operator: operator._id,
    status: { $in: ['Confirmed', 'PENDING_PAYMENT', 'Pending'] },
  }).populate({
    path: 'schedule',
    populate: { path: 'product', select: 'title' },
  });

  const confirmed = bookings.filter((b) => b.status === 'Confirmed');
  const totalRevenue = confirmed.reduce(
    (sum, booking) => sum + (booking.totalPrice ?? booking.totalAmount ?? 0),
    0
  );
  const confirmedBookingsCount = confirmed.length;
  const pendingCount = bookings.filter((b) =>
    ['Pending', 'PENDING_PAYMENT'].includes(b.status)
  ).length;

  const titleCounts = {};
  bookings.forEach((b) => {
    const title = b.schedule?.product?.title;
    if (!title) return;
    titleCounts[title] = (titleCounts[title] || 0) + 1;
  });
  const topExperiences = Object.entries(titleCounts)
    .map(([_id, count]) => ({ _id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Insights snappy pour le dashboard (réutilise advanced)
  let insights = { recommendations: [], competitionAlerts: 0, conversionRate: null };
  try {
    const { getAdvancedAnalytics } = await import('./analyticsController.js');
    const fakeRes = {
      statusCode: 200,
      body: null,
      status(c) {
        this.statusCode = c;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };
    await getAdvancedAnalytics(req, fakeRes);
    if (fakeRes.statusCode === 200 && fakeRes.body) {
      const recs = fakeRes.body.recommendations || [];
      insights = {
        recommendations: recs.slice(0, 3),
        competitionAlerts: recs.filter((r) => r.type === 'pricing').length,
        conversionRate: fakeRes.body.funnel?.viewToBookingRate ?? null,
        explanation: fakeRes.body.meta?.explanation || null,
      };
    }
  } catch (err) {
    logger.warn('Dashboard insights skipped:', err.message);
  }

  res.json({
    totalRevenue,
    totalSales: totalRevenue, // alias legacy front
    confirmedBookingsCount,
    confirmedBookings: confirmedBookingsCount, // alias legacy front
    pendingCount,
    topExperiences,
    insights,
  });
});

// @desc    Get operator account (sections profil)
// @route   GET /api/operator/account
// @access  Private/Operator
const getOperatorAccount = asyncHandler(async (req, res) => {
  const operator = await Operator.findOne({ user: req.user._id }).populate(
    'user',
    'name email phone bio location website'
  );
  if (!operator) {
    res.status(404);
    throw new Error('Operator profile not found');
  }

  res.json({
    user: {
      name: operator.user?.name || '',
      email: operator.user?.email || '',
      phone: operator.user?.phone || '',
      bio: operator.user?.bio || '',
      location: operator.user?.location || '',
      website: operator.user?.website || '',
    },
    providerType: operator.providerType,
    publicName: operator.publicName || operator.companyName || '',
    description: operator.description || '',
    location: operator.location || {},
    companyAddress: operator.companyAddress || {},
    companyInfo: operator.companyInfo || {},
    individualWithStatusInfo: operator.individualWithStatusInfo || {},
    individualWithoutStatusInfo: operator.individualWithoutStatusInfo || {},
    phone: operator.phone || '',
    contactEmail: operator.contactEmail || '',
    website: operator.website || '',
    socialLinks: operator.socialLinks || {},
    banking: operator.banking || {},
    status: operator.status,
    isFormCompleted: operator.isFormCompleted,
  });
});

// @desc    Update operator account by section
// @route   PUT /api/operator/account
// @access  Private/Operator
const updateOperatorAccount = asyncHandler(async (req, res) => {
  const User = (await import('../models/userModel.js')).default;
  const operator = await Operator.findOne({ user: req.user._id });
  if (!operator) {
    res.status(404);
    throw new Error('Operator profile not found');
  }

  const { section } = req.body;
  if (!section) {
    res.status(400);
    throw new Error('section is required (personal|company|contact|banking)');
  }

  if (section === 'personal') {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    if (req.body.name !== undefined) user.name = String(req.body.name).trim();
    if (req.body.phone !== undefined) user.phone = String(req.body.phone).trim();
    if (req.body.bio !== undefined) user.bio = String(req.body.bio).trim();
    if (req.body.location !== undefined) user.location = String(req.body.location).trim();
    if (req.body.website !== undefined) user.website = String(req.body.website).trim();
    await user.save();
  }

  if (section === 'company') {
    if (req.body.publicName !== undefined) operator.publicName = String(req.body.publicName).trim();
    if (req.body.description !== undefined) operator.description = String(req.body.description).trim();
    if (req.body.location && typeof req.body.location === 'object') {
      operator.location = { ...(operator.location || {}), ...req.body.location };
    }
    if (req.body.companyAddress && typeof req.body.companyAddress === 'object') {
      operator.companyAddress = { ...(operator.companyAddress || {}), ...req.body.companyAddress };
    }
    if (req.body.companyInfo && typeof req.body.companyInfo === 'object') {
      operator.companyInfo = { ...(operator.companyInfo || {}), ...req.body.companyInfo };
    }
    if (req.body.individualWithStatusInfo && typeof req.body.individualWithStatusInfo === 'object') {
      operator.individualWithStatusInfo = {
        ...(operator.individualWithStatusInfo || {}),
        ...req.body.individualWithStatusInfo,
      };
    }
    if (req.body.individualWithoutStatusInfo && typeof req.body.individualWithoutStatusInfo === 'object') {
      operator.individualWithoutStatusInfo = {
        ...(operator.individualWithoutStatusInfo || {}),
        ...req.body.individualWithoutStatusInfo,
      };
    }
  }

  if (section === 'contact') {
    if (req.body.phone !== undefined) operator.phone = String(req.body.phone).trim();
    if (req.body.contactEmail !== undefined) operator.contactEmail = String(req.body.contactEmail).trim();
    if (req.body.website !== undefined) operator.website = String(req.body.website).trim();
    if (req.body.socialLinks && typeof req.body.socialLinks === 'object') {
      operator.socialLinks = { ...(operator.socialLinks || {}), ...req.body.socialLinks };
    }
  }

  if (section === 'banking') {
    const b = req.body.banking && typeof req.body.banking === 'object' ? req.body.banking : req.body;
    operator.banking = {
      ...(operator.banking || {}),
      accountHolder: b.accountHolder !== undefined ? String(b.accountHolder).trim() : operator.banking?.accountHolder,
      bankName: b.bankName !== undefined ? String(b.bankName).trim() : operator.banking?.bankName,
      iban: b.iban !== undefined ? String(b.iban).trim() : operator.banking?.iban,
      rib: b.rib !== undefined ? String(b.rib).trim() : operator.banking?.rib,
      paypalEmail: b.paypalEmail !== undefined ? String(b.paypalEmail).trim() : operator.banking?.paypalEmail,
    };
  }

  await operator.save();
  res.json({ message: 'Account updated', section });
});

export {
  getOperatorBookings,
  getOperatorAnalytics,
  getOperatorDashboardStats,
  getOperatorAccount,
  updateOperatorAccount,
};
