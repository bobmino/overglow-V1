import React, { useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FilterSidebar from '../FilterSidebar';

/**
 * Modal filtres centrée en haut (desktop / tablette / mobile) —
 * masque le hero / haut de page, pas un tiroir latéral.
 */
const FilterModal = ({
  isOpen,
  onClose,
  onApply,
  onReset,
  resultCount = 0,
  ...sidebarProps
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const applyLabel =
    resultCount === 1
      ? t('filters.see_one_result', { defaultValue: 'Voir 1 résultat' })
      : t('filters.see_n_results', {
          defaultValue: 'Voir {{count}} résultats',
          count: resultCount,
        });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-primary-950/55 z-[75] backdrop-blur-[2px]"
          />

          <Motion.div
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed z-[80] left-1/2 -translate-x-1/2 top-[4.75rem] sm:top-[5.25rem] w-[min(100%-1.5rem,36rem)] max-h-[min(78dvh,calc(100dvh-6.5rem))] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-modal-title"
          >
            <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-100 shrink-0 bg-white">
              <h2 id="filter-modal-title" className="font-heading font-bold text-lg sm:text-xl text-slate-900">
                {t('catalog.filters')}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 min-h-11 min-w-11 inline-flex items-center justify-center bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200"
                aria-label={t('common.close')}
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 sm:px-6 py-4 custom-scrollbar overscroll-contain">
              <FilterSidebar {...sidebarProps} onReset={onReset} compact />
            </div>

            <div className="flex gap-3 p-4 border-t border-slate-100 bg-white shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => {
                  onReset?.();
                }}
                className="flex-1 min-h-12 rounded-xl border border-slate-200 text-slate-800 font-semibold hover:bg-slate-50"
              >
                {t('filters.clear_all')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onApply?.();
                  onClose?.();
                }}
                className="flex-[1.4] min-h-12 rounded-xl bg-primary-600 text-white font-bold shadow-lg shadow-primary-600/20 hover:bg-primary-700"
              >
                {applyLabel}
              </button>
            </div>
          </Motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FilterModal;
