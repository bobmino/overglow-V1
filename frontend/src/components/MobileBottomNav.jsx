import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Heart, User, Menu } from 'lucide-react';

const MobileBottomNav = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  // Don't show on dashboard routes
  if (location.pathname.startsWith('/operator') || 
      location.pathname.startsWith('/admin') ||
      location.pathname.startsWith('/dashboard') ||
      location.pathname.startsWith('/profile') ||
      location.pathname.startsWith('/booking') ||
      location.pathname.startsWith('/checkout')) {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors ${
            isActive('/') && location.pathname === '/'
              ? 'text-primary-600'
              : 'text-slate-500 hover:text-primary-600'
          }`}
        >
          <Home size={24} className={isActive('/') && location.pathname === '/' ? 'fill-current' : ''} />
          <span className="text-xs mt-1 font-medium">Accueil</span>
        </Link>

        <Link
          to="/search"
          className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors ${
            isActive('/search')
              ? 'text-primary-600'
              : 'text-slate-500 hover:text-primary-600'
          }`}
        >
          <Search size={24} className={isActive('/search') ? 'fill-current' : ''} />
          <span className="text-xs mt-1 font-medium">Rechercher</span>
        </Link>

        <Link
          to="/favorites"
          className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors ${
            isActive('/favorites')
              ? 'text-primary-600'
              : 'text-slate-500 hover:text-primary-600'
          }`}
        >
          <Heart size={24} className={isActive('/favorites') ? 'fill-current' : ''} />
          <span className="text-xs mt-1 font-medium">Favoris</span>
        </Link>

        <Link
          to="/profile"
          className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors ${
            isActive('/profile')
              ? 'text-primary-600'
              : 'text-slate-500 hover:text-primary-600'
          }`}
        >
          <User size={24} className={isActive('/profile') ? 'fill-current' : ''} />
          <span className="text-xs mt-1 font-medium">Profil</span>
        </Link>

        <button
          className="flex flex-col items-center justify-center flex-1 py-2 text-slate-500 hover:text-primary-600 transition-colors"
          onClick={() => {
            // Toggle mobile menu - this will be handled by Header
            const menuButton = document.querySelector('.mobile-menu-button');
            if (menuButton) menuButton.click();
          }}
        >
          <Menu size={24} />
          <span className="text-xs mt-1 font-medium">Menu</span>
        </button>
      </div>
    </nav>
  );
};

export default MobileBottomNav;

