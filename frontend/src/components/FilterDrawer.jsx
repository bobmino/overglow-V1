import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
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
  onReset
}) => {
  // Prevent body scroll when drawer is open
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50 md:hidden backdrop-blur-sm"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 h-[85vh] bg-white z-50 md:hidden rounded-t-3xl shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="font-heading font-bold text-xl text-slate-900">Filtres et Tri</h2>
              <button
                onClick={onClose}
                className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Container - Make this scrollable and pad it */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {/* Pass all props to FilterSidebar, but tell it not to render its own border/shadow if we want, or just let it render inside. Since FilterSidebar has bg-white rounded-2xl border, it will look like a card inside the drawer, which is nice. */}
              <FilterSidebar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filters={filters}
                setFilters={setFilters}
                categories={categories}
                selectedCategories={selectedCategories}
                setSelectedCategories={setSelectedCategories}
                onReset={onReset}
              />
            </div>

            {/* Sticky Footer */}
            <div className="p-4 border-t border-slate-100 bg-white">
              <button
                onClick={onClose}
                className="w-full bg-primary-600 text-white font-bold text-lg py-4 rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/30"
              >
                Voir les résultats
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FilterDrawer;
