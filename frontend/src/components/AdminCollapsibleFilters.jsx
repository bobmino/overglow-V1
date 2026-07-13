import React, { useState } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';

/**
 * Barre de filtres admin : empilée et repliable sous md, toujours ouverte en desktop.
 */
const AdminCollapsibleFilters = ({
  children,
  title = 'Filtres',
  defaultOpen = false,
  className = '',
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 mb-6 ${className}`}>
      <button
        type="button"
        className="md:hidden w-full inline-flex items-center justify-between gap-2 min-h-11 font-semibold text-gray-900"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-primary-600" />
          {title}
        </span>
        <ChevronDown
          size={18}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div className={`${open ? 'mt-4 block' : 'hidden'} md:mt-0 md:block`}>{children}</div>
    </div>
  );
};

export default AdminCollapsibleFilters;
