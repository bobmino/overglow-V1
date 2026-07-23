import Booking from '../models/bookingModel.js';
import Operator from '../models/operatorModel.js';
import Product from '../models/productModel.js';
import ViewHistory from '../models/viewHistoryModel.js';
import Review from '../models/reviewModel.js';
import Schedule from '../models/scheduleModel.js';
import { logger } from '../utils/logger.js';

const formatMad = (n) => `${Number(n || 0).toFixed(2)} MAD`;

/**
 * Réservations liées à un produit via Schedule (booking.schedule → schedule.product).
 */
const countBookingsForProduct = (bookingDocs, scheduleIdsForProduct) => {
  if (!scheduleIdsForProduct?.length) return 0;
  const set = new Set(scheduleIdsForProduct.map((id) => String(id)));
  return bookingDocs.filter((b) => {
    const sid = b.schedule?._id || b.schedule;
    return sid && set.has(String(sid));
  }).length;
};

const sumRevenueForProduct = (bookingDocs, scheduleIdsForProduct) => {
  if (!scheduleIdsForProduct?.length) return 0;
  const set = new Set(scheduleIdsForProduct.map((id) => String(id)));
  return bookingDocs.reduce((sum, b) => {
    const sid = b.schedule?._id || b.schedule;
    if (!sid || !set.has(String(sid))) return sum;
    return sum + (b.totalPrice ?? b.totalAmount ?? 0);
  }, 0);
};

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

    const products = await Product.find({ operator: operator._id });
    const productIds = products.map((p) => p._id);

    const views = await ViewHistory.countDocuments({
      product: { $in: productIds },
      ...(startDate || endDate ? { viewedAt: dateFilter.createdAt } : {}),
    });

    const Inquiry = (await import('../models/inquiryModel.js')).default;
    const inquiries = await Inquiry.countDocuments({
      product: { $in: productIds },
      ...dateFilter,
    });

    const bookingDocs = await Booking.find({
      operator: operator._id,
      status: { $ne: 'Cancelled' },
      ...dateFilter,
    }).populate('schedule', 'product date');

    const bookings = bookingDocs.length;

    const viewToInquiryRate = views > 0 ? (inquiries / views) * 100 : 0;
    const inquiryToBookingRate = inquiries > 0 ? (bookings / inquiries) * 100 : 0;
    // Conversion fiable : si vues < résas (tracking incomplet), ne pas inventer 100%+
    const viewToBookingRate =
      views > 0 ? Math.min(100, (bookings / views) * 100) : bookings > 0 ? null : 0;

    const totalRevenue = bookingDocs.reduce(
      (sum, booking) => sum + (booking.totalPrice ?? booking.totalAmount ?? 0),
      0
    );
    const avgRevenuePerBooking = bookings > 0 ? totalRevenue / bookings : 0;

    const schedules = await Schedule.find({ product: { $in: productIds } }).select('_id product');
    const scheduleIdsByProduct = new Map();
    schedules.forEach((s) => {
      const key = String(s.product);
      if (!scheduleIdsByProduct.has(key)) scheduleIdsByProduct.set(key, []);
      scheduleIdsByProduct.get(key).push(s._id);
    });

    const productPerformance = await Promise.all(
      products.map(async (product) => {
        const schedIds = scheduleIdsByProduct.get(String(product._id)) || [];
        const productViews = await ViewHistory.countDocuments({
          product: product._id,
          ...(startDate || endDate ? { viewedAt: dateFilter.createdAt } : {}),
        });
        const productBookings = countBookingsForProduct(bookingDocs, schedIds);
        const productReviews = await Review.countDocuments({
          product: product._id,
          ...dateFilter,
        });
        const productRevenue = sumRevenueForProduct(bookingDocs, schedIds);
        const conversionRate =
          productViews > 0
            ? Math.round(Math.min(100, (productBookings / productViews) * 100) * 100) / 100
            : productBookings > 0
              ? null
              : 0;

        return {
          productId: product._id,
          title: product.title,
          views: productViews,
          bookings: productBookings,
          reviews: productReviews,
          revenue: productRevenue,
          conversionRate,
          averageRating: product.metrics?.averageRating || 0,
        };
      })
    );

    // Marché = produits Published des AUTRES opérateurs (vrai benchmark concurrentiel)
    const competitionAnalysis = await Product.aggregate([
      {
        $match: {
          status: 'Published',
          category: { $exists: true, $ne: null },
          operator: { $ne: operator._id },
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
      { $sort: { avgPrice: 1 } },
    ]);

    // Fallback soft-launch : si peu de concurrents, inclure tout le catalogue Published
    let marketByCategory = competitionAnalysis;
    if (marketByCategory.length === 0) {
      marketByCategory = await Product.aggregate([
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
        { $sort: { avgPrice: 1 } },
      ]);
    }

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

    const categoryComparison = marketByCategory.map((cat) => {
      const operatorData = operatorCategoryPrices.find((op) => op._id === cat._id);
      return {
        category: cat._id,
        marketAvgPrice: Math.round(cat.avgPrice * 100) / 100,
        marketMinPrice: Math.round(cat.minPrice * 100) / 100,
        marketMaxPrice: Math.round(cat.maxPrice * 100) / 100,
        marketCount: cat.count,
        operatorAvgPrice: operatorData ? Math.round(operatorData.avgPrice * 100) / 100 : null,
        operatorCount: operatorData ? operatorData.count : 0,
        priceDifference:
          operatorData && cat.avgPrice
            ? Math.round((operatorData.avgPrice - cat.avgPrice) * 100) / 100
            : null,
        priceDifferencePercent:
          operatorData && cat.avgPrice
            ? Math.round(((operatorData.avgPrice - cat.avgPrice) / cat.avgPrice) * 10000) / 100
            : null,
      };
    });

    const recommendations = [];

    if (viewToBookingRate !== null && viewToBookingRate < 2 && views >= 5) {
      recommendations.push({
        type: 'conversion',
        priority: 'high',
        title: 'Taux de conversion faible',
        message: `Votre taux de conversion vues → réservations est de ${viewToBookingRate.toFixed(1)} %. Améliorez photos, titre et prix pour convertir davantage.`,
        action: 'Optimiser les pages produits',
      });
    } else if (views === 0 && bookings > 0) {
      recommendations.push({
        type: 'tracking',
        priority: 'low',
        title: 'Vues catalogue à compléter',
        message:
          'Des réservations existent mais peu de vues sont trackées. Le funnel se renforcera avec le trafic catalogue.',
        action: 'Continuer à publier et partager vos offres',
      });
    }

    categoryComparison.forEach((cat) => {
      if (cat.operatorAvgPrice == null || cat.priceDifferencePercent == null) return;
      if (cat.marketCount < 1) return;

      if (cat.priceDifferencePercent > 20) {
        recommendations.push({
          type: 'pricing',
          priority: 'medium',
          title: `Prix élevé — ${cat.category}`,
          message: `Vos prix sont ${cat.priceDifferencePercent.toFixed(1)} % au-dessus de la moyenne Overglow (${formatMad(cat.operatorAvgPrice)} vs ${formatMad(cat.marketAvgPrice)}, ${cat.marketCount} offre(s) marché).`,
          action: 'Réviser les prix',
          category: cat.category,
        });
      } else if (cat.priceDifferencePercent < -20) {
        recommendations.push({
          type: 'pricing',
          priority: 'low',
          title: `Marge possible — ${cat.category}`,
          message: `Vos prix sont ${Math.abs(cat.priceDifferencePercent).toFixed(1)} % sous la moyenne (${formatMad(cat.operatorAvgPrice)} vs ${formatMad(cat.marketAvgPrice)}). Vous pouvez tester une hausse progressive.`,
          action: 'Analyser une hausse de prix',
          category: cat.category,
        });
      }
    });

    const lowPerformers = productPerformance
      .filter((p) => p.conversionRate !== null && p.conversionRate < 1 && p.views > 10)
      .slice(0, 3);
    if (lowPerformers.length > 0) {
      recommendations.push({
        type: 'product',
        priority: 'high',
        title: 'Produits à faible performance',
        message: `${lowPerformers.length} produit(s) convertissent peu malgré du trafic. Revoir photos, description et créneaux.`,
        action: 'Optimiser ces produits',
        products: lowPerformers.map((p) => p.title),
      });
    }

    const productsWithoutReviews = productPerformance.filter(
      (p) => p.reviews === 0 && p.bookings > 0
    );
    if (productsWithoutReviews.length > 0) {
      recommendations.push({
        type: 'reviews',
        priority: 'medium',
        title: 'Demander des avis',
        message: `${productsWithoutReviews.length} produit(s) ont des réservations sans avis — les avis boostent la confiance et le ranking.`,
        action: 'Encourager les clients à laisser un avis',
        products: productsWithoutReviews.map((p) => p.title),
      });
    }

    const priorityRank = { high: 0, medium: 1, low: 2 };
    recommendations.sort(
      (a, b) => (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9)
    );

    res.json({
      currency: 'MAD',
      meta: {
        marketScope:
          competitionAnalysis.length > 0
            ? 'other_operators_published'
            : 'all_published_softlaunch',
        explanation:
          'Benchmark prix = moyenne des offres publiées Overglow (hors vos fiches si d’autres opérateurs existent). Recommandations générées automatiquement à partir de vos vues, demandes et réservations réelles.',
      },
      funnel: {
        views,
        inquiries,
        bookings,
        viewToInquiryRate: Math.round(viewToInquiryRate * 100) / 100,
        inquiryToBookingRate: Math.round(inquiryToBookingRate * 100) / 100,
        viewToBookingRate:
          viewToBookingRate === null ? null : Math.round(viewToBookingRate * 100) / 100,
      },
      revenue: {
        total: totalRevenue,
        average: avgRevenuePerBooking,
        bookings,
        currency: 'MAD',
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
    logger.error('Get advanced analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch advanced analytics' });
  }
};

// @desc    Export analytics data as CSV
// @route   GET /api/operator/analytics/export/csv
// @access  Private/Operator
const exportAnalyticsCSV = async (req, res) => {
  try {
    // Réutilise la logique advanced via un faux call interne serait lourd ;
    // on recalcule les agrégats essentiels (même règles MAD).
    req.query = req.query || {};
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
    if (fakeRes.statusCode !== 200 || !fakeRes.body) {
      return res.status(fakeRes.statusCode || 500).json(fakeRes.body || { message: 'Export failed' });
    }

    const data = fakeRes.body;
    const funnel = data.funnel || {};
    const revenue = data.revenue || {};
    const productPerformance = data.productPerformance || [];

    let csv = 'Metric,Value\n';
    csv += `Total Views,${funnel.views || 0}\n`;
    csv += `Total Inquiries,${funnel.inquiries || 0}\n`;
    csv += `Total Bookings,${funnel.bookings || 0}\n`;
    csv += `View to Booking Rate,${funnel.viewToBookingRate ?? 'n/a'}%\n`;
    csv += `Total Revenue MAD,${Number(revenue.total || 0).toFixed(2)}\n`;
    csv += `Average Revenue per Booking MAD,${Number(revenue.average || 0).toFixed(2)}\n\n`;
    csv += 'Product Performance\n';
    csv += 'Product,Views,Bookings,Revenue MAD,Conversion Rate\n';
    productPerformance.forEach((p) => {
      csv += `"${String(p.title || '').replace(/"/g, '""')}",${p.views},${p.bookings},${Number(p.revenue || 0).toFixed(2)},${p.conversionRate ?? 'n/a'}\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=analytics-${new Date().toISOString().split('T')[0]}.csv`
    );
    res.send(`\ufeff${csv}`);
  } catch (error) {
    logger.error('Export CSV error:', error);
    res.status(500).json({ message: 'Failed to export analytics' });
  }
};

export { getAdvancedAnalytics, exportAnalyticsCSV };
