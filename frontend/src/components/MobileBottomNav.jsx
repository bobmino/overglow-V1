import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Heart, User, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LocalizedLink from './LocalizedLink';
import { stripLangPrefix } from '../utils/i18nRouting';

const MobileBottomNav = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const barePath = stripLangPrefix(location.pathname);
  const isActive = (path) => barePath === path || barePath.startsWith(`${path}/`);

  if (
    barePath.startsWith('/operator') ||
    barePath.startsWith('/admin') ||
    barePath.startsWith('/dashboard') ||
    barePath.startsWith('/profile') ||
    barePath.startsWith('/booking') ||
    barePath.startsWith('/checkout') ||
    barePath.startsWith('/products/') ||
    barePath.startsWith('/experiences/')
  ) {
    return null;
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 start-0 end-0 bg-white border-t border-slate-200 z-50 safe-area-bottom"
      aria-label={t('nav.mobile_aria', 'Navigation mobile')}
    >
      <div className="flex items-center justify-around h-16 px-2">
        <LocalizedLink
          to="/"
          className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors ${
            barePath === '/'
              ? 'text-primary-600'
              : 'text-slate-500 hover:text-primary-600'
          }`}
        >
          <Home size={24} className={barePath === '/' ? 'fill-current' : ''} />
          <span className="text-xs mt-1 font-medium">{t('common.home')}</span>
        </LocalizedLink>

        <LocalizedLink
          to="/search"
          className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors ${
            isActive('/search') ? 'text-primary-600' : 'text-slate-500 hover:text-primary-600'
          }`}
        >
          <Search size={24} className={isActive('/search') ? 'fill-current' : ''} />
          <span className="text-xs mt-1 font-medium">{t('common.search')}</span>
        </LocalizedLink>

        <Link
          to="/favorites"
          className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors ${
            isActive('/favorites') ? 'text-primary-600' : 'text-slate-500 hover:text-primary-600'
          }`}
        >
          <Heart size={24} className={isActive('/favorites') ? 'fill-current' : ''} />
          <span className="text-xs mt-1 font-medium">{t('nav.favorites', 'Favoris')}</span>
        </Link>

        <Link
          to="/profile"
          className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors ${
            isActive('/profile') ? 'text-primary-600' : 'text-slate-500 hover:text-primary-600'
          }`}
        >
          <User size={24} className={isActive('/profile') ? 'fill-current' : ''} />
          <span className="text-xs mt-1 font-medium">{t('nav.profile', 'Profil')}</span>
        </Link>

        <button
          type="button"
          className="mobile-menu-button flex flex-col items-center justify-center flex-1 py-2 text-slate-500 hover:text-primary-600 transition-colors"
          aria-label={t('nav.menu', 'Menu')}
          onClick={() => {
            const menuButton = document.querySelector('.mobile-menu-button-header');
            if (menuButton) menuButton.click();
          }}
        >
          <Menu size={24} />
          <span className="text-xs mt-1 font-medium">{t('nav.menu', 'Menu')}</span>
        </button>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
