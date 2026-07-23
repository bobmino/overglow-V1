import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

const TITLE_KEYS = {
  '/admin/dashboard': 'admin.shell.dashboard',
  '/admin/analytics': 'admin.shell.analytics',
  '/admin/users': 'admin.shell.users',
  '/admin/operators': 'admin.shell.operators',
  '/admin/products': 'admin.shell.products',
  '/admin/bookings': 'admin.shell.bookings',
  '/admin/pending-payments': 'admin.shell.pending_payments',
  '/admin/withdrawals': 'admin.shell.withdrawals',
  '/admin/finance': 'admin.shell.finance',
  '/admin/blog': 'admin.shell.blog',
  '/admin/faq': 'admin.shell.faq',
  '/admin/chat': 'admin.shell.chat',
  '/admin/reviews': 'admin.shell.reviews',
  '/admin/badges': 'admin.shell.badges',
  '/admin/approval-requests': 'admin.shell.approval_requests',
  '/admin/badge-requests': 'admin.shell.badge_requests',
  '/admin/settings': 'admin.shell.settings',
  '/operator/dashboard': 'admin.shell.op_dashboard',
  '/operator/products': 'admin.shell.op_products',
  '/operator/bookings': 'admin.shell.op_bookings',
  '/operator/inquiries': 'admin.shell.op_inquiries',
  '/operator/withdrawals': 'admin.shell.op_withdrawals',
  '/operator/analytics': 'admin.shell.op_analytics',
  '/operator/onboarding': 'admin.shell.op_onboarding',
  '/operator/wizard': 'admin.shell.op_wizard',
};

const FALLBACK_TITLES = {
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
  '/admin/faq': 'FAQ',
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
  '/operator/wizard': 'Onboarding',
};

const resolveTitleKey = (pathname) => {
  if (TITLE_KEYS[pathname]) return TITLE_KEYS[pathname];
  const hit = Object.keys(TITLE_KEYS).find(
    (key) => pathname === key || pathname.startsWith(`${key}/`)
  );
  return hit ? TITLE_KEYS[hit] : 'admin.shell.default';
};

const resolveFallbackPath = (pathname) => {
  if (FALLBACK_TITLES[pathname]) return FALLBACK_TITLES[pathname];
  const hit = Object.keys(FALLBACK_TITLES).find(
    (key) => pathname === key || pathname.startsWith(`${key}/`)
  );
  return hit ? FALLBACK_TITLES[hit] : 'Espace pro';
};

/** Build breadcrumb items from current path for admin/operator shells. */
const buildBreadcrumbs = (pathname, variant, t) => {
  const root =
    variant === 'operator'
      ? { label: t('admin.shell.crumb_home', 'Accueil'), href: '/operator/dashboard' }
      : { label: t('admin.shell.crumb_home', 'Accueil'), href: '/admin/dashboard' };
  const area =
    variant === 'operator'
      ? { label: t('admin.shell.crumb_operator', 'Opérateur'), href: '/operator/dashboard' }
      : { label: t('admin.shell.crumb_admin', 'Administration'), href: '/admin/dashboard' };

  const segments = pathname.split('/').filter(Boolean);
  const items = [root, area];
  let acc = '';
  for (let i = 1; i < segments.length; i += 1) {
    acc += `/${segments[i]}`;
    const full = `/${segments[0]}${acc}`;
    const key = TITLE_KEYS[full];
    const label = key
      ? t(key, FALLBACK_TITLES[full] || decodeURIComponent(segments[i]).replace(/-/g, ' '))
      : decodeURIComponent(segments[i]).replace(/-/g, ' ');
    const isLast = i === segments.length - 1;
    items.push(isLast ? { label } : { label, href: full });
  }

  if (items.length >= 3 && items[1].href === items[2].href) {
    return [items[0], items[2], ...items.slice(3)];
  }
  return items;
};

/**
 * Shell layout for admin & operator areas: persistent sidebar + mobile top bar.
 */
const DashboardShell = ({ variant = 'admin' }) => {
  const { t } = useTranslation();
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
  const [badgeRequestsBadge, setBadgeRequestsBadge] = useState(0);
  const [reviewsBadge, setReviewsBadge] = useState(0);
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
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (e) => setIsDesktop(e.matches);
    setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

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

      if (variant === 'admin') {
        try {
          const { data } = await api.get('/api/badge-requests/admin/pending-count');
          setBadgeRequestsBadge(data.count ?? 0);
        } catch {
          setBadgeRequestsBadge(0);
        }
        try {
          const { data } = await api.get('/api/admin/reviews', {
            params: { status: 'Pending', limit: 1, page: 1 },
          });
          setReviewsBadge(
            data.stats?.pendingModeration ?? data.pagination?.total ?? data.total ?? 0
          );
        } catch {
          setReviewsBadge(0);
        }
      } else {
        setBadgeRequestsBadge(0);
        setReviewsBadge(0);
      }
    };

    fetchBadges();
    const id = setInterval(fetchBadges, 60000);
    return () => clearInterval(id);
  }, [variant, authLoading, isAuthenticated]);

  const contentOffset = useMemo(
    () => (collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH),
    [collapsed]
  );

  const pageTitle = t(
    resolveTitleKey(location.pathname),
    resolveFallbackPath(location.pathname)
  );
  const crumbItems = useMemo(
    () => buildBreadcrumbs(location.pathname, variant, t),
    [location.pathname, variant, t]
  );

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar
        variant={variant}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        messagesBadge={messagesBadge}
        bookingsBadge={bookingsBadge}
        badgeRequestsBadge={badgeRequestsBadge}
        reviewsBadge={reviewsBadge}
      />

      <div className="md:hidden sticky top-0 z-40 flex flex-col gap-2 px-3 py-2 bg-surface border-b border-border shadow-sm">
        <div className="flex items-center gap-3 h-11">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2.5 min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100"
            aria-label={t('admin.shell.open_menu', 'Ouvrir le menu')}
          >
            <Menu size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <Breadcrumbs items={crumbItems} />
            <h1 className="text-base font-heading font-bold text-slate-900 truncate leading-tight">
              {pageTitle}
            </h1>
          </div>
          {!isDesktop && <NotificationBell />}
        </div>
        {variant === 'admin' && <AdminGlobalSearch compact />}
      </div>

      <div
        className="hidden md:flex sticky top-0 z-30 items-center gap-4 h-14 px-6 bg-surface/95 backdrop-blur border-b border-border"
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
        {isDesktop && <NotificationBell />}
      </div>

      <div
        className="transition-all duration-300 ease-in-out min-h-[calc(100vh-3.5rem)] page-shell"
        style={{ marginLeft: isDesktop ? contentOffset : 0 }}
      >
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardShell;
