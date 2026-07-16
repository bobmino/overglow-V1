import React, { useRef } from 'react';
import { motion as Motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ProductCard from './ProductCard';
import { useLocalizedNavigate } from '../hooks/useLocalizedPath';

const DynamicCarousel = ({ title, items = [], categoryId, searchTag, seeMoreTo, renderCard }) => {
  const { t } = useTranslation();
  const scrollContainerRef = useRef(null);
  const localizedNavigate = useLocalizedNavigate();

  if (!items || items.length === 0) return null;

  const scroll = (direction) => {
    const container = scrollContainerRef.current;
    if (container) {
      const cardWidth = 320 + 24;
      const scrollAmount = direction === 'left' ? -cardWidth * 2 : cardWidth * 2;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleSeeMore = () => {
    if (seeMoreTo) {
      localizedNavigate(seeMoreTo);
    } else if (searchTag) {
      localizedNavigate(`/search?q=${encodeURIComponent(searchTag)}`);
    } else if (categoryId) {
      localizedNavigate(`/search?categoryGroup=${categoryId}`);
    } else {
      localizedNavigate('/explore');
    }
  };

  const displayedItems = items.slice(0, 5);
  const hasMore = items.length > 5;
  const remainingCount = items.length - 5;

  return (
    <section className="w-full py-6">
      {title && (
        <div className="flex items-center justify-between gap-3 mb-8 px-4 md:px-8">
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight min-w-0">
            {title}
          </h2>
          {hasMore && (
            <button
              type="button"
              onClick={handleSeeMore}
              className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors flex items-center gap-1.5 text-sm md:text-base group/all shrink-0 min-h-11"
            >
              <span>{t('common.see_all')}</span>
              <ArrowRight size={16} className="group-hover/all:translate-x-1 transition-transform rtl:rotate-180" />
            </button>
          )}
        </div>
      )}

      <div className="relative group/carousel">
        <button
          type="button"
          onClick={() => scroll('left')}
          className="absolute start-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-md p-3.5 rounded-full shadow-xl opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:scale-105 hover:bg-white text-slate-800 hidden md:flex border border-slate-100/50"
          aria-label={t('carousel.scroll_left')}
        >
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>

        <button
          type="button"
          onClick={() => scroll('right')}
          className="absolute end-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-md p-3.5 rounded-full shadow-xl opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:scale-105 hover:bg-white text-slate-800 hidden md:flex border border-slate-100/50"
          aria-label={t('carousel.scroll_right')}
        >
          <ChevronRight size={22} strokeWidth={2.5} />
        </button>

        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-4 md:px-8 pb-6 pt-2"
        >
          {displayedItems.map((item, index) => (
            <Motion.div
              key={item._id || index}
              className="min-w-[280px] md:min-w-[320px] max-w-[320px] flex-none snap-start"
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              {renderCard ? renderCard(item) : <ProductCard product={item} />}
            </Motion.div>
          ))}

          {hasMore && (
            <Motion.div
              className="min-w-[280px] md:min-w-[320px] flex-none snap-start cursor-pointer h-full self-stretch"
              whileHover={{ y: -6 }}
              onClick={handleSeeMore}
            >
              <div className="h-[430px] w-full rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-8 text-center transition-all duration-300 hover:shadow-xl hover:border-emerald-300 hover:bg-emerald-50/20 group/more">
                <div className="bg-white p-4.5 rounded-full shadow-md mb-4 group-hover/more:bg-emerald-500 group-hover/more:text-white transition-colors duration-300 text-emerald-600">
                  <ArrowRight size={28} className="group-hover/more:translate-x-1.5 transition-transform duration-300 rtl:rotate-180" />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 mb-2">
                  {t('carousel.more_count', { count: remainingCount })}
                </h3>
                <p className="text-slate-500 font-bold text-sm tracking-wide uppercase">
                  {t('carousel.explore_collection')}
                </p>
              </div>
            </Motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DynamicCarousel;
