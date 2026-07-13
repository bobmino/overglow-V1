import React, { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
} from 'lucide-react';

const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED = 64;
const STORAGE_KEY = 'overglow_admin_sidebar_collapsed';

const ADMIN_SECTIONS = [
  {
    label: 'Vue d’ensemble',
    items: [
      { to: '/admin/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      { to: '/admin/analytics', label: 'Statistiques', icon: TrendingUp },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { to: '/admin/users', label: 'Utilisateurs', icon: Users },
      { to: '/admin/operators', label: 'Opérateurs', icon: Building2 },
      { to: '/admin/products', label: 'Produits', icon: Package },
      { to: '/admin/bookings', label: 'Réservations', icon: CalendarDays, badge: 0 },
    ],
  },
  {
    label: 'Finances',
    items: [
      { to: '/admin/pending-payments', label: 'Paiements en attente', icon: CreditCard },
      { to: '/admin/withdrawals', label: 'Retraits', icon: Banknote },
      { to: '/admin/finance', label: 'Finances', icon: Landmark },
    ],
  },
  {
    label: 'Contenu & demandes',
    items: [
      { to: '/admin/blog', label: 'Blog', icon: FileText },
      { to: '/admin/chat', label: 'Messages', icon: MessageSquare, badge: 0 },
      { to: '/admin/reviews', label: 'Avis', icon: Star, badge: 0 },
      { to: '/admin/badges', label: 'Badges', icon: Award },
      { to: '/admin/approval-requests', label: 'Demandes opérateurs', icon: Handshake },
      { to: '/admin/badge-requests', label: 'Demandes badges', icon: Award },
    ],
  },
  {
    label: 'Système',
    items: [
      { to: '/admin/settings', label: 'Paramètres', icon: Settings },
    ],
  },
];

const OPERATOR_SECTIONS = [
  {
    label: 'Espace opérateur',
    items: [
      { to: '/operator/dashboard', label: 'Mon tableau de bord', icon: LayoutDashboard },
      { to: '/operator/products', label: 'Mes produits', icon: Package },
      { to: '/operator/bookings', label: 'Mes réservations', icon: CalendarDays, badge: 0 },
      { to: '/operator/inquiries', label: 'Messages', icon: MessageSquare, badge: 0 },
      { to: '/operator/withdrawals', label: 'Mes revenus', icon: Banknote },
      { to: '/operator/dashboard#avis', label: 'Mes avis', icon: Star },
      { to: '/profile', label: 'Mon profil', icon: UserRound },
    ],
  },
];

/**
 * Persistent collapsible sidebar for /admin/* and /operator/* areas.
 * Desktop: fixed left rail. Mobile: overlay drawer controlled by parent.
 */
const AdminSidebar = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  variant = 'admin',
  messagesBadge = 0,
  bookingsBadge = 0,
}) => {
  const location = useLocation();
  const sections = useMemo(() => {
    const applyBadges = (secs) =>
      secs.map((section) => ({
        ...section,
        items: section.items.map((item) => {
          if (item.to === '/operator/inquiries' || item.to === '/admin/chat') {
            return { ...item, badge: messagesBadge };
          }
          if (item.to === '/operator/bookings' || item.to === '/admin/bookings') {
            return { ...item, badge: bookingsBadge };
          }
          return item;
        }),
      }));

    return applyBadges(variant === 'operator' ? OPERATOR_SECTIONS : ADMIN_SECTIONS);
  }, [variant, messagesBadge, bookingsBadge]);
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
      {/* Mobile backdrop */}
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
        aria-label={variant === 'operator' ? 'Navigation opérateur' : 'Navigation admin'}
      >
        <div className="flex items-center justify-between h-14 px-3 border-b border-slate-800 shrink-0">
          {!collapsed && (
            <span className="font-heading font-bold text-sm tracking-wide text-white truncate">
              {variant === 'operator' ? 'Overglow Opérateur' : 'Overglow Admin'}
            </span>
          )}
          <div className="flex items-center gap-1 ml-auto">
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
              aria-label="Fermer le menu"
            >
              <X size={18} />
            </button>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden md:inline-flex p-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
              aria-label={collapsed ? 'Développer le menu' : 'Réduire le menu'}
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
                          ${active
                            ? 'bg-primary-600/20 text-primary-300 border-l-2 border-primary-500'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white border-l-2 border-transparent'}
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
                          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary-500" />
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
