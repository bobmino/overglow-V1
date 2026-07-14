import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, RotateCcw, ChevronDown, SlidersHorizontal } from 'lucide-react';

/**
 * Filtres admin config-driven, sync URL query params.
 * types: search | select | multi-select | date-range | toggle
 */
const AdvancedFilters = ({
  filters = [],
  values: controlledValues,
  onChange,
  persistUrl = true,
  className = '',
  title = 'Filtres',
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const values = useMemo(() => {
    if (controlledValues) return controlledValues;
    const next = {};
    filters.forEach((f) => {
      if (f.type === 'date-range') {
        next[`${f.key}From`] = searchParams.get(`${f.key}From`) || searchParams.get('dateFrom') || '';
        next[`${f.key}To`] = searchParams.get(`${f.key}To`) || searchParams.get('dateTo') || '';
      } else if (f.type === 'multi-select') {
        const raw = searchParams.get(f.key) || '';
        next[f.key] = raw ? raw.split(',').filter(Boolean) : [];
      } else if (f.type === 'toggle') {
        next[f.key] = searchParams.get(f.key) === 'true';
      } else {
        next[f.key] = searchParams.get(f.key) || f.defaultValue || '';
      }
    });
    return next;
  }, [controlledValues, filters, searchParams]);

  const emit = (patch) => {
    const merged = { ...values, ...patch };
    if (onChange) onChange(merged, patch);
    if (!persistUrl) return;
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (
        value === null ||
        value === undefined ||
        value === '' ||
        value === false ||
        (Array.isArray(value) && value.length === 0)
      ) {
        next.delete(key);
      } else if (Array.isArray(value)) {
        next.set(key, value.join(','));
      } else {
        next.set(key, String(value));
      }
    });
    next.delete('page');
    setSearchParams(next, { replace: true });
  };

  const resetAll = () => {
    const cleared = {};
    filters.forEach((f) => {
      if (f.type === 'date-range') {
        cleared[`${f.key}From`] = '';
        cleared[`${f.key}To`] = '';
      } else if (f.type === 'multi-select') {
        cleared[f.key] = [];
      } else if (f.type === 'toggle') {
        cleared[f.key] = false;
      } else {
        cleared[f.key] = '';
      }
    });
    if (onChange) onChange(cleared, cleared);
    if (persistUrl) setSearchParams({}, { replace: true });
  };

  const chips = [];
  filters.forEach((f) => {
    if (f.type === 'search' && values[f.key]) {
      chips.push({ key: f.key, label: `${f.label}: ${values[f.key]}` });
    }
    if (f.type === 'select' && values[f.key]) {
      const opt = (f.options || []).find((o) => o.value === values[f.key]);
      chips.push({ key: f.key, label: opt?.label || values[f.key] });
    }
    if (f.type === 'multi-select' && Array.isArray(values[f.key])) {
      values[f.key].forEach((v) => {
        const opt = (f.options || []).find((o) => o.value === v);
        chips.push({
          key: `${f.key}:${v}`,
          label: opt?.label || v,
          remove: () => emit({ [f.key]: values[f.key].filter((x) => x !== v) }),
        });
      });
    }
    if (f.type === 'date-range') {
      if (values[`${f.key}From`]) chips.push({ key: `${f.key}From`, label: `Du ${values[`${f.key}From`]}` });
      if (values[`${f.key}To`]) chips.push({ key: `${f.key}To`, label: `Au ${values[`${f.key}To`]}` });
    }
    if (f.type === 'toggle' && values[f.key]) {
      chips.push({ key: f.key, label: f.label });
    }
  });

  const body = (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row flex-wrap gap-3">
        {filters.map((f) => {
          if (f.type === 'search') {
            return (
              <div key={f.key} className="relative flex-1 min-w-[180px]">
                <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={values[f.key] || ''}
                  onChange={(e) => emit({ [f.key]: e.target.value })}
                  placeholder={f.placeholder || f.label}
                  className="w-full ps-9 pe-3 py-2.5 min-h-11 border border-gray-300 rounded-lg text-sm"
                  aria-label={f.label}
                />
              </div>
            );
          }
          if (f.type === 'select') {
            return (
              <select
                key={f.key}
                value={values[f.key] || ''}
                onChange={(e) => emit({ [f.key]: e.target.value })}
                className="px-3 py-2.5 min-h-11 border border-gray-300 rounded-lg text-sm bg-white"
                aria-label={f.label}
              >
                <option value="">{f.placeholder || f.label}</option>
                {(f.options || []).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            );
          }
          if (f.type === 'date-range') {
            return (
              <div key={f.key} className="flex flex-wrap gap-2 items-center">
                <input
                  type="date"
                  value={values[`${f.key}From`] || ''}
                  onChange={(e) => emit({ [`${f.key}From`]: e.target.value })}
                  className="px-3 py-2.5 min-h-11 border border-gray-300 rounded-lg text-sm"
                  aria-label={`${f.label} début`}
                />
                <input
                  type="date"
                  value={values[`${f.key}To`] || ''}
                  onChange={(e) => emit({ [`${f.key}To`]: e.target.value })}
                  className="px-3 py-2.5 min-h-11 border border-gray-300 rounded-lg text-sm"
                  aria-label={`${f.label} fin`}
                />
              </div>
            );
          }
          if (f.type === 'toggle') {
            return (
              <label key={f.key} className="inline-flex items-center gap-2 min-h-11 px-3 border border-gray-200 rounded-lg text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(values[f.key])}
                  onChange={(e) => emit({ [f.key]: e.target.checked })}
                />
                {f.label}
              </label>
            );
          }
          if (f.type === 'multi-select') {
            return (
              <div key={f.key} className="flex flex-wrap gap-2 w-full">
                {(f.options || []).map((o) => {
                  const active = (values[f.key] || []).includes(o.value);
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => {
                        const curr = values[f.key] || [];
                        emit({
                          [f.key]: active
                            ? curr.filter((v) => v !== o.value)
                            : [...curr, o.value],
                        });
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border min-h-9 ${
                        active
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-700 border-gray-300'
                      }`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            );
          }
          return null;
        })}
        <button
          type="button"
          onClick={resetAll}
          className="inline-flex items-center gap-2 px-4 py-2.5 min-h-11 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <RotateCcw size={16} /> Réinitialiser
        </button>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => {
                if (chip.remove) chip.remove();
                else emit({ [chip.key]: Array.isArray(values[chip.key]) ? [] : '' });
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold"
            >
              {chip.label}
              <X size={12} />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 mb-6 ${className}`}>
      <button
        type="button"
        className="md:hidden w-full inline-flex items-center justify-between gap-2 min-h-11 font-semibold text-gray-900"
        onClick={() => setMobileOpen((v) => !v)}
        aria-expanded={mobileOpen}
      >
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-primary-600" />
          {title}
          {chips.length > 0 && (
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
              {chips.length}
            </span>
          )}
        </span>
        <ChevronDown size={18} className={`transition-transform ${mobileOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`${mobileOpen ? 'mt-4 block' : 'hidden'} md:mt-0 md:block`}>{body}</div>
    </div>
  );
};

export default AdvancedFilters;
