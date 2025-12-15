import Booking from '../models/bookingModel.js';
import Operator from '../models/operatorModel.js';
import Product from '../models/productModel.js';
import ViewHistory from '../models/viewHistoryModel.js';
import Review from '../models/reviewModel.js';
import Schedule from '../models/scheduleModel.js';

// @desc    Get advanced operator analytics with conversion funnel
// @route   GET /api/operator/analytics/advanced
// @access  Private/Operator
const getAdvancedAnalytics = async (req, res) => {
  try {
    const operator = await Operator.findOne({ user: req.user._id });
    if (!operator) {
      return res.status(404).json({ message: 'Operator profile not found' });
    }

    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get all operator products
    const products = await Product.find({ operator: operator._id });
    const productIds = products.map(p => p._id);

    // Conversion Funnel: Views → Inquiries → Bookings
    const views = await ViewHistory.countDocuments({
      product: { $in: productIds },
      ...(startDate || endDate ? { viewedAt: dateFilter.createdAt } : {}),
    });

    const inquiries = await (await import('../models/inquiryModel.js')).default.countDocuments({
      product: { $in: productIds },
      ...dateFilter,
    });

    const bookings = await Booking.countDocuments({
      operator: operator._id,
      status: { $ne: 'Cancelled' },
      ...dateFilter,
    });

    // Calculate conversion rates
    const viewToInquiryRate = views > 0 ? (inquiries / views) * 100 : 0;
    const inquiryToBookingRate = inquiries > 0 ? (bookings / inquiries) * 100 : 0;
    const viewToBookingRate = views > 0 ? (bookings / views) * 100 : 0;

    // Revenue metrics
    const bookingDocs = await Booking.find({
      operator: operator._id,
      status: { $ne: 'Cancelled' },
      ...dateFilter,
    });

    const totalRevenue = bookingDocs.reduce(
      (sum, booking) => sum + (booking.totalPrice ?? booking.totalAmount ?? 0),
      0
    );

    const avgRevenuePerBooking = bookings > 0 ? totalRevenue / bookings : 0;

    // Product performance metrics
    const productPerformance = await Promise.all(
      products.map(async (product) => {
        const productViews = await ViewHistory.countDocuments({
          product: product._id,
          ...(startDate || endDate ? { viewedAt: dateFilter.createdAt } : {}),
        });

        const productBookings = await Booking.countDocuments({
          operator: operator._id,
          'schedule.product': product._id,
          status: { $ne: 'Cancelled' },
          ...dateFilter,
        });

        const productReviews = await Review.countDocuments({
          product: product._id,
          ...dateFilter,
        });

        const productRevenue = bookingDocs
          .filter(b => b.schedule?.product?.toString() === product._id.toString())
          .reduce((sum, b) => sum + (b.totalPrice ?? b.totalAmount ?? 0), 0);

        const conversionRate = productViews > 0 ? (productBookings / productViews) * 100 : 0;

        return {
          productId: product._id,
          title: product.title,
          views: productViews,
          bookings: productBookings,
          reviews: productReviews,
          revenue: productRevenue,
          conversionRate: Math.round(conversionRate * 100) / 100,
          averageRating: product.metrics?.averageRating || 0,
        };
      })
    );

    // Competition analysis: Average prices by category
    const competitionAnalysis = await Product.aggregate([
      {
        $match: {
          status: 'Published',
          category: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$category',
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { avgPrice: 1 },
      },
    ]);

    // Operator's average price by category
    const operatorCategoryPrices = await Product.aggregate([
      {
        $match: {
          operator: operator._id,
          status: 'Published',
          category: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$category',
          avgPrice: { $avg: '$price' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Merge competition and operator data
    const categoryComparison = competitionAnalysis.map((cat) => {
      const operatorData = operatorCategoryPrices.find(
        (op) => op._id === cat._id
      );
      return {
        category: cat._id,
        marketAvgPrice: Math.round(cat.avgPrice * 100) / 100,
        marketMinPrice: Math.round(cat.minPrice * 100) / 100,
        marketMaxPrice: Math.round(cat.maxPrice * 100) / 100,
        marketCount: cat.count,
        operatorAvgPrice: operatorData
          ? Math.round(operatorData.avgPrice * 100) / 100
          : null,
        operatorCount: operatorData ? operatorData.count : 0,
        priceDifference:
          operatorData && cat.avgPrice
            ? Math.round((operatorData.avgPrice - cat.avgPrice) * 100) / 100
            : null,
        priceDifferencePercent:
          operatorData && cat.avgPrice
            ? Math.round(
                ((operatorData.avgPrice - cat.avgPrice) / cat.avgPrice) * 100 *
                  100
              ) / 100
            : null,
      };
    });

    // Recommendations
    const recommendations = [];

    // Low conversion rate recommendation
    if (viewToBookingRate < 2) {
      recommendations.push({
        type: 'conversion',
        priority: 'high',
        title: 'Taux de conversion faible',
        message: `Votre taux de conversion vues → réservations est de ${viewToBookingRate.toFixed(2)}%. Améliorez vos descriptions, photos et prix pour augmenter les conversions.`,
        action: 'Optimiser les pages produits',
      });
    }

    // Price competitiveness recommendations
    categoryComparison.forEach((cat) => {
      if (cat.operatorAvgPrice && cat.priceDifferencePercent) {
        if (cat.priceDifferencePercent > 20) {
          recommendations.push({
            type: 'pricing',
            priority: 'medium',
            title: `Prix élevé dans la catégorie ${cat.category}`,
            message: `Vos prix sont ${cat.priceDifferencePercent.toFixed(1)}% plus élevés que la moyenne du marché (€${cat.operatorAvgPrice} vs €${cat.marketAvgPrice}).`,
            action: 'Réviser les prix',
            category: cat.category,
          });
        } else if (cat.priceDifferencePercent < -20) {
          recommendations.push({
            type: 'pricing',
            priority: 'low',
            title: `Opportunité d'augmentation de prix - ${cat.category}`,
            message: `Vos prix sont ${Math.abs(cat.priceDifferencePercent).toFixed(1)}% inférieurs à la moyenne. Vous pourriez augmenter vos prix.`,
            action: 'Analyser la possibilité d\'augmenter les prix',
            category: cat.category,
          });
        }
      }
    });

    // Low performing products
    const lowPerformers = productPerformance
      .filter((p) => p.conversionRate < 1 && p.views > 10)
      .slice(0, 3);
    if (lowPerformers.length > 0) {
      recommendations.push({
        type: 'product',
        priority: 'high',
        title: 'Produits à faible performance',
        message: `${lowPerformers.length} produit(s) ont un taux de conversion inférieur à 1% malgré un bon nombre de vues.`,
        action: 'Optimiser ces produits',
        products: lowPerformers.map((p) => p.title),
      });
    }

    // Missing reviews
    const productsWithoutReviews = productPerformance.filter(
      (p) => p.reviews === 0 && p.bookings > 0
    );
    if (productsWithoutReviews.length > 0) {
      recommendations.push({
        type: 'reviews',
        priority: 'medium',
        title: 'Demander des avis',
        message: `${productsWithoutReviews.length} produit(s) avec des réservations n'ont pas encore d'avis.`,
        action: 'Encourager les clients à laisser des avis',
        products: productsWithoutReviews.map((p) => p.title),
      });
    }

    res.json({
      funnel: {
        views,
        inquiries,
        bookings,
        viewToInquiryRate: Math.round(viewToInquiryRate * 100) / 100,
        inquiryToBookingRate: Math.round(inquiryToBookingRate * 100) / 100,
        viewToBookingRate: Math.round(viewToBookingRate * 100) / 100,
      },
      revenue: {
        total: totalRevenue,
        average: avgRevenuePerBooking,
        bookings: bookings,
      },
      productPerformance,
      competition: categoryComparison,
      recommendations,
      period: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    });
  } catch (error) {
    console.error('Get advanced analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch advanced analytics' });
  }
};

// @desc    Export analytics data as CSV
// @route   GET /api/operator/analytics/export/csv
// @access  Private/Operator
const exportAnalyticsCSV = async (req, res) => {
  try {
    const operator = await Operator.findOne({ user: req.user._id });
    if (!operator) {
      return res.status(404).json({ message: 'Operator profile not found' });
    }

    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const products = await Product.find({ operator: operator._id });
    const productIds = products.map(p => p._id);

    const views = await ViewHistory.countDocuments({
      product: { $in: productIds },
      ...(startDate || endDate ? { viewedAt: dateFilter.createdAt } : {}),
    });

    const Inquiry = (await import('../models/inquiryModel.js')).default;
    const inquiries = await Inquiry.countDocuments({
      product: { $in: productIds },
      ...dateFilter,
    });

    const bookings = await Booking.countDocuments({
      operator: operator._id,
      status: { $ne: 'Cancelled' },
      ...dateFilter,
    });

    const bookingDocs = await Booking.find({
      operator: operator._id,
      status: { $ne: 'Cancelled' },
      ...dateFilter,
    }).populate({
      path: 'schedule',
      populate: { path: 'product' },
    });

    const totalRevenue = bookingDocs.reduce(
      (sum, booking) => sum + (booking.totalPrice ?? booking.totalAmount ?? 0),
      0
    );

    const avgRevenuePerBooking = bookings > 0 ? totalRevenue / bookings : 0;
    const viewToBookingRate = views > 0 ? (bookings / views) * 100 : 0;

    const productPerformance = await Promise.all(
      products.map(async (product) => {
        const productViews = await ViewHistory.countDocuments({
          product: product._id,
          ...(startDate || endDate ? { viewedAt: dateFilter.createdAt } : {}),
        });

        const productBookings = await Booking.countDocuments({
          operator: operator._id,
          'schedule.product': product._id,
          status: { $ne: 'Cancelled' },
          ...dateFilter,
        });

        const productRevenue = bookingDocs
          .filter(b => b.schedule?.product?.toString() === product._id.toString())
          .reduce((sum, b) => sum + (b.totalPrice ?? b.totalAmount ?? 0), 0);

        const conversionRate = productViews > 0 ? (productBookings / productViews) * 100 : 0;

        return {
          title: product.title,
          views: productViews,
          bookings: productBookings,
          revenue: productRevenue,
          conversionRate: Math.round(conversionRate * 100) / 100,
        };
      })
    );
    
    // Convert to CSV format
    let csv = 'Metric,Value\n';
    csv += `Total Views,${views}\n`;
    csv += `Total Inquiries,${inquiries}\n`;
    csv += `Total Bookings,${bookings}\n`;
    csv += `View to Booking Rate,${viewToBookingRate.toFixed(2)}%\n`;
    csv += `Total Revenue,€${totalRevenue.toFixed(2)}\n`;
    csv += `Average Revenue per Booking,€${avgRevenuePerBooking.toFixed(2)}\n\n`;
    
    csv += 'Product Performance\n';
    csv += 'Product,Views,Bookings,Revenue,Conversion Rate\n';
    productPerformance.forEach((p) => {
      csv += `"${p.title}",${p.views},${p.bookings},€${p.revenue.toFixed(2)},${p.conversionRate}%\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-${new Date().toISOString().split('T')[0]}.csv`);
    res.send('\ufeff' + csv); // BOM for Excel compatibility
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ message: 'Failed to export analytics' });
  }
};


export { getAdvancedAnalytics, exportAnalyticsCSV };

