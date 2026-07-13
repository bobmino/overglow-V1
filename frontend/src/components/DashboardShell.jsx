import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import AdminSidebar, {
  SIDEBAR_WIDTH,
  SIDEBAR_COLLAPSED,
  STORAGE_KEY,
} from './AdminSidebar';

const TITLE_MAP = {
  '/admin/dashboard': 'Tableau de bord',
  '/admin/analytics': 'Analytics',
  '/admin/users': 'Utilisateurs',
  '/admin/operators': 'Opérateurs',
  '/admin/products': 'Produits',
  '/admin/bookings': 'Réservations',
  '/admin/pending-payments': 'Paiements en attente',
  '/admin/withdrawals': 'Retraits',
  '/admin/finance': 'Finances',
  '/admin/blog': 'Blog',
  '/admin/badges': 'Badges',
  '/admin/approval-requests': 'Demandes opérateurs',
  '/admin/badge-requests': 'Demandes badges',
  '/admin/settings': 'Paramètres',
  '/operator/dashboard': 'Mon tableau de bord',
  '/operator/products': 'Mes produits',
  '/operator/bookings': 'Mes réservations',
  '/operator/inquiries': 'Messages',
  '/operator/withdrawals': 'Mes revenus',
  '/operator/analytics': 'Analytics',
};

const resolveTitle = (pathname) => {
  if (TITLE_MAP[pathname]) return TITLE_MAP[pathname];
  const hit = Object.keys(TITLE_MAP).find(
    (key) => pathname === key || pathname.startsWith(`${key}/`)
  );
  return hit ? TITLE_MAP[hit] : 'Espace pro';
};

/**
 * Shell layout for admin & operator areas: persistent sidebar + mobile top bar.
 * Used as a nested route element with <Outlet />.
 */
const DashboardShell = ({ variant = 'admin' }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (e) => setIsDesktop(e.matches);
    setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const contentOffset = useMemo(
    () => (collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH),
    [collapsed]
  );

  const pageTitle = resolveTitle(location.pathname);

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar
        variant={variant}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 h-14 px-3 bg-white border-b border-gray-200 shadow-sm">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-slate-700 hover:bg-slate-100"
          aria-label="Ouvrir le menu"
        >
          <Menu size={22} />
        </button>
        <h1 className="flex-1 text-base font-heading font-bold text-slate-900 truncate">
          {pageTitle}
        </h1>
        <button
          type="button"
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 relative"
          aria-label="Notifications"
          title="Notifications (bientôt)"
        >
          <Bell size={20} />
        </button>
      </div>

      <div
        className="transition-all duration-300 ease-in-out min-h-[calc(100vh-3.5rem)] md:min-h-screen"
        style={{ marginLeft: isDesktop ? contentOffset : 0 }}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardShell;
