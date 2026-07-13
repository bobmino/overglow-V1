import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Users,
  Package,
  CalendarDays,
  Building2,
  Loader2,
  Command,
} from 'lucide-react';
import api from '../config/axios';
import { logger } from '../utils/logger.js';

const TYPE_META = {
  user: { label: 'Utilisateurs', Icon: Users, emoji: '👤' },
  product: { label: 'Produits', Icon: Package, emoji: '📦' },
  booking: { label: 'Réservations', Icon: CalendarDays, emoji: '📋' },
  operator: { label: 'Opérateurs', Icon: Building2, emoji: '🏢' },
};

/**
 * [PROMPT-12] Admin global search (debounce + Cmd/Ctrl+K).
 */
const AdminGlobalSearch = ({ compact = false }) => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const rootRef = useRef(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const runSearch = useCallback(async (term) => {
    if (!term || term.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/search', {
        params: { q: term.trim(), type: 'all' },
      });
      setResults(data.results || []);
      setActiveIndex(0);
    } catch (err) {
      logger.error('Admin search failed', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce 300ms
  useEffect(() => {
    if (!open && !query) return undefined;
    const t = setTimeout(() => runSearch(query), 300);
    return () => clearTimeout(t);
  }, [query, open, runSearch]);

  // Cmd/Ctrl+K
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Click outside
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const grouped = results.reduce((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  const flat = results;

  const selectResult = (item) => {
    if (!item) return;
    setOpen(false);
    setQuery('');
    setResults([]);
    navigate(item.url || '/admin/dashboard');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(0, flat.length - 1)));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (flat[activeIndex]) selectResult(flat[activeIndex]);
      else if (flat[0]) selectResult(flat[0]);
    }
  };

  return (
    <div className={`relative ${compact ? 'w-full' : 'w-full max-w-md'}`} ref={rootRef}>
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Rechercher… (Ctrl+K)"
          className="w-full pl-9 pr-16 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          aria-label="Recherche globale admin"
          aria-expanded={open}
          autoComplete="off"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-200 rounded bg-white">
          <Command size={10} />K
        </span>
      </div>

      {open && (query.trim().length >= 2 || loading) && (
        <div className="absolute z-50 mt-1.5 left-0 right-0 min-w-[280px] max-h-[70vh] overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl">
          {loading && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              Recherche…
            </div>
          )}

          {!loading && flat.length === 0 && query.trim().length >= 2 && (
            <div className="px-4 py-6 text-center text-sm text-slate-500">
              Aucun résultat pour « {query.trim()} »
            </div>
          )}

          {!loading &&
            Object.entries(grouped).map(([type, items]) => {
              const meta = TYPE_META[type] || { label: type, Icon: Search, emoji: '🔍' };
              return (
                <div key={type} className="border-b border-slate-100 last:border-0">
                  <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-50 sticky top-0">
                    {meta.emoji} {meta.label} ({items.length})
                  </div>
                  <ul>
                    {items.map((item) => {
                      const globalIdx = flat.findIndex(
                        (r) => r.id === item.id && r.type === item.type
                      );
                      const active = globalIdx === activeIndex;
                      const Icon = meta.Icon;
                      return (
                        <li key={`${item.type}-${item.id}`}>
                          <button
                            type="button"
                            onMouseEnter={() => setActiveIndex(globalIdx)}
                            onClick={() => selectResult(item)}
                            className={`w-full text-start px-3 py-2.5 flex gap-3 transition ${
                              active ? 'bg-primary-50' : 'hover:bg-slate-50'
                            }`}
                          >
                            <span className="mt-0.5 shrink-0 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                              <Icon size={16} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold text-slate-900 truncate">
                                {item.title}
                              </span>
                              <span className="block text-xs text-slate-500 truncate">
                                {item.subtitle}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default AdminGlobalSearch;
