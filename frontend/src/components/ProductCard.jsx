import React from 'react';
import { Star, MapPin } from 'lucide-react';
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
  if (!product) return null;

  const fallbackImage = getPlaceholderImage();
  const image = Array.isArray(product.images) && product.images.length > 0
    ? formatImageUrl(product.images[0])
    : fallbackImage;

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

  const handleClick = () => {
    trackProductClick(product, 'product_list');
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
          loading="lazy"
          decoding="async"
          width="400"
          height="256"
          className="w-full h-full object-cover group-hover:scale-110 transition duration-700 ease-out"
          onError={(e) => {
            e.target.src = fallbackImage;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent md:from-black/25" />

        <div className="absolute top-4 end-4 flex items-center gap-2">
          {rating && (
            <div className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-sm flex items-center space-x-1">
              <Star size={14} className="text-secondary-500 fill-secondary-500" />
              <span className="text-sm font-bold text-slate-800">{rating}</span>
              {typeof reviewCount === 'number' && reviewCount > 0 && (
                <span className="text-xs text-slate-500">({reviewCount})</span>
              )}
            </div>
          )}
          <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg shadow-sm">
            <FavoriteButton productId={product._id} product={product} size={18} />
          </div>
        </div>

        <div className="absolute top-4 start-4 flex flex-col gap-2 max-w-[60%]">
          <div className="inline-flex items-center gap-1 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md w-fit">
            {t('product.card.price_guaranteed')}
          </div>
          {product.badges && Array.isArray(product.badges) && product.badges.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <BadgeDisplay badges={product.badges} size="sm" />
            </div>
          )}
        </div>
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

        <h3 className="font-heading font-bold text-xl text-slate-900 mb-3 line-clamp-2 group-hover:text-primary-700 transition-colors">
          {product.title}
        </h3>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mt-4 pt-4 border-t border-slate-50">
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
