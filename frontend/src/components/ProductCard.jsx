import React, { useState, useCallback } from 'react';
import { Star, MapPin, Clock, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import BadgeDisplay from './BadgeDisplay';
import { useCurrency } from '../context/CurrencyContext';
import FavoriteButton from './FavoriteButton';
import { trackProductClick } from '../utils/analytics';
import { formatImageUrl, getPlaceholderImage } from '../utils/formatImage';
import LocalizedLink from './LocalizedLink';

const ProductCard = ({ product }) => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const [imageIndex, setImageIndex] = useState(0);

  if (!product) return null;

  const fallbackImage = getPlaceholderImage();
  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images.map((src) => formatImageUrl(src)).filter(Boolean)
    : [fallbackImage];
  const safeIndex = Math.min(imageIndex, images.length - 1);
  const image = images[safeIndex] || fallbackImage;
  const hasCarousel = images.length > 1;

  const rating = product.metrics?.averageRating
    ? Number(product.metrics.averageRating).toFixed(1)
    : null;
  const reviewCount = product.metrics?.reviewCount;

  const schedulePrices = Array.isArray(product.schedules)
    ? product.schedules
        .map((schedule) => Number(schedule.price))
        .filter((priceValue) => Number.isFinite(priceValue) && priceValue >= 0)
    : [];

  const resolvedPrice = schedulePrices.length > 0
    ? Math.min(...schedulePrices)
    : Number(product.price);

  const price = Number.isFinite(resolvedPrice) && resolvedPrice >= 0
    ? resolvedPrice
    : null;

  const isFreeCancel = product.cancellationPolicy?.type === 'free'
    || (Array.isArray(product.tags) && product.tags.some((tag) => String(tag).toLowerCase() === 'annulation-gratuite'));

  const isBestseller = Array.isArray(product.tags)
    && product.tags.some((tag) => String(tag).toLowerCase() === 'bestseller');
  const isPopular = Boolean(product.metrics?.isPopular)
    || (Number(product.metrics?.bookingCount) || 0) >= 10;

  const operatorName =
    product.operator?.publicName
    || product.operator?.companyName
    || null;

  const handleClick = () => {
    trackProductClick(product, 'product_list');
  };

  const stopNav = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const goPrev = (e) => {
    stopNav(e);
    setImageIndex((i) => (i - 1 + images.length) % images.length);
  };

  const goNext = (e) => {
    stopNav(e);
    setImageIndex((i) => (i + 1) % images.length);
  };

  return (
    <LocalizedLink
      to={`/products/${product._id}`}
      onClick={handleClick}
      data-testid="product-card"
      className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-300 border border-slate-100"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-slate-200">
        <img
          src={image}
          alt={product.title}
          loading={safeIndex === 0 ? 'lazy' : 'eager'}
          decoding="async"
          width="400"
          height="256"
          className="w-full h-full object-cover group-hover:scale-105 transition duration-700 ease-out"
          onError={(e) => {
            e.target.src = fallbackImage;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        <div className="absolute top-4 end-4 flex items-center gap-2 z-10">
          {rating && (
            <div className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-sm flex items-center space-x-1">
              <Star size={14} className="text-secondary-500 fill-secondary-500" />
              <span className="text-sm font-bold text-slate-800">{rating}</span>
              {typeof reviewCount === 'number' && reviewCount > 0 && (
                <span className="text-xs text-slate-500">({reviewCount})</span>
              )}
            </div>
          )}
          <div
            className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg shadow-sm"
            onClick={stopNav}
            onKeyDown={stopNav}
            role="presentation"
          >
            <FavoriteButton productId={product._id} product={product} size={18} />
          </div>
        </div>

        <div className="absolute top-4 start-4 flex flex-col gap-2 max-w-[65%] z-10">
          {(isBestseller || isPopular) && (
            <div className="inline-flex items-center gap-1 bg-slate-900/85 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md w-fit">
              {t('filters.tag_bestseller', 'Meilleures ventes')}
            </div>
          )}
          {product.badges && Array.isArray(product.badges) && product.badges.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <BadgeDisplay badges={product.badges} size="sm" />
            </div>
          )}
        </div>

        {hasCarousel && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute start-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 shadow opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              aria-label={t('carousel.scroll_left', 'Précédent')}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute end-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 shadow opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              aria-label={t('carousel.scroll_right', 'Suivant')}
            >
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 z-10">
              {images.slice(0, 5).map((_, idx) => (
                <span
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full ${
                    idx === safeIndex % 5 ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between mb-2 gap-2">
          <div className="text-xs font-bold text-primary-600 uppercase tracking-wider truncate">
            {product.category}
          </div>
          <div className="text-xs text-slate-500 flex items-center shrink-0">
            <MapPin size={12} className="me-1" />
            {product.city}
          </div>
        </div>

        <h3 className="font-heading font-bold text-xl text-slate-900 mb-2 line-clamp-2 group-hover:text-primary-700 transition-colors">
          {product.title}
        </h3>

        <div className="space-y-1.5 mb-3 min-h-[2.5rem]">
          {isFreeCancel && (
            <p className="flex items-center gap-1.5 text-sm text-primary-700 font-medium">
              <Check size={14} className="shrink-0" strokeWidth={2.5} />
              {t('filters.tag_free_cancel', 'Annulation gratuite')}
            </p>
          )}
          {product.duration && (
            <p className="flex items-center gap-1.5 text-sm text-slate-600">
              <Clock size={14} className="shrink-0 text-slate-400" />
              {product.duration}
            </p>
          )}
          {operatorName && (
            <p className="text-xs text-slate-500 truncate">
              {t('product.card.by_operator', { defaultValue: 'Par {{name}}', name: operatorName })}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mt-2 pt-4 border-t border-slate-50">
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">{t('common.from')}</span>
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-2xl text-primary-600">
                {price != null ? formatPrice(price, 'MAD') : '—'}
              </span>
              <span className="text-xs text-slate-500 font-medium">{t('common.per_person_short')}</span>
            </div>
          </div>
          <span className="inline-flex items-center justify-center min-h-11 w-full sm:w-auto bg-slate-50 text-slate-900 group-hover:bg-primary-600 group-hover:text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors duration-300 shadow-sm">
            {t('product.card.view_offer')}
          </span>
        </div>
      </div>
    </LocalizedLink>
  );
};

export default ProductCard;
