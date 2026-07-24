import React from 'react';

/**
 * Hero compact pour pages cockpit BO — charte Overglow (primary + secondary).
 */
const CockpitPageHero = ({
  eyebrow = 'Overglow Cockpit',
  title,
  subtitle,
  actions = null,
  variant = 'admin',
}) => {
  const label = eyebrow || (variant === 'operator' ? 'Overglow Host' : 'Overglow Cockpit');
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white px-6 py-7 md:px-8 md:py-8 shadow-sm">
      <div className="absolute -end-14 -top-14 w-48 h-48 rounded-full bg-secondary-500/20 blur-3xl pointer-events-none" />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-primary-200 mb-1.5">{label}</p>
          <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">{title}</h1>
          {subtitle ? (
            <p className="text-primary-100/90 text-sm mt-2 max-w-2xl">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2 shrink-0">{actions}</div> : null}
      </div>
    </div>
  );
};

export default CockpitPageHero;
