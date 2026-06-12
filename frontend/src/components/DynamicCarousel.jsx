import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProductCard from './ProductCard';

const DynamicCarousel = ({ title, items = [], categoryId, searchTag, renderCard }) => {
  const scrollContainerRef = useRef(null);
  const navigate = useNavigate();

  if (!items || items.length === 0) return null;

  const scroll = (direction) => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = direction === 'left' ? -container.offsetWidth : container.offsetWidth;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleSeeMore = () => {
    if (searchTag) {
      navigate(`/search?q=${encodeURIComponent(searchTag)}`);
    } else if (categoryId) {
      navigate(`/search?category=${categoryId}`);
    } else {
      navigate('/search');
    }
  };

  const displayedItems = items.slice(0, 5);
  const hasMore = items.length > 5;
  const remainingCount = items.length - 5;

  return (
    <section className="w-full">
      {title && (
        <div className="flex items-center justify-between mb-8 px-4 md:px-8">
          <h2 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">
            {title}
          </h2>
          {hasMore && (
            <button
              onClick={handleSeeMore}
              className="text-primary-600 font-semibold hover:text-primary-700 transition-colors flex items-center gap-1"
            >
              Voir tout <ArrowRight size={16} />
            </button>
          )}
        </div>
      )}

      <div className="relative group">
        {/* Navigation Arrows */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 disabled:opacity-0 hover:bg-white text-slate-800 hidden md:flex"
          aria-label="Scroll left"
        >
          <ChevronLeft size={24} />
        </button>

        <button
          onClick={() => scroll('right')}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 disabled:opacity-0 hover:bg-white text-slate-800 hidden md:flex"
          aria-label="Scroll right"
        >
          <ChevronRight size={24} />
        </button>

        {/* Carousel Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-4 md:px-8 pb-8 pt-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayedItems.map((item, index) => (
            <motion.div
              key={item._id || index}
              className="min-w-[280px] md:min-w-[320px] max-w-[320px] flex-none snap-start"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {renderCard ? renderCard(item) : <ProductCard product={item} />}
            </motion.div>
          ))}

          {hasMore && (
            <motion.div
              className="min-w-[280px] md:min-w-[320px] flex-none snap-start cursor-pointer"
              whileHover={{ scale: 1.02 }}
              onClick={handleSeeMore}
            >
              <div className="h-full w-full rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex flex-col items-center justify-center p-8 text-center transition-all hover:shadow-xl hover:border-primary-200 group/more">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover/more:bg-primary-50 transition-colors">
                  <ArrowRight size={32} className="text-primary-600 group-hover/more:translate-x-1 transition-transform" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  + {remainingCount} autres
                </h3>
                <p className="text-slate-500 font-medium">Explorer la collection complète</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DynamicCarousel;
