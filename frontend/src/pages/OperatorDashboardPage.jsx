import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { Package, Calendar, Users, Plus, ClipboardList, MessageSquare, UserRound } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { useToast } from '../context/ToastContext';
import { motion as Motion } from 'framer-motion';
import { logger } from '../utils/logger.js';

const getDateLocale = (language) => {
  const locale = language?.slice(0, 2) || 'fr';
  if (locale === 'ar') return 'ar-MA';
  if (locale === 'es') return 'es-ES';
  if (locale === 'en') return 'en-GB';
  return 'fr-FR';
};

const StatCard = ({ icon, label, value, color }) => {
  const Icon = icon;
  return (
  <Motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    className="bg-white rounded-xl border border-gray-200 p-6"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
    <p className="text-gray-600 text-sm mb-1">{label}</p>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
  </Motion.div>
  );
};

/**
 * [PROMPT-9] Operator dashboard — stats + activity (nav via sidebar).
 */
const OperatorDashboardPage = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const dateLocale = getDateLocale(i18n.language);

  const [stats, setStats] = useState({
    totalSales: 0,
    confirmedBookings: 0,
    topExperiences: [],
  });

  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/api/operator/dashboard-stats');
        setStats(data);
      } catch (error) {
        logger.error('Failed to fetch stats:', error);
        toast(t('operator.dashboard.error_stats'), { type: 'error' });
      }
    };

    const fetchBookings = async () => {
      try {
        const { data } = await api.get('/api/operator/bookings');
        const list = Array.isArray(data) ? data : data.bookings || [];
        setBookings(list);
        setFilteredBookings(list);
      } catch (error) {
        logger.error('Failed to fetch bookings:', error);
        toast(t('operator.dashboard.error_bookings'), { type: 'error' });
      }
    };

    fetchStats();
    fetchBookings();
  }, [toast, t]);

  const pendingCount = useMemo(
    () =>
      bookings.filter((b) =>
        ['Pending', 'PENDING', 'PENDING_PAYMENT'].includes(b.status)
      ).length,
    [bookings]
  );

  const getBookingStatusLabel = (status) => {
    switch (status) {
      case 'Confirmed':
      case 'CONFIRMED':
        return t('operator.bookings.status_confirmed');
      case 'Pending':
      case 'PENDING':
        return t('operator.bookings.status_pending');
      case 'Cancelled':
      case 'CANCELLED':
        return t('operator.bookings.status_cancelled');
      case 'PENDING_PAYMENT':
        return t('operator.bookings.status_pending_payment');
      default:
        return status;
    }
  };

  const handleFilterChange = (event) => {
    const query = event.target.value.toLowerCase();
    const filtered = bookings.filter((booking) =>
      (booking.customerEmail || '').toLowerCase().includes(query)
    );
    setFilteredBookings(filtered);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-heading">
            {t('operator.dashboard.title')}
          </h1>
              {pendingCount > 0 && (
            <p className="text-amber-700 text-sm font-semibold mt-1">
              {pendingCount === 1
                ? t('operator.dashboard.pending_bookings', { count: pendingCount })
                : t('operator.dashboard.pending_bookings_plural', { count: pendingCount })}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          <Link
            to="/operator/account"
            className="inline-flex items-center justify-center gap-2 bg-white text-slate-800 border border-slate-200 px-4 py-2.5 rounded-lg font-bold hover:bg-slate-50 transition"
          >
            <UserRound size={18} />
            {t('operator.dashboard.profile', 'Profil')}
          </Link>
          <Link
            to="/operator/wizard"
            className="inline-flex items-center justify-center gap-2 bg-white text-primary-800 border border-primary-200 px-4 py-2.5 rounded-lg font-bold hover:bg-primary-50 transition"
          >
            <ClipboardList size={18} />
            {t('operator.dashboard.view_fiche', 'Ma fiche')}
          </Link>
          <Link
            to="/operator/inquiries"
            className="inline-flex items-center justify-center gap-2 bg-white text-slate-800 border border-slate-200 px-4 py-2.5 rounded-lg font-bold hover:bg-slate-50 transition"
          >
            <MessageSquare size={18} />
            {t('operator.dashboard.messages', 'Messages')}
          </Link>
          <Link
            to="/operator/products/new"
            className="inline-flex items-center justify-center gap-2 bg-primary-700 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-primary-800 transition"
          >
            <Plus size={18} />
            {t('operator.dashboard.create_product')}
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={Package}
          label={t('operator.dashboard.total_sales')}
          value={`${Number(stats.totalSales || 0).toFixed(2)} MAD`}
          color="bg-blue-600"
        />
        <StatCard
          icon={Calendar}
          label={t('operator.dashboard.confirmed_bookings')}
          value={stats.confirmedBookings}
          color="bg-purple-600"
        />
        <StatCard
          icon={Users}
          label={t('operator.dashboard.top_experiences')}
          value={stats.topExperiences?.length || 0}
          color="bg-primary-600"
        />
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8" id="avis">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {t('operator.dashboard.bookings_section')}
          </h2>
          <input
            type="text"
            placeholder={t('operator.dashboard.search_email_placeholder')}
            onChange={handleFilterChange}
            className="border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-6 py-3 text-start">{t('operator.dashboard.customer_email')}</th>
                <th className="px-6 py-3 text-start">{t('operator.dashboard.booking_date')}</th>
                <th className="px-6 py-3 text-start">{t('operator.dashboard.status')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    {t('operator.dashboard.no_recent_bookings')}
                  </td>
                </tr>
              ) : (
                filteredBookings.slice(0, 20).map((booking) => (
                  <tr key={booking.id || booking._id} className="border-b border-gray-200">
                    <td className="px-6 py-4">{booking.customerEmail || '—'}</td>
                    <td className="px-6 py-4">
                      {booking.date
                        ? new Date(booking.date).toLocaleDateString(dateLocale)
                        : '—'}
                    </td>
                    <td className="px-6 py-4">{getBookingStatusLabel(booking.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-end">
          <Link
            to="/operator/bookings"
            className="text-sm font-semibold text-primary-700 hover:text-primary-800"
          >
            {t('operator.dashboard.view_all_bookings')}
          </Link>
        </div>
      </div>

      <ScrollToTopButton />
    </div>
  );
};

export default OperatorDashboardPage;
