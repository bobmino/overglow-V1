import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Building2,
  Package,
  CalendarDays,
  CreditCard,
  Banknote,
  Landmark,
  FileText,
  Award,
  Handshake,
  Settings,
  MessageSquare,
  Star,
  UserRound,
  ChevronLeft,
  ChevronRight,
  X,
  HelpCircle,
  ShieldCheck,
  BookOpen,
  ClipboardList,
} from 'lucide-react';
import api from '../config/axios';
import { useAuth } from '../context/AuthContext';

const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED = 64;
const STORAGE_KEY = 'overglow_admin_sidebar_collapsed';

/** Booking.com / Airbnb Host style IA: Ops → Content → Trust → Money → People → Config */
const getAdminSections = (t) => [
  {
    label: t('admin.nav.section_ops'),
    items: [
      { to: '/admin/dashboard', label: t('admin.nav.dashboard'), icon: LayoutDashboard },
      { to: '/admin/bookings', label: t('admin.nav.bookings'), icon: CalendarDays, badge: 0 },
      { to: '/admin/chat', label: t('admin.nav.messages'), icon: MessageSquare, badge: 0 },
      { to: '/admin/analytics', label: t('admin.nav.analytics'), icon: TrendingUp },
    ],
  },
  {
    label: t('admin.nav.section_catalogue'),
    items: [
      { to: '/admin/products', label: t('admin.nav.products'), icon: Package },
      { to: '/admin/blog', label: t('admin.nav.blog'), icon: FileText },
      { to: '/admin/faq', label: t('admin.nav.faq'), icon: HelpCircle },
      { to: '/admin/badges', label: t('admin.nav.badges'), icon: Award },
    ],
  },
  {
    label: t('admin.nav.section_moderation'),
    items: [
      { to: '/admin/reviews', label: t('admin.nav.reviews'), icon: Star, badge: 0 },
      { to: '/admin/approval-requests', label: t('admin.nav.operator_requests'), icon: Handshake },
      { to: '/admin/badge-requests', label: t('admin.nav.badge_requests'), icon: ShieldCheck },
    ],
  },
  {
    label: t('admin.nav.section_finance'),
    items: [
      { to: '/admin/finance', label: t('admin.nav.finance'), icon: Landmark },
      { to: '/admin/pending-payments', label: t('admin.nav.pending_payments'), icon: CreditCard },
      { to: '/admin/withdrawals', label: t('admin.nav.withdrawals'), icon: Banknote },
    ],
  },
  {
    label: t('admin.nav.section_people'),
    items: [
      { to: '/admin/users', label: t('admin.nav.users'), icon: Users },
      { to: '/admin/operators', label: t('admin.nav.operators'), icon: Building2 },
    ],
  },
  {
    label: t('admin.nav.section_config'),
    items: [{ to: '/admin/settings', label: t('admin.nav.settings'), icon: Settings }],
  },
];

const getOperatorSections = (t, { formCompleted = false } = {}) => [
  {
    label: t('admin.nav.operator_section_main'),
    items: [
      { to: '/operator/dashboard', label: t('admin.nav.operator_dashboard'), icon: LayoutDashboard },
      { to: '/operator/products', label: t('admin.nav.operator_products'), icon: Package },
      { to: '/operator/bookings', label: t('admin.nav.operator_bookings'), icon: CalendarDays, badge: 0 },
      { to: '/operator/inquiries', label: t('admin.nav.operator_messages'), icon: MessageSquare, badge: 0 },
      { to: '/operator/analytics', label: t('admin.nav.operator_analytics'), icon: TrendingUp },
      { to: '/operator/withdrawals', label: t('admin.nav.operator_revenue'), icon: Banknote },
    ],
  },
  {
    label: t('admin.nav.operator_section_account'),
    items: [
      { to: '/profile', label: t('admin.nav.operator_profile'), icon: UserRound },
      {
        to: '/operator/wizard',
        label: formCompleted
          ? t('admin.nav.operator_fiche', 'Ma fiche')
          : t('admin.nav.operator_onboarding', 'Onboarding'),
        icon: ClipboardList,
      },
      { to: '/operator/help', label: t('admin.nav.operator_help'), icon: BookOpen },
      { to: '/operator/resources', label: t('admin.nav.operator_resources'), icon: FileText },
    ],
  },
];

/**
 * Persistent collapsible sidebar for /admin/* and /operator/* areas.
 * Structure inspired by Booking Extranet / Airbnb Host / Stripe Dashboard.
 */
const AdminSidebar = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  variant = 'admin',
  messagesBadge = 0,
  bookingsBadge = 0,
  badgeRequestsBadge = 0,
  reviewsBadge = 0,
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [formCompleted, setFormCompleted] = useState(false);

  useEffect(() => {
    if (variant !== 'operator' || authLoading || !isAuthenticated) return undefined;
    let cancelled = false;
    api
      .get('/api/operator/wizard/data')
      .then(({ data }) => {
        if (!cancelled) setFormCompleted(Boolean(data?.isFormCompleted));
      })
      .catch(() => {
        if (!cancelled) setFormCompleted(false);
      });
    return () => {
      cancelled = true;
    };
  }, [variant, authLoading, isAuthenticated, location.pathname]);

  const sections = useMemo(() => {
    const base =
      variant === 'operator' ? getOperatorSections(t, { formCompleted }) : getAdminSections(t);
    return base.map((section) => ({
      ...section,
      items: section.items.map((item) => {
        if (item.to === '/operator/inquiries' || item.to === '/admin/chat') {
          return { ...item, badge: messagesBadge };
        }
        if (item.to === '/operator/bookings' || item.to === '/admin/bookings') {
          return { ...item, badge: bookingsBadge };
        }
        if (item.to === '/admin/badge-requests') {
          return { ...item, badge: badgeRequestsBadge };
        }
        if (item.to === '/admin/reviews') {
          return { ...item, badge: reviewsBadge };
        }
        return item;
      }),
    }));
  }, [variant, messagesBadge, bookingsBadge, badgeRequestsBadge, reviewsBadge, t, formCompleted]);

  const width = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH;
  const drawerWidth = mobileOpen ? SIDEBAR_WIDTH : width;

  const isItemActive = (to) => {
    const path = to.split('#')[0];
    if (path === '/admin/dashboard' || path === '/operator/dashboard') {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onCloseMobile}
        aria-hidden={!mobileOpen}
      />

      <aside
        style={{ width: drawerWidth }}
        className={`
          fixed top-0 left-0 z-50 h-full bg-slate-900 text-slate-100
          flex flex-col border-r border-slate-800
          transition-all duration-300 ease-in-out
          max-md:max-w-[280px]
          md:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        aria-label={
          variant === 'operator' ? t('admin.nav.aria_operator') : t('admin.nav.aria_admin')
        }
      >
        <div className="flex items-center justify-between h-14 px-3 border-b border-slate-800 shrink-0">
          {!collapsed && (
            <span className="font-heading font-bold text-sm tracking-wide text-white truncate">
              {variant === 'operator' ? t('admin.nav.brand_operator') : t('admin.nav.brand_admin')}
            </span>
          )}
          <div className="flex items-center gap-1 ms-auto">
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
              aria-label={t('admin.nav.close_menu')}
            >
              <X size={18} />
            </button>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden md:inline-flex p-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
              aria-label={collapsed ? t('admin.nav.expand') : t('admin.nav.collapse')}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {sections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {section.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item.to);
                  return (
                    <li key={item.to + item.label}>
                      <NavLink
                        to={item.to}
                        onClick={onCloseMobile}
                        title={collapsed ? item.label : undefined}
                        className={`
                          group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                          transition-colors relative
                          ${
                            active
                              ? 'bg-primary-600/20 text-primary-300 border-s-2 border-primary-500'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white border-s-2 border-transparent'
                          }
                          ${collapsed ? 'justify-center px-2' : ''}
                        `}
                      >
                        <Icon size={20} className="shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="truncate flex-1">{item.label}</span>
                            {typeof item.badge === 'number' && item.badge > 0 && (
                              <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-primary-600 text-[10px] font-bold text-white flex items-center justify-center">
                                {item.badge > 99 ? '99+' : item.badge}
                              </span>
                            )}
                          </>
                        )}
                        {collapsed && typeof item.badge === 'number' && item.badge > 0 && (
                          <span className="absolute top-1 end-1 w-2 h-2 rounded-full bg-primary-500" />
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED, STORAGE_KEY };
export default AdminSidebar;
