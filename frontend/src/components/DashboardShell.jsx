import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import AdminSidebar, {
  SIDEBAR_WIDTH,
  SIDEBAR_COLLAPSED,
  STORAGE_KEY,
} from './AdminSidebar';
import Breadcrumbs from './Breadcrumbs';
import api from '../config/axios';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import AdminGlobalSearch from './AdminGlobalSearch';

const TITLE_MAP = {
  '/admin/dashboard': 'Tableau de bord',
  '/admin/analytics': 'Statistiques',
  '/admin/users': 'Utilisateurs',
  '/admin/operators': 'Opérateurs',
  '/admin/products': 'Produits',
  '/admin/bookings': 'Réservations',
  '/admin/pending-payments': 'Paiements en attente',
  '/admin/withdrawals': 'Retraits',
  '/admin/finance': 'Finances',
  '/admin/blog': 'Blog',
  '/admin/chat': 'Messages',
  '/admin/reviews': 'Avis',
  '/admin/badges': 'Badges',
  '/admin/approval-requests': 'Demandes opérateurs',
  '/admin/badge-requests': 'Demandes badges',
  '/admin/settings': 'Paramètres',
  '/operator/dashboard': 'Mon tableau de bord',
  '/operator/products': 'Mes produits',
  '/operator/bookings': 'Mes réservations',
  '/operator/inquiries': 'Messages',
  '/operator/withdrawals': 'Mes revenus',
  '/operator/analytics': 'Statistiques',
  '/operator/onboarding': 'Intégration',
};

const resolveTitle = (pathname) => {
  if (TITLE_MAP[pathname]) return TITLE_MAP[pathname];
  const hit = Object.keys(TITLE_MAP).find(
    (key) => pathname === key || pathname.startsWith(`${key}/`)
  );
  return hit ? TITLE_MAP[hit] : 'Espace pro';
};

/** Build breadcrumb items from current path for admin/operator shells. */
const buildBreadcrumbs = (pathname, variant) => {
  const root =
    variant === 'operator'
      ? { label: 'Accueil', href: '/operator/dashboard' }
      : { label: 'Accueil', href: '/admin/dashboard' };
  const area =
    variant === 'operator'
      ? { label: 'Opérateur', href: '/operator/dashboard' }
      : { label: 'Administration', href: '/admin/dashboard' };

  const segments = pathname.split('/').filter(Boolean);
  // e.g. admin / products / :id
  const items = [root, area];
  let acc = '';
  for (let i = 1; i < segments.length; i += 1) {
    acc += `/${segments[i]}`;
    const full = `/${segments[0]}${acc}`;
    const label = TITLE_MAP[full] || decodeURIComponent(segments[i]).replace(/-/g, ' ');
    const isLast = i === segments.length - 1;
    items.push(isLast ? { label } : { label, href: full });
  }

  // Deduplicate consecutive same labels (e.g. Accueil / Admin / Tableau de bord)
  if (items.length >= 3 && items[1].href === items[2].href) {
    return [items[0], items[2], ...items.slice(3)];
  }
  return items;
};

/**
 * Shell layout for admin & operator areas: persistent sidebar + mobile top bar.
 */
const DashboardShell = ({ variant = 'admin' }) => {
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [messagesBadge, setMessagesBadge] = useState(0);
  const [bookingsBadge, setBookingsBadge] = useState(0);
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

  // [PROMPT-9] Badge counts for Messages + Réservations
  useEffect(() => {
    if (authLoading || !isAuthenticated) return undefined;

    const fetchBadges = async () => {
      try {
        const chatRes = await api.get('/api/chat/unread-count');
        setMessagesBadge(chatRes.data.count ?? chatRes.data.unreadCount ?? 0);
      } catch {
        setMessagesBadge(0);
      }

      try {
        if (variant === 'admin') {
          const { data } = await api.get('/api/admin/bookings', {
            params: { status: 'PENDING_PAYMENT,Pending', limit: 1, page: 1 },
          });
          setBookingsBadge(data.total ?? data.pagination?.total ?? 0);
        } else {
          const { data } = await api.get('/api/operator/bookings');
          const list = Array.isArray(data) ? data : data.bookings || [];
          const pending = list.filter((b) =>
            ['Pending', 'PENDING', 'PENDING_PAYMENT'].includes(b.status)
          );
          setBookingsBadge(pending.length);
        }
      } catch {
        setBookingsBadge(0);
      }
    };

    fetchBadges();
    const id = setInterval(fetchBadges, 60000);
    return () => clearInterval(id);
  }, [variant, authLoading, isAuthenticated, location.pathname]);

  const contentOffset = useMemo(
    () => (collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH),
    [collapsed]
  );

  const pageTitle = resolveTitle(location.pathname);
  const crumbItems = useMemo(
    () => buildBreadcrumbs(location.pathname, variant),
    [location.pathname, variant]
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar
        variant={variant}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        messagesBadge={messagesBadge}
        bookingsBadge={bookingsBadge}
      />

      <div className="md:hidden sticky top-0 z-30 flex flex-col gap-2 px-3 py-2 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 h-10">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-slate-700 hover:bg-slate-100"
            aria-label="Ouvrir le menu"
          >
            <Menu size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <Breadcrumbs items={crumbItems} />
            <h1 className="text-base font-heading font-bold text-slate-900 truncate leading-tight">
              {pageTitle}
            </h1>
          </div>
          <NotificationBell />
        </div>
        {variant === 'admin' && <AdminGlobalSearch compact />}
      </div>

      {/* Desktop top bar with breadcrumbs */}
      <div
        className="hidden md:flex sticky top-0 z-20 items-center gap-4 h-14 px-6 bg-white/95 backdrop-blur border-b border-gray-200"
        style={{ marginLeft: isDesktop ? contentOffset : 0 }}
      >
        {variant === 'admin' && (
          <div className="w-72 lg:w-96 shrink-0">
            <AdminGlobalSearch />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <Breadcrumbs items={crumbItems} />
        </div>
        <h1 className="text-sm font-heading font-bold text-slate-800 truncate max-w-xs">
          {pageTitle}
        </h1>
        <NotificationBell />
      </div>

      <div
        className="transition-all duration-300 ease-in-out min-h-[calc(100vh-3.5rem)] md:min-h-[calc(100vh-3.5rem)]"
        style={{ marginLeft: isDesktop ? contentOffset : 0 }}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardShell;
