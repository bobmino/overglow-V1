import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * [PROMPT-9] Breadcrumb trail for admin / operator shells.
 * @param {{ items: Array<{ label: string, href?: string }> }} props
 */
const Breadcrumbs = ({ items = [] }) => {
  if (!items.length) return null;

  return (
    <nav aria-label="Fil d’Ariane" className="min-w-0">
      <ol className="flex items-center flex-wrap gap-1 text-sm text-slate-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1 min-w-0">
              {index > 0 && (
                <ChevronRight size={14} className="shrink-0 text-slate-400" aria-hidden />
              )}
              {index === 0 && item.href ? (
                <Link
                  to={item.href}
                  className="inline-flex items-center gap-1 hover:text-primary-600 transition shrink-0"
                  aria-label={item.label}
                >
                  <Home size={14} />
                  <span className="sr-only md:not-sr-only md:inline">{item.label}</span>
                </Link>
              ) : !isLast && item.href ? (
                <Link
                  to={item.href}
                  className="hover:text-primary-600 transition truncate max-w-[10rem]"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={`truncate max-w-[14rem] ${isLast ? 'font-semibold text-slate-800' : ''}`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
