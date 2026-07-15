import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { logger } from '../utils/logger.js';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';
import {
  DollarSign, Users, TrendingUp, Package, Eye, MessageSquare,
  Download, AlertCircle, CheckCircle, Info, Target
} from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const StatCard = ({ icon: _Icon, label, value, color, subtitle }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <_Icon size={24} className="text-white" />
      </div>
    </div>
    <p className="text-gray-600 text-sm mb-1">{label}</p>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
  </div>
);

const AnalyticsPage = () => {
  const { t } = useTranslation();
  const [basicData, setBasicData] = useState(null);
  const [advancedData, setAdvancedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  const tabs = [
    { id: 'overview', label: t('analytics.tabs.overview') },
    { id: 'funnel', label: t('analytics.tabs.funnel') },
    { id: 'competition', label: t('analytics.tabs.competition') },
    { id: 'recommendations', label: t('analytics.tabs.recommendations') },
  ];

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [basicRes, advancedRes] = await Promise.all([
        api.get('/api/operator/analytics'),
        api.get('/api/operator/analytics/advanced', {
          params: {
            startDate: dateRange.startDate || undefined,
            endDate: dateRange.endDate || undefined,
          },
        }),
      ]);
      setBasicData(basicRes.data);
      setAdvancedData(advancedRes.data);
      setLoading(false);
    } catch (_err) {
      setError(t('analytics.load_error'));
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/api/operator/analytics/export/csv', {
        params: {
          startDate: dateRange.startDate || undefined,
          endDate: dateRange.endDate || undefined,
        },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      logger.error('Export failed:', error);
      alert(t('analytics.export_error'));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
      </div>
    );
  }

  const totalRevenue = basicData?.totalRevenue ?? 0;
  const totalBookings = basicData?.totalBookings ?? 0;
  const avgRevenue = basicData?.avgRevenuePerBooking ?? 0;
  const activeProducts = basicData?.activeProducts ?? 0;
  const revenueData = basicData?.revenueData ?? [];
  const productData = basicData?.productData ?? [];

  const funnel = advancedData?.funnel || {};
  const recommendations = advancedData?.recommendations || [];
  const competition = advancedData?.competition || [];
  const productPerformance = advancedData?.productPerformance || [];

  const funnelChartData = [
    { name: t('analytics.charts.funnel_views'), value: funnel.views || 0, rate: 100 },
    { name: t('analytics.charts.funnel_inquiries'), value: funnel.inquiries || 0, rate: funnel.viewToInquiryRate || 0 },
    { name: t('analytics.charts.funnel_bookings'), value: funnel.bookings || 0, rate: funnel.viewToBookingRate || 0 },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('analytics.title')}</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
          >
            <Download size={16} />
            {t('analytics.export_csv')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t('analytics.start_date')}</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t('analytics.end_date')}</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          {(dateRange.startDate || dateRange.endDate) && (
            <button
              onClick={() => setDateRange({ startDate: '', endDate: '' })}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              {t('common.reset')}
            </button>
          )}
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={DollarSign}
              label={t('analytics.stats.total_revenue')}
              value={`€${totalRevenue.toFixed(2)}`}
              color="bg-green-600"
            />
            <StatCard
              icon={Users}
              label={t('analytics.stats.bookings')}
              value={totalBookings}
              color="bg-blue-600"
            />
            <StatCard
              icon={TrendingUp}
              label={t('analytics.stats.avg_revenue')}
              value={`€${avgRevenue.toFixed(2)}`}
              color="bg-purple-600"
            />
            <StatCard
              icon={Package}
              label={t('analytics.stats.active_products')}
              value={activeProducts}
              color="bg-orange-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{t('analytics.charts.monthly_revenue')}</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `€${Number(value).toFixed(2)}`} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#15803d" name={t('analytics.charts.revenue_label')} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{t('analytics.charts.bookings_by_product')}</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="bookings"
                    >
                      {productData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'funnel' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              icon={Eye}
              label={t('analytics.stats.views')}
              value={funnel.views || 0}
              color="bg-blue-600"
            />
            <StatCard
              icon={MessageSquare}
              label={t('analytics.stats.inquiries')}
              value={funnel.inquiries || 0}
              color="bg-yellow-600"
              subtitle={t('analytics.stats.conversion', { rate: funnel.viewToInquiryRate?.toFixed(2) || 0 })}
            />
            <StatCard
              icon={Users}
              label={t('analytics.stats.bookings')}
              value={funnel.bookings || 0}
              color="bg-green-600"
              subtitle={t('analytics.stats.conversion', { rate: funnel.viewToBookingRate?.toFixed(2) || 0 })}
            />
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{t('analytics.charts.conversion_funnel')}</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={funnelChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#15803d" fill="#15803d" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('analytics.performance_title')}</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-start py-3 px-4 font-semibold text-gray-700">{t('analytics.table.product')}</th>
                    <th className="text-end py-3 px-4 font-semibold text-gray-700">{t('analytics.table.views')}</th>
                    <th className="text-end py-3 px-4 font-semibold text-gray-700">{t('analytics.table.bookings')}</th>
                    <th className="text-end py-3 px-4 font-semibold text-gray-700">{t('analytics.table.revenue')}</th>
                    <th className="text-end py-3 px-4 font-semibold text-gray-700">{t('analytics.table.conversion_rate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {productPerformance.map((product) => (
                    <tr key={product.productId} className="border-b border-gray-100">
                      <td className="py-3 px-4">{product.title}</td>
                      <td className="text-end py-3 px-4">{product.views}</td>
                      <td className="text-end py-3 px-4">{product.bookings}</td>
                      <td className="text-end py-3 px-4">€{product.revenue?.toFixed(2) || '0.00'}</td>
                      <td className="text-end py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          product.conversionRate >= 3 ? 'bg-green-100 text-green-800' :
                          product.conversionRate >= 1 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {product.conversionRate.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'competition' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('analytics.competition_title')}</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-start py-3 px-4 font-semibold text-gray-700">{t('analytics.table.category')}</th>
                    <th className="text-end py-3 px-4 font-semibold text-gray-700">{t('analytics.table.market_avg_price')}</th>
                    <th className="text-end py-3 px-4 font-semibold text-gray-700">{t('analytics.table.your_avg_price')}</th>
                    <th className="text-end py-3 px-4 font-semibold text-gray-700">{t('analytics.table.difference')}</th>
                    <th className="text-end py-3 px-4 font-semibold text-gray-700">{t('analytics.table.market_products')}</th>
                  </tr>
                </thead>
                <tbody>
                  {competition.map((cat) => (
                    <tr key={cat.category} className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium">{cat.category}</td>
                      <td className="text-end py-3 px-4">€{cat.marketAvgPrice?.toFixed(2) || t('admin.common.na')}</td>
                      <td className="text-end py-3 px-4">
                        {cat.operatorAvgPrice ? `€${cat.operatorAvgPrice.toFixed(2)}` : t('admin.common.na')}
                      </td>
                      <td className="text-end py-3 px-4">
                        {cat.priceDifference !== null ? (
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            cat.priceDifference > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {cat.priceDifference > 0 ? '+' : ''}€{cat.priceDifference.toFixed(2)}
                            {cat.priceDifferencePercent !== null && ` (${cat.priceDifferencePercent > 0 ? '+' : ''}${cat.priceDifferencePercent.toFixed(1)}%)`}
                          </span>
                        ) : t('admin.common.na')}
                      </td>
                      <td className="text-end py-3 px-4">{cat.marketCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          {recommendations.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
              <p className="text-green-800 font-semibold">{t('analytics.no_recommendations')}</p>
            </div>
          ) : (
            recommendations.map((rec, index) => (
              <div
                key={index}
                className={`border rounded-lg p-6 ${
                  rec.priority === 'high' ? 'bg-red-50 border-red-200' :
                  rec.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${
                    rec.priority === 'high' ? 'bg-red-600' :
                    rec.priority === 'medium' ? 'bg-yellow-600' :
                    'bg-blue-600'
                  }`}>
                    {rec.priority === 'high' ? (
                      <AlertCircle className="text-white" size={20} />
                    ) : (
                      <Info className="text-white" size={20} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2">{rec.title}</h3>
                    <p className="text-gray-700 mb-3">{rec.message}</p>
                    <div className="flex items-center gap-2">
                      <Target size={16} className="text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700">{rec.action}</span>
                    </div>
                    {rec.products && rec.products.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-1">{t('analytics.affected_products')}</p>
                        <ul className="list-disc list-inside text-sm text-gray-700">
                          {rec.products.map((product, idx) => (
                            <li key={idx}>{product}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <ScrollToTopButton />
    </div>
  );
};

export default AnalyticsPage;
