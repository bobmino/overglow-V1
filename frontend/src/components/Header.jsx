import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Globe, User, Users, ChevronDown, LogOut, Calendar, TrendingUp, Menu, X, Package, Shield, Bell, Building2, Settings, DollarSign, AlertCircle, Heart, Award, Clock } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import CurrencySelector from './CurrencySelector';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import DiscoverMenu from './DiscoverMenu';
import NotificationBadge from './NotificationBadge';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showDiscoverMenu, setShowDiscoverMenu] = useState(false);
  const userMenuRef = React.useRef(null);
  const discoverMenuRef = React.useRef(null);
  const mobileMenuRef = React.useRef(null);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboardRoute = location.pathname.startsWith('/operator');

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
    if (showUserMenu || showDiscoverMenu || isMobileMenuOpen) {
      // Use a small delay to avoid immediate closure when opening
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showUserMenu, showDiscoverMenu, isMobileMenuOpen]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    document.dir = lng === 'ar' ? 'rtl' : 'ltr';
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="fixed w-full top-0 z-50 transition-all duration-300 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm">
      <div className="container mx-auto px-4 h-20 flex justify-between items-center">
        {/* Logo */}
        {isDashboardRoute ? (
          <span className="text-2xl font-heading font-bold text-primary-700 tracking-tight flex items-center gap-2 cursor-default select-none">
            <Globe className="text-secondary-500" size={28} />
            Overglow-Trip
          </span>
        ) : (
          <Link to="/" className="text-2xl font-heading font-bold text-primary-700 tracking-tight flex items-center gap-2">
            <Globe className="text-secondary-500" size={28} />
            Overglow-Trip
          </Link>
        )}

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <div className="relative" ref={discoverMenuRef}>
            <button
              onClick={() => setShowDiscoverMenu(!showDiscoverMenu)}
              className="font-medium text-slate-600 hover:text-primary-600 transition flex items-center gap-1"
            >
              {t('header.discover')}
              <ChevronDown size={16} className={`transition-transform duration-200 ${showDiscoverMenu ? 'rotate-180' : ''}`} />
            </button>
            {showDiscoverMenu && (
              <DiscoverMenu isOpen={showDiscoverMenu} onClose={() => setShowDiscoverMenu(false)} />
            )}
          </div>
          
          <LanguageSelector />
          <CurrencySelector />

          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <NotificationBadge />
              
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
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-50 mb-2">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Account</p>
                  </div>
                  
                  {user?.role === 'Admin' && (
                    <>
                      <Link 
                        to="/admin/dashboard" 
                        className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Shield size={18} className="mr-3" />
                        Admin Dashboard
                      </Link>
                      <Link 
                        to="/admin/operators" 
                        className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Building2 size={18} className="mr-3" />
                        Gérer les Opérateurs
                      </Link>
                      <Link 
                        to="/admin/products" 
                        className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-green-50 hover:text-green-700 transition"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Package size={18} className="mr-3" />
                        Valider les Produits
                      </Link>
                      <Link 
                        to="/admin/users" 
                        className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Users size={18} className="mr-3" />
                        Gérer les Utilisateurs
                      </Link>
                      <Link 
                        to="/admin/settings" 
                        className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-gray-50 hover:text-gray-700 transition"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings size={18} className="mr-3" />
                        Paramètres
                      </Link>
                      <Link 
                        to="/admin/withdrawals" 
                        className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <DollarSign size={18} className="mr-3" />
                        Retraits
                      </Link>
                      <Link 
                        to="/admin/approval-requests" 
                        className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-orange-50 hover:text-orange-700 transition"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <AlertCircle size={18} className="mr-3" />
                        Demandes d'approbation
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
                        <Calendar size={18} className="mr-3" />
                        {t('header.operatorDashboard')}
                      </Link>
                      <Link 
                        to="/operator/products" 
                        className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Package size={18} className="mr-3" />
                        Products
                      </Link>
                      <Link 
                        to="/operator/bookings" 
                        className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Calendar size={18} className="mr-3" />
                        Bookings (Customers)
                      </Link>
                      <Link 
                        to="/operator/analytics" 
                        className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <TrendingUp size={18} className="mr-3" />
                        {t('header.analytics')}
                      </Link>
                    </>
                  )}
                  
                        <Link 
                          to="/dashboard" 
                          className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Calendar size={18} className="mr-3" />
                          {t('header.dashboard')}
                        </Link>
                        <Link 
                          to="/favorites" 
                          className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-pink-50 hover:text-pink-700 transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Heart size={18} className="mr-3" />
                          Mes Favoris
                        </Link>
                        <Link 
                          to="/view-history" 
                          className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Clock size={18} className="mr-3" />
                          Historique
                        </Link>
                        <Link 
                          to="/loyalty" 
                          className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-yellow-50 hover:text-yellow-700 transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Award size={18} className="mr-3" />
                          Programme de Fidélité
                        </Link>
                        <Link 
                          to="/profile" 
                          className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User size={18} className="mr-3" />
                          Mon Profil
                        </Link>
                  
                  <div className="border-t border-slate-50 mt-2 pt-2">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2.5 text-red-600 hover:bg-red-50 transition"
                    >
                      <LogOut size={18} className="mr-3" />
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

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
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
            className="md:hidden fixed top-20 left-0 w-full bg-white border-b border-slate-100 shadow-xl p-4 flex flex-col space-y-4 z-40"
          >
          <Link 
            to="/search" 
            className="p-3 rounded-lg hover:bg-slate-50 font-medium text-slate-700"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {t('header.discover')}
          </Link>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
            <span className="text-slate-600 font-medium">Language</span>
            <LanguageSelector />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
            <span className="text-slate-600 font-medium">Devise</span>
            <CurrencySelector />
          </div>

          {isAuthenticated ? (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="px-3 py-2 text-sm font-bold text-slate-400 uppercase">
                {user?.name}
              </div>
              <Link 
                to="/dashboard" 
                className="flex items-center p-3 rounded-lg hover:bg-slate-50 text-slate-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Calendar size={18} className="mr-3" />
                {t('header.dashboard')}
              </Link>
              {user?.role === 'Opérateur' && (
                <Link 
                  to="/operator/dashboard" 
                  className="flex items-center p-3 rounded-lg hover:bg-slate-50 text-slate-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <TrendingUp size={18} className="mr-3" />
                  Operator Dashboard
                </Link>
              )}
              <button 
                onClick={handleLogout}
                className="w-full flex items-center p-3 rounded-lg hover:bg-red-50 text-red-600"
              >
                <LogOut size={18} className="mr-3" />
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
