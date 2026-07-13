import Booking from '../models/bookingModel.js';
import Operator from '../models/operatorModel.js';
import Product from '../models/productModel.js'; // [BUG-01] Required by getOperatorAnalytics
import { sanitizeBody } from '../utils/sanitizeBody.js';

// [TASK-6] Allowlists for future operator mutations (current handlers are read-only)
export const OPERATOR_UPDATE_FIELDS = ['companyName', 'phone', 'whatsapp', 'description', 'logo'];

/**
 * Helper exposé pour les mises à jour opérateur (évite mass-assignment).
 */
export const sanitizeOperatorUpdate = (body) => sanitizeBody(body, OPERATOR_UPDATE_FIELDS);

// @desc    Get operator bookings
// @route   GET /api/operator/bookings
// @access  Private/Operator
const getOperatorBookings = async (req, res) => {
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
};

// @desc    Get operator analytics
// @route   GET /api/operator/analytics
// @access  Private/Operator
const getOperatorAnalytics = async (req, res) => {
  const operator = await Operator.findOne({ user: req.user._id });
  if (!operator) {
    res.status(404);
    throw new Error('Operator profile not found');
  }

  const products = await Product.find({ operator: operator._id });
  const activeProducts = products.filter(product => product.status === 'Published').length;

  const bookings = await Booking.find({
    operator: operator._id,
    status: { $ne: 'Cancelled' }
  }).populate({
    path: 'schedule',
    populate: { path: 'product', select: 'title' }
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
    .map(key => {
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

  const productData = Object.keys(productStats).map(title => ({
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
};

// @desc    Get operator dashboard stats
// @route   GET /api/operator/dashboard-stats
// @access  Private/Operator
const getOperatorDashboardStats = async (req, res) => {
  const operator = await Operator.findOne({ user: req.user._id });
  if (!operator) {
    res.status(404);
    throw new Error('Operator profile not found');
  }

  const bookings = await Booking.find({
    operator: operator._id,
    status: 'Confirmed'
  });

  const totalRevenue = bookings.reduce(
    (sum, booking) => sum + (booking.totalPrice ?? booking.totalAmount ?? 0),
    0
  );
  const confirmedBookingsCount = bookings.length;

  const topExperiences = await Booking.aggregate([
    {
      $match: { operator: operator._id }
    },
    {
      $group: {
        _id: '$schedule.product.title',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 5
    }
  ]);

  res.json({
    totalRevenue,
    confirmedBookingsCount,
    topExperiences
  });
};

export { getOperatorBookings, getOperatorAnalytics, getOperatorDashboardStats };
