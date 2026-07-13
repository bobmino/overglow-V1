import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FilterSidebar from './FilterSidebar';

const FilterDrawer = ({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  filters,
  setFilters,
  categories,
  selectedCategories,
  setSelectedCategories,
  cities,
  selectedCity,
  setSelectedCity,
  onReset,
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50 md:hidden backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 start-0 end-0 h-[85vh] bg-white z-50 md:hidden rounded-t-3xl shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="font-heading font-bold text-xl text-slate-900">{t('catalog.filters')}</h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                aria-label={t('common.close')}
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <FilterSidebar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filters={filters}
                setFilters={setFilters}
                categories={categories}
                selectedCategories={selectedCategories}
                setSelectedCategories={setSelectedCategories}
                cities={cities}
                selectedCity={selectedCity}
                setSelectedCity={setSelectedCity}
                onReset={onReset}
              />
            </div>

            <div className="p-4 border-t border-slate-100 bg-white">
              <button
                type="button"
                onClick={onClose}
                className="w-full bg-primary-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary-600/20 active:scale-[0.98] transition-all"
              >
                {t('common.apply')}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FilterDrawer;
