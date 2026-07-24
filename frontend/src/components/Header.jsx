import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Globe, User, Users, ChevronDown, LogOut, Calendar, TrendingUp, Menu, X, Package, Shield, Bell, Building2, Settings, DollarSign, AlertCircle, Heart, Award, Clock, FileText, ShoppingCart } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import CurrencySelector from './CurrencySelector';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useMobileMenu } from '../context/MobileMenuContext';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import DiscoverMenu from './DiscoverMenu';
import NotificationBell from './NotificationBell';
import LocalizedLink from './LocalizedLink';
import { useLocalizedNavigate } from '../hooks/useLocalizedPath';
import { logger } from '../utils/logger.js';
import { notifyError } from '../utils/notify.js';

const Header = () => {
  const { user, login, logout, isAuthenticated, updateUser } = useAuth();
  const { cartItems, setIsCartOpen } = useCart();
  const { isOpen: isMobileMenuOpen, setIsOpen: setIsMobileMenuOpen } = useMobileMenu();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDiscoverMenu, setShowDiscoverMenu] = useState(false);
  const [showLuxuryMenu, setShowLuxuryMenu] = useState(false);
  const [showServicesMenu, setShowServicesMenu] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const userMenuRef = React.useRef(null);
  const discoverMenuRef = React.useRef(null);
  const luxuryMenuRef = React.useRef(null);
  const servicesMenuRef = React.useRef(null);
  const mobileMenuRef = React.useRef(null);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const localizedNavigate = useLocalizedNavigate();
  const location = useLocation();
  const isDashboardRoute = location.pathname.startsWith('/operator') || location.pathname.startsWith('/admin');

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close user menu if clicked outside
      if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      
      // Close discover menu if clicked outside
      if (showDiscoverMenu && discoverMenuRef.current && !discoverMenuRef.current.contains(event.target)) {
        setShowDiscoverMenu(false);
      }

      // Close luxury menu if clicked outside
      if (showLuxuryMenu && luxuryMenuRef.current && !luxuryMenuRef.current.contains(event.target)) {
        setShowLuxuryMenu(false);
      }

      // Close services menu if clicked outside
      if (showServicesMenu && servicesMenuRef.current && !servicesMenuRef.current.contains(event.target)) {
        setShowServicesMenu(false);
      }
      
      // Close mobile menu if clicked outside
      if (isMobileMenuOpen) {
        // Check if click is on the mobile menu button (which is not in the ref)
        const clickedButton = event.target.closest('button');
        const isMobileButton = clickedButton && clickedButton.classList.contains('md:hidden');
        
        if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && !isMobileButton) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    // Only add listener if any menu is open
    if (showUserMenu || showDiscoverMenu || showLuxuryMenu || showServicesMenu || isMobileMenuOpen) {
      // Use a small delay to avoid immediate closure when opening
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showUserMenu, showDiscoverMenu, showLuxuryMenu, showServicesMenu, isMobileMenuOpen]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    setIsMobileMenuOpen(false);
    localizedNavigate('/');
  };

  const handleUpgradeToOperator = async () => {
    if (isUpgrading) return;
    setIsUpgrading(true);
    try {
      const response = await api.post('/api/auth/upgrade-to-operator');
      const updatedUser = { ...user, ...response.data.user };
      
      // Fallback in case updateUser is not available in the deployed AuthContext
      if (typeof updateUser === 'function') {
        updateUser(updatedUser);
      } else if (typeof login === 'function') {
        login(updatedUser);
      }
      
      setShowUserMenu(false);
      navigate('/operator/wizard');
    } catch (error) {
      logger.error('Failed to upgrade to operator:', error);
      notifyError(t('header.upgrade_error', 'Une erreur est survenue lors de la mise à niveau. Veuillez réessayer.'));
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <header className="fixed w-full top-0 z-50 transition-all duration-300 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm">
      <div className="container mx-auto px-4 h-20 flex justify-between items-center">
        {/* Logo */}
        {isDashboardRoute ? (
          <span className="text-2xl font-heading font-bold text-primary-700 tracking-tight flex items-center gap-2 cursor-default select-none">
            <Globe className="text-secondary-500" size={28} />
            Overglow
          </span>
        ) : (
          <LocalizedLink to="/" className="text-2xl font-heading font-bold text-primary-700 tracking-tight flex items-center gap-2">
            <Globe className="text-secondary-500" size={28} />
            Overglow
          </LocalizedLink>
        )}

        {/* Desktop Navigation — pont hover via pb sur triggers + menu sans gap */}
        <div 
          className="hidden md:flex items-center space-x-8 h-full"
          onMouseLeave={() => {
            setShowDiscoverMenu(false);
            setShowLuxuryMenu(false);
            setShowServicesMenu(false);
          }}
        >
          <div 
            className="relative h-full flex items-center" 
            ref={discoverMenuRef}
            onMouseEnter={() => {
              setShowDiscoverMenu(true);
              setShowLuxuryMenu(false);
              setShowServicesMenu(false);
            }}
          >
            <button
              type="button"
              className="font-medium text-slate-600 hover:text-primary-600 transition flex items-center gap-1 h-full"
            >
              {t('header.discover')}
              <ChevronDown size={16} className={`transition-transform duration-200 ${showDiscoverMenu ? 'rotate-180' : ''}`} />
            </button>
            {showDiscoverMenu && (
              <DiscoverMenu isOpen={showDiscoverMenu} onClose={() => setShowDiscoverMenu(false)} menuType="discover" />
            )}
          </div>

          {/* Logements Dropdown */}
          <div 
            className="relative h-full flex items-center" 
            ref={luxuryMenuRef}
            onMouseEnter={() => {
              setShowLuxuryMenu(true);
              setShowDiscoverMenu(false);
              setShowServicesMenu(false);
            }}
          >
            <button
              type="button"
              className="font-medium text-slate-600 hover:text-primary-600 transition flex items-center gap-1 h-full"
            >
              {t('header.luxury')}
              <span className="ms-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">{t('header.badge_luxury')}</span>
              <ChevronDown size={16} className={`transition-transform duration-200 ${showLuxuryMenu ? 'rotate-180' : ''}`} />
            </button>
            {showLuxuryMenu && (
              <DiscoverMenu isOpen={showLuxuryMenu} onClose={() => setShowLuxuryMenu(false)} menuType="luxury" />
            )}
          </div>

          {/* Extras Dropdown */}
          <div 
            className="relative h-full flex items-center" 
            ref={servicesMenuRef}
            onMouseEnter={() => {
              setShowServicesMenu(true);
              setShowDiscoverMenu(false);
              setShowLuxuryMenu(false);
            }}
          >
            <button
              type="button"
              className="font-medium text-slate-600 hover:text-primary-600 transition flex items-center gap-1 h-full"
            >
              {t('header.extras')}
              <ChevronDown size={16} className={`transition-transform duration-200 ${showServicesMenu ? 'rotate-180' : ''}`} />
            </button>
            {showServicesMenu && (
              <DiscoverMenu isOpen={showServicesMenu} onClose={() => setShowServicesMenu(false)} menuType="services" />
            )}
          </div>
          
          <NotificationBell />
          <LanguageSelector />
          <CurrencySelector />

          {/* Cart Icon */}
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition"
          >
            <ShoppingCart size={20} />
            {cartItems?.length > 0 && (
              <span className="absolute top-0 end-0 w-4 h-4 bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                {cartItems.length}
              </span>
            )}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLogout}
                className="hidden lg:inline-flex items-center gap-2 min-h-10 px-4 py-2 rounded-full border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 transition"
              >
                <LogOut size={16} />
                {t('header.logout')}
              </button>
              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 bg-primary-50 hover:bg-primary-100 text-primary-700 px-4 py-2 rounded-full transition border border-primary-100"
                >
                  <User size={18} />
                  <span className="font-medium">{user?.name}</span>
                  <ChevronDown size={16} className={`transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>
              
                {showUserMenu && (
                  <div className="absolute end-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-50 mb-2">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{t('header.account', 'Compte')}</p>
                  </div>
                  
                  {user?.role === 'Admin' && (
                    <>
                      <Link 
                        to="/admin/dashboard" 
                        className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Shield size={18} className="me-3" />
                        {t('header.admin_dashboard', 'Tableau admin')}
                      </Link>
                      <Link 
                        to="/admin/operators" 
                        className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Building2 size={18} className="me-3" />
                        {t('header.admin_operators', 'Gérer les opérateurs')}
                      </Link>
                      <Link 
                        to="/admin/products" 
                        className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Package size={18} className="me-3" />
                        {t('header.admin_products', 'Valider les produits')}
                      </Link>
                      <Link 
                        to="/admin/users" 
                        className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Users size={18} className="me-3" />
                        {t('header.admin_users', 'Gérer les utilisateurs')}
                      </Link>
                      <Link 
                        to="/admin/settings" 
                        className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-gray-50 hover:text-gray-700 transition"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings size={18} className="me-3" />
                        {t('header.admin_settings', 'Paramètres')}
                      </Link>
                      <Link 
                        to="/admin/withdrawals" 
                        className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <DollarSign size={18} className="me-3" />
                        {t('header.admin_withdrawals', 'Retraits')}
                      </Link>
                      <Link 
                        to="/admin/approval-requests" 
                        className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-orange-50 hover:text-orange-700 transition"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <AlertCircle size={18} className="me-3" />
                        {t('header.admin_approvals', "Demandes d'approbation")}
                      </Link>
                      <Link 
                        to="/admin/blog" 
                        className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-pink-50 hover:text-pink-700 transition"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <FileText size={18} className="me-3" />
                        {t('header.admin_blog', 'Gérer le blog')}
                      </Link>
                    </>
                  )}
                  {user?.role === 'Opérateur' && (
                    <>
                      <Link 
                        to="/operator/dashboard" 
                        className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Calendar size={18} className="me-3" />
                        {t('header.operatorDashboard')}
                      </Link>
                      <Link 
                        to="/operator/products" 
                        className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Package size={18} className="me-3" />
                        {t('header.products', 'Produits')}
                      </Link>
                      <Link 
                        to="/operator/bookings" 
                        className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Calendar size={18} className="me-3" />
                        {t('header.bookings', 'Réservations')}
                      </Link>
                      <Link 
                        to="/operator/analytics" 
                        className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <TrendingUp size={18} className="me-3" />
                        {t('header.analytics')}
                      </Link>
                    </>
                  )}
                  
                        <Link 
                          to="/dashboard" 
                          className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Calendar size={18} className="me-3" />
                          {t('header.dashboard')}
                        </Link>
                        <Link 
                          to="/favorites" 
                          className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-pink-50 hover:text-pink-700 transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Heart size={18} className="me-3" />
                          {t('header.favorites', 'Mes favoris')}
                        </Link>
                        <Link 
                          to="/view-history" 
                          className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Clock size={18} className="me-3" />
                          {t('header.history', 'Historique')}
                        </Link>
                        <Link 
                          to="/loyalty" 
                          className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-yellow-50 hover:text-yellow-700 transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Award size={18} className="me-3" />
                          {t('header.loyalty', 'Programme de fidélité')}
                        </Link>
                        <Link 
                          to="/profile" 
                          className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User size={18} className="me-3" />
                          {t('header.profile', 'Mon profil')}
                        </Link>
                  
                  {user?.role === 'Client' && (
                    <div className="border-t border-slate-50 mt-2 pt-2">
                      <button 
                        onClick={handleUpgradeToOperator}
                        disabled={isUpgrading}
                        className="w-full flex items-center px-4 py-2.5 text-primary-600 hover:bg-primary-50 transition font-medium"
                      >
                        <Building2 size={18} className="me-3" />
                        {isUpgrading ? t('header.upgrading', 'Création en cours...') : t('header.become_partner', 'Devenir partenaire')}
                      </button>
                    </div>
                  )}
                  
                  <div className="border-t border-slate-50 mt-2 pt-2">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2.5 text-red-600 hover:bg-red-50 transition"
                    >
                      <LogOut size={18} className="me-3" />
                      {t('header.logout')}
                    </button>
                  </div>
                </div>
              )}
              </div>
            </div>
          ) : (
            <Link to="/login" className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-2.5 rounded-full hover:bg-primary-700 transition shadow-lg shadow-primary-600/20 font-medium">
              <span>{t('header.login')}</span>
            </Link>
          )}
        </div>

        {/* Mobile Icons */}
        <div className="md:hidden flex items-center gap-2">
          {/* Cart Icon (Mobile) */}
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition"
          >
            <ShoppingCart size={24} />
            {cartItems?.length > 0 && (
              <span className="absolute top-0 end-0 w-4 h-4 bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                {cartItems.length}
              </span>
            )}
          </button>

          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-button-header p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
            aria-label={t('nav.menu', 'Menu')}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="md:hidden fixed inset-0 bg-black/20 z-30 top-20"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Menu Content */}
          <div 
            ref={mobileMenuRef}
            className="md:hidden fixed top-20 start-0 w-full bg-white border-b border-slate-100 shadow-xl p-4 flex flex-col space-y-4 z-40"
          >
          <LocalizedLink 
            to="/explore" 
            className="p-3 rounded-lg hover:bg-slate-50 font-medium text-slate-700"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {t('header.discover')}
          </LocalizedLink>
          <LocalizedLink 
            to="/stays" 
            className="p-3 rounded-lg hover:bg-slate-50 font-medium text-slate-700 flex items-center gap-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {t('header.luxury')} <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">{t('header.badge_luxury')}</span>
          </LocalizedLink>
          <LocalizedLink 
            to="/extras" 
            className="p-3 rounded-lg hover:bg-slate-50 font-medium text-slate-700"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {t('header.extras')}
          </LocalizedLink>
          <Link
            to="/loyalty"
            className="p-3 rounded-lg hover:bg-slate-50 font-medium text-slate-700"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {t('header.loyalty', 'Programme de fidélité')}
          </Link>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
            <span className="text-slate-600 font-medium">{t('header.language', 'Langue')}</span>
            <LanguageSelector />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
            <span className="text-slate-600 font-medium">{t('header.currency', 'Devise')}</span>
            <CurrencySelector />
          </div>

          {isAuthenticated ? (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="px-3 py-2 text-sm font-bold text-slate-400 uppercase">
                {user?.name}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center p-3 rounded-xl bg-red-50 text-red-700 font-bold border border-red-100"
              >
                <LogOut size={18} className="me-3" />
                {t('header.logout')}
              </button>
              <Link 
                to="/dashboard" 
                className="flex items-center p-3 rounded-lg hover:bg-slate-50 text-slate-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Calendar size={18} className="me-3" />
                {t('header.dashboard')}
              </Link>
              <Link
                to="/loyalty"
                className="flex items-center p-3 rounded-lg hover:bg-slate-50 text-slate-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Award size={18} className="me-3" />
                {t('header.loyalty', 'Programme de fidélité')}
              </Link>
              {user?.role === 'Opérateur' && (
                <Link 
                  to="/operator/dashboard" 
                  className="flex items-center p-3 rounded-lg hover:bg-slate-50 text-slate-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <TrendingUp size={18} className="me-3" />
                  {t('header.operatorDashboard')}
                </Link>
              )}
              {user?.role === 'Client' && (
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleUpgradeToOperator();
                  }}
                  disabled={isUpgrading}
                  className="w-full flex items-center p-3 rounded-lg hover:bg-primary-50 text-primary-600 font-medium"
                >
                  <Building2 size={18} className="me-3" />
                  {isUpgrading ? t('header.upgrading_short', 'Création...') : t('header.become_partner', 'Devenir partenaire')}
                </button>
              )}
              <button 
                onClick={handleLogout}
                className="w-full flex items-center p-3 rounded-lg hover:bg-red-50 text-red-600"
              >
                <LogOut size={18} className="me-3" />
                {t('header.logout')}
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="w-full bg-primary-600 text-white p-3 rounded-xl font-bold text-center shadow-lg shadow-primary-600/20"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t('header.login')}
            </Link>
          )}
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
