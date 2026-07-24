import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import {
  Package,
  Calendar,
  Users,
  Plus,
  ClipboardList,
  MessageSquare,
  UserRound,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Info,
  Heart,
} from 'lucide-react';
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
      className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-primary-200 transition"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-600 to-secondary-500" />
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
      <p className="text-slate-500 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold text-slate-900 font-heading">{value}</p>
    </Motion.div>
  );
};

/**
 * Operator dashboard — stats + Insights Overglow + activité récente.
 */
const OperatorDashboardPage = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const dateLocale = getDateLocale(i18n.language);

  const [stats, setStats] = useState({
    totalSales: 0,
    confirmedBookings: 0,
    topExperiences: [],
    insights: { recommendations: [] },
    pendingCount: 0,
  });

  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/api/operator/dashboard-stats');
        setStats({
          totalSales: data.totalSales ?? data.totalRevenue ?? 0,
          confirmedBookings: data.confirmedBookings ?? data.confirmedBookingsCount ?? 0,
          topExperiences: data.topExperiences || [],
          insights: data.insights || { recommendations: [] },
          pendingCount: data.pendingCount || 0,
        });
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
      stats.pendingCount ||
      bookings.filter((b) =>
        ['Pending', 'PENDING', 'PENDING_PAYMENT'].includes(b.status)
      ).length,
    [bookings, stats.pendingCount]
  );

  const insightRecs = stats.insights?.recommendations || [];

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
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white px-6 py-8 md:px-10 md:py-10">
        <div className="absolute -end-16 -top-16 w-56 h-56 rounded-full bg-secondary-500/20 blur-3xl pointer-events-none" />
        <p className="relative text-xs uppercase tracking-[0.2em] text-primary-200/90 mb-2">Overglow Host</p>
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-heading">
              {t('operator.dashboard.title')}
            </h1>
            {pendingCount > 0 && (
              <p className="text-secondary-500 text-sm font-semibold mt-2">
                {pendingCount === 1
                  ? t('operator.dashboard.pending_bookings', { count: pendingCount })
                  : t('operator.dashboard.pending_bookings_plural', { count: pendingCount })}
              </p>
            )}
            <p className="text-primary-100/90 text-sm mt-2 max-w-xl">
              {t(
                'operator.dashboard.cockpit_hint',
                'Pilotez offres, réservations clients et vos voyages personnels depuis un seul cockpit.'
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 bg-white/15 border border-white/25 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-white/25 transition"
            >
              <Heart size={18} />
              {t('admin.nav.my_trips', 'Mes réservations perso')}
            </Link>
            <Link
              to="/operator/products/new"
              className="inline-flex items-center justify-center gap-2 bg-white text-primary-900 px-4 py-2.5 rounded-xl font-bold hover:bg-primary-50 transition"
            >
              <Plus size={18} />
              {t('operator.dashboard.create_product')}
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          <Link
            to="/operator/account"
            className="inline-flex items-center justify-center gap-2 bg-white text-slate-800 border border-slate-200 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition"
          >
            <UserRound size={18} />
            {t('operator.dashboard.profile', 'Profil')}
          </Link>
          <Link
            to="/operator/wizard"
            className="inline-flex items-center justify-center gap-2 bg-white text-primary-800 border border-primary-200 px-4 py-2.5 rounded-xl font-bold hover:bg-primary-50 transition"
          >
            <ClipboardList size={18} />
            {t('operator.dashboard.view_fiche', 'Ma fiche')}
          </Link>
          <Link
            to="/operator/inquiries"
            className="inline-flex items-center justify-center gap-2 bg-white text-slate-800 border border-slate-200 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition"
          >
            <MessageSquare size={18} />
            {t('operator.dashboard.messages', 'Messages')}
          </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={Package}
          label={t('operator.dashboard.total_sales')}
          value={`${Number(stats.totalSales || 0).toFixed(2)} MAD`}
          color="bg-primary-600"
        />
        <StatCard
          icon={Calendar}
          label={t('operator.dashboard.confirmed_bookings')}
          value={stats.confirmedBookings}
          color="bg-secondary-600"
        />
        <StatCard
          icon={Users}
          label={t('operator.dashboard.top_experiences')}
          value={stats.topExperiences?.length || 0}
          color="bg-primary-800"
        />
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 mb-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-primary-500/20 text-primary-300">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold">Insights Overglow</h2>
              <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                Conseils calculés sur vos vues, réservations et les prix du catalogue Overglow —
                pour piloter vos offres comme un extranet intelligent.
              </p>
            </div>
          </div>
          <Link
            to="/operator/analytics"
            className="inline-flex items-center gap-2 shrink-0 bg-primary-600 hover:bg-primary-500 text-white font-bold px-4 py-2.5 rounded-xl transition"
          >
            Voir les stats
            <ArrowRight size={16} />
          </Link>
        </div>

        {insightRecs.length === 0 ? (
          <p className="text-slate-300 text-sm bg-white/5 rounded-xl px-4 py-3 border border-white/10">
            Pas d’alerte prioritaire pour le moment. Ouvrez les statistiques pour le benchmark prix
            et le funnel de conversion.
          </p>
        ) : (
          <ul className="space-y-3">
            {insightRecs.map((rec, idx) => (
              <li
                key={`${rec.type}-${idx}`}
                className="flex gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
              >
                <span className="mt-0.5 text-amber-300 shrink-0">
                  {rec.priority === 'high' ? <AlertCircle size={18} /> : <Info size={18} />}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm">{rec.title}</p>
                  <p className="text-slate-300 text-sm mt-0.5 line-clamp-2">{rec.message}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

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
