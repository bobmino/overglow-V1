import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Home, Search, Package, Calendar, TrendingUp, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LocalizedLink from './LocalizedLink';

/**
 * Nav secondaire pour l’espace voyageur (/dashboard).
 * Les zones admin/opérateur utilisent AdminSidebar — ne pas dupliquer ici.
 */
const DashboardNavBar = ({ className = '' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isOperatorRoute = location.pathname.startsWith('/operator');

  const getParentRoute = () => {
    const path = location.pathname;
    if (path.match(/^\/operator\/products\/[^/]+\/edit$/)) return '/operator/products';
    if (path === '/operator/products/new') return '/operator/products';
    if (path === '/operator/bookings') return '/operator/dashboard';
    if (path === '/operator/analytics') return '/operator/dashboard';
    return null;
  };

  const handleBack = () => {
    const parentRoute = getParentRoute();
    if (parentRoute) navigate(parentRoute);
    else navigate(-1);
  };

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:border-primary-600 hover:text-primary-700 transition"
      >
        <ArrowLeft size={16} />
        {t('common.back', 'Retour')}
      </button>

      {isOperatorRoute && (
        <>
          {location.pathname !== '/operator/dashboard' && (
            <Link
              to="/operator/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:border-primary-600 hover:text-primary-700 transition"
            >
              <BarChart3 size={16} />
              {t('nav.dashboard', 'Tableau de bord')}
            </Link>
          )}
          <Link
            to="/operator/products"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:border-primary-600 hover:text-primary-700 transition"
          >
            <Package size={16} />
            {t('nav.my_products', 'Mes produits')}
          </Link>
          <Link
            to="/operator/bookings"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:border-primary-600 hover:text-primary-700 transition"
          >
            <Calendar size={16} />
            {t('nav.my_bookings', 'Mes réservations')}
          </Link>
          <Link
            to="/operator/analytics"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:border-primary-600 hover:text-primary-700 transition"
          >
            <TrendingUp size={16} />
            {t('nav.analytics', 'Statistiques')}
          </Link>
        </>
      )}

      {!isOperatorRoute && location.pathname.startsWith('/admin') && (
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:border-primary-600 hover:text-primary-700 transition"
        >
          <Home size={16} />
          {t('nav.dashboard', 'Tableau de bord')}
        </Link>
      )}

      {!isOperatorRoute && !location.pathname.startsWith('/admin') && (
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:border-primary-600 hover:text-primary-700 transition"
        >
          <Home size={16} />
          {t('nav.dashboard', 'Tableau de bord')}
        </Link>
      )}
      <LocalizedLink
        to="/search"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:border-primary-600 hover:text-primary-700 transition"
      >
        <Search size={16} />
        {t('nav.search', 'Recherche')}
      </LocalizedLink>
    </div>
  );
};

export default DashboardNavBar;
