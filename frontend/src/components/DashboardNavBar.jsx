import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Home, Search, Package, Calendar, TrendingUp, BarChart3 } from 'lucide-react';

const DashboardNavBar = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isOperatorRoute = location.pathname.startsWith('/operator');

  // Smart back navigation: return to parent section
  const getParentRoute = () => {
    const path = location.pathname;
    
    // From product edit → products list
    if (path.match(/^\/operator\/products\/[^/]+\/edit$/)) {
      return '/operator/products';
    }
    
    // From product new → products list
    if (path === '/operator/products/new') {
      return '/operator/products';
    }
    
    // From bookings → dashboard
    if (path === '/operator/bookings') {
      return '/operator/dashboard';
    }
    
    // From analytics → dashboard
    if (path === '/operator/analytics') {
      return '/operator/dashboard';
    }
    
    // Default: browser back
    return null;
  };

  const handleBack = () => {
    const parentRoute = getParentRoute();
    if (parentRoute) {
      navigate(parentRoute);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:border-primary-600 hover:text-primary-700 transition"
      >
        <ArrowLeft size={16} />
        Retour
      </button>
      
      {isOperatorRoute && (
        <>
          <Link
            to="/operator/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:border-primary-600 hover:text-primary-700 transition"
          >
            <BarChart3 size={16} />
            Dashboard
          </Link>
          <Link
            to="/operator/products"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:border-primary-600 hover:text-primary-700 transition"
          >
            <Package size={16} />
            Produits
          </Link>
          <Link
            to="/operator/bookings"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:border-primary-600 hover:text-primary-700 transition"
          >
            <Calendar size={16} />
            Réservations
          </Link>
          <Link
            to="/operator/analytics"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:border-primary-600 hover:text-primary-700 transition"
          >
            <TrendingUp size={16} />
            Analytics
          </Link>
        </>
      )}
      
      {!isOperatorRoute && location.pathname.startsWith('/admin') && (
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:border-primary-600 hover:text-primary-700 transition"
        >
          <Home size={16} />
          Dashboard
        </Link>
      )}
      
      {!isOperatorRoute && !location.pathname.startsWith('/admin') && (
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:border-primary-600 hover:text-primary-700 transition"
        >
          <Home size={16} />
          Dashboard
        </Link>
      )}
      <Link
        to="/search"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:border-primary-600 hover:text-primary-700 transition"
      >
        <Search size={16} />
        Recherche
      </Link>
    </div>
  );
};

export default DashboardNavBar;

