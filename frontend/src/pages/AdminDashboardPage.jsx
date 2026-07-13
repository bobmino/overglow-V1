import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { Users, Building2, Package, Calendar, DollarSign, CheckCircle, Clock } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import DashboardNavBar from '../components/DashboardNavBar';
import AdminAnalytics from '../components/AdminAnalytics';

const StatCard = ({ icon: Icon, label, value, color, onClick }) => (
  <div
    className={`bg-white rounded-xl border border-gray-200 p-6 ${onClick ? 'cursor-pointer hover:border-primary-600 hover:shadow-lg transition' : ''}`}
    onClick={onClick && typeof onClick === 'function' ? onClick : undefined}
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
    <p className="text-gray-600 text-sm mb-1">{label}</p>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
  </div>
);

const AdminDashboardPage = () => {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOperators: 0,
    totalProducts: 0,
    totalBookings: 0,
    pendingProducts: 0,
    publishedProducts: 0,
    totalRevenue: 0,
    operatorsByStatus: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/api/admin/stats');
        setStats(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 bg-slate-50 min-h-screen">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 font-heading">{t('admin.dashboard.title')}</h1>
        <DashboardNavBar />
      </div>

      <div className="mb-10">
        <AdminAnalytics />
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          to="/admin/operators"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
        >
          {t('admin.dashboard.nav_manage_operators')}
        </Link>
        <Link
          to="/admin/products"
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition"
        >
          {t('admin.dashboard.nav_validate_products')}
        </Link>
        <Link
          to="/admin/users"
          className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 transition"
        >
          {t('admin.dashboard.nav_manage_users')}
        </Link>
        <Link
          to="/admin/settings"
          className="bg-gray-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-700 transition"
        >
          {t('admin.dashboard.nav_settings')}
        </Link>
        <Link
          to="/admin/withdrawals"
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition"
        >
          {t('admin.dashboard.nav_withdrawals')}
        </Link>
        <Link
          to="/admin/approval-requests"
          className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-700 transition"
        >
          {t('admin.dashboard.nav_approval_requests')}
        </Link>
        <Link
          to="/admin/badge-requests"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition"
        >
          {t('admin.dashboard.nav_badge_requests')}
        </Link>
        <Link
          to="/admin/blog"
          className="bg-pink-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-pink-700 transition"
        >
          {t('admin.dashboard.nav_manage_blog')}
        </Link>
        <Link
          to="/admin/pending-payments"
          className="bg-amber-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-amber-700 transition"
        >
          {t('admin.dashboard.nav_pending_payments')}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link to="/admin/users">
          <StatCard
            icon={Users}
            label={t('admin.dashboard.stats_total_users')}
            value={stats.totalUsers}
            color="bg-blue-600"
          />
        </Link>
        <Link to="/admin/operators">
          <StatCard
            icon={Building2}
            label={t('admin.dashboard.stats_total_operators')}
            value={stats.totalOperators}
            color="bg-green-600"
          />
        </Link>
        <Link to="/admin/products">
          <StatCard
            icon={Package}
            label={t('admin.dashboard.stats_total_products')}
            value={stats.totalProducts}
            color="bg-purple-600"
          />
        </Link>
        <StatCard
          icon={Calendar}
          label={t('admin.dashboard.stats_total_bookings')}
          value={stats.totalBookings}
          color="bg-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link to="/admin/products?status=Pending Review">
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-yellow-500 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-yellow-600">
                <Clock size={24} className="text-white" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">{t('admin.dashboard.stats_pending_products')}</p>
            <p className="text-3xl font-bold text-gray-900">{stats.pendingProducts}</p>
          </div>
        </Link>
        <Link to="/admin/products?status=Published">
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-green-500 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-green-600">
                <CheckCircle size={24} className="text-white" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">{t('admin.dashboard.stats_published_products')}</p>
            <p className="text-3xl font-bold text-gray-900">{stats.publishedProducts}</p>
          </div>
        </Link>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-emerald-600">
              <DollarSign size={24} className="text-white" />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">{t('admin.dashboard.stats_total_revenue')}</p>
          <p className="text-3xl font-bold text-gray-900">€{stats.totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/admin/operators"
          className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-blue-600 hover:shadow-lg transition"
        >
          <Building2 size={32} className="text-blue-600 mb-3" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">{t('admin.dashboard.quick_manage_operators')}</h3>
          <p className="text-gray-600">{t('admin.dashboard.quick_manage_operators_desc')}</p>
        </Link>

        <Link
          to="/admin/products"
          className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-green-600 hover:shadow-lg transition"
        >
          <Package size={32} className="text-green-600 mb-3" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">{t('admin.dashboard.quick_validate_products')}</h3>
          <p className="text-gray-600">{t('admin.dashboard.quick_validate_products_desc')}</p>
        </Link>

        <Link
          to="/admin/users"
          className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-purple-600 hover:shadow-lg transition"
        >
          <Users size={32} className="text-purple-600 mb-3" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">{t('admin.dashboard.quick_manage_users')}</h3>
          <p className="text-gray-600">{t('admin.dashboard.quick_manage_users_desc')}</p>
        </Link>
      </div>

      <ScrollToTopButton />
    </div>
  );
};

export default AdminDashboardPage;
