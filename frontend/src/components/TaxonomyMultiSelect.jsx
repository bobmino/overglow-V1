import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';

/**
 * Sélecteur multi taxonomie style Viator :
 * parents cochables + sous-catégories searchable + chips.
 */
const TaxonomyMultiSelect = ({
  productType = null,
  value = [],
  onChange,
  label = null,
  hint = null,
  lang = 'fr',
  required = false,
  className = '',
}) => {
  const { t, i18n } = useTranslation();
  const effectiveLang = lang || i18n.language?.slice(0, 2) || 'fr';
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [openParentId, setOpenParentId] = useState(null);

  const selectedIds = useMemo(
    () => (Array.isArray(value) ? value.map((id) => String(id)) : []),
    [value]
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const params = new URLSearchParams({ lang: effectiveLang });
        if (productType) params.set('productType', productType);
        const { data } = await api.get(`/api/taxonomy?${params.toString()}`);
        if (!cancelled) {
          setTree(Array.isArray(data?.tree) ? data.tree : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(t('taxonomy.load_error', 'Impossible de charger les catégories.'));
          setTree([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [productType, effectiveLang, t]);

  const leafIndex = useMemo(() => {
    const map = new Map();
    tree.forEach((parent) => {
      (parent.children || []).forEach((child) => {
        map.set(String(child._id), { ...child, parentLabel: parent.label, parentId: String(parent._id) });
      });
    });
    return map;
  }, [tree]);

  const selectedLeaves = useMemo(
    () => selectedIds.map((id) => leafIndex.get(id)).filter(Boolean),
    [selectedIds, leafIndex]
  );

  const emit = useCallback(
    (nextIds) => {
      if (typeof onChange === 'function') onChange(nextIds);
    },
    [onChange]
  );

  const toggleLeaf = useCallback(
    (leafId) => {
      const id = String(leafId);
      const next = selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id];
      emit(next);
    },
    [selectedIds, emit]
  );

  const toggleParent = useCallback(
    (parent) => {
      const childIds = (parent.children || []).map((c) => String(c._id));
      if (!childIds.length) return;
      const allSelected = childIds.every((id) => selectedIds.includes(id));
      const next = allSelected
        ? selectedIds.filter((id) => !childIds.includes(id))
        : [...new Set([...selectedIds, ...childIds])];
      emit(next);
      setOpenParentId(String(parent._id));
    },
    [selectedIds, emit]
  );

  const removeChip = useCallback(
    (leafId) => {
      emit(selectedIds.filter((id) => id !== String(leafId)));
    },
    [selectedIds, emit]
  );

  const filteredChildren = useCallback(
    (parent) => {
      const children = parent.children || [];
      const q = query.trim().toLowerCase();
      if (!q) return children;
      return children.filter((c) => {
        const labelText = String(c.label || '').toLowerCase();
        const slug = String(c.slug || '').toLowerCase();
        return labelText.includes(q) || slug.includes(q);
      });
    },
    [query]
  );

  const parentSelectionState = (parent) => {
    const childIds = (parent.children || []).map((c) => String(c._id));
    if (!childIds.length) return 'none';
    const count = childIds.filter((id) => selectedIds.includes(id)).length;
    if (count === 0) return 'none';
    if (count === childIds.length) return 'all';
    return 'partial';
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {(label || required) && (
        <label className="block text-sm font-semibold text-gray-700">
          {label || t('taxonomy.label', 'Types d’expériences')}
          {required && <span className="text-red-500 ms-1">*</span>}
        </label>
      )}
      {hint && <p className="text-xs text-gray-500">{hint}</p>}

      {selectedLeaves.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedLeaves.map((leaf) => (
            <span
              key={leaf._id}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 text-primary-800 border border-primary-200 px-3 py-1 text-xs font-medium"
            >
              <span className="text-primary-500/80">{leaf.parentLabel}</span>
              <span>·</span>
              <span>{leaf.label}</span>
              <button
                type="button"
                onClick={() => removeChip(leaf._id)}
                className="ms-0.5 rounded-full p-0.5 hover:bg-primary-100"
                aria-label={t('common.remove', 'Retirer')}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('taxonomy.search_placeholder', 'Rechercher une sous-catégorie…')}
          className="w-full ps-9 pe-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-600 focus:border-transparent"
        />
      </div>

      {loading && (
        <p className="text-sm text-gray-500">{t('common.loading', 'Chargement…')}</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="space-y-2 max-h-80 overflow-y-auto border border-gray-200 rounded-xl p-2 bg-gray-50/60">
          {tree.length === 0 && (
            <p className="text-sm text-gray-500 p-3">
              {t('taxonomy.empty', 'Aucune catégorie disponible.')}
            </p>
          )}
          {tree.map((parent) => {
            const state = parentSelectionState(parent);
            const isOpen = openParentId === String(parent._id) || Boolean(query.trim());
            const children = filteredChildren(parent);
            if (query.trim() && children.length === 0) return null;

            return (
              <div
                key={parent._id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
              >
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => toggleParent(parent)}
                    className={`flex items-center justify-center w-5 h-5 rounded border shrink-0 ${
                      state === 'all'
                        ? 'bg-primary-600 border-primary-600'
                        : state === 'partial'
                          ? 'bg-primary-100 border-primary-500'
                          : 'border-gray-300 bg-white'
                    }`}
                    aria-label={parent.label}
                  >
                    {(state === 'all' || state === 'partial') && (
                      <Check size={12} className={state === 'all' ? 'text-white' : 'text-primary-700'} />
                    )}
                  </button>
                  <button
                    type="button"
                    className="flex-1 flex items-center justify-between text-start"
                    onClick={() =>
                      setOpenParentId((prev) =>
                        prev === String(parent._id) ? null : String(parent._id)
                      )
                    }
                  >
                    <span className="font-semibold text-sm text-gray-900">{parent.label}</span>
                    <span className="flex items-center gap-2 text-xs text-gray-500">
                      {state !== 'none' && (
                        <span className="text-primary-700 font-medium">
                          {(parent.children || []).filter((c) =>
                            selectedIds.includes(String(c._id))
                          ).length}
                          /{(parent.children || []).length}
                        </span>
                      )}
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </span>
                  </button>
                </div>

                {isOpen && (
                  <div className="border-t border-gray-100 max-h-48 overflow-y-auto">
                    {children.map((child) => {
                      const active = selectedIds.includes(String(child._id));
                      return (
                        <label
                          key={child._id}
                          className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50"
                        >
                          <div
                            className={`flex items-center justify-center w-4.5 h-4.5 w-[18px] h-[18px] rounded border ${
                              active
                                ? 'bg-primary-600 border-primary-600'
                                : 'border-gray-300 bg-white'
                            }`}
                          >
                            {active && <Check size={12} className="text-white" />}
                          </div>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={active}
                            onChange={() => toggleLeaf(child._id)}
                          />
                          <span className="text-sm text-gray-700">{child.label}</span>
                        </label>
                      );
                    })}
                    {children.length === 0 && (
                      <p className="text-xs text-gray-400 px-3 py-2">
                        {t('taxonomy.no_match', 'Aucun résultat.')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TaxonomyMultiSelect;
