import React from 'react';
import { Link } from 'react-router-dom';
import { SearchX, Heart, Inbox, CalendarX2, PackageOpen, WifiOff } from 'lucide-react';

const ICONS = {
  search: SearchX,
  favorites: Heart,
  inbox: Inbox,
  bookings: CalendarX2,
  products: PackageOpen,
  offline: WifiOff,
};

/**
 * Empty state réutilisable (plan stratégique — empty states unifiés).
 */
const EmptyState = ({
  variant = 'search',
  title,
  subtitle,
  ctaLabel,
  ctaTo,
  onCta,
  className = '',
}) => {
  const Icon = ICONS[variant] || SearchX;

  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-6 py-14 ${className}`}
      role="status"
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Icon size={32} strokeWidth={1.5} aria-hidden />
      </div>
      {title && (
        <h2 className="text-xl font-heading font-bold text-gray-900 mb-2">{title}</h2>
      )}
      {subtitle && (
        <p className="text-sm text-gray-500 max-w-md mb-6">{subtitle}</p>
      )}
      {ctaLabel && ctaTo && (
        <Link
          to={ctaTo}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-primary-600 text-primary-700 font-semibold hover:bg-primary-50 transition"
        >
          {ctaLabel}
        </Link>
      )}
      {ctaLabel && onCta && !ctaTo && (
        <button
          type="button"
          onClick={onCta}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-primary-600 text-primary-700 font-semibold hover:bg-primary-50 transition"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
