import Booking from '../models/bookingModel.js';
import Operator from '../models/operatorModel.js';
import Product from '../models/productModel.js';

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

export { getOperatorBookings, getOperatorAnalytics };
