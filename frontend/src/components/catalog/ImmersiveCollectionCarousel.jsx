import React, { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import { getCityImage } from '../../config/cityMedia';
import { PROPERTY_TYPE_ORDER } from '../../data/storeCatalog';
import { formatImageUrl } from '../../utils/formatImage';

const STAY_IMAGES = {
  riad: getCityImage('Marrakech', 'card'),
  villa: getCityImage('Taghazout', 'card'),
  apartment: getCityImage('Agadir', 'card'),
  suite: getCityImage('Casablanca', 'card'),
  other: getCityImage('Essaouira', 'card'),
};

/**
 * Carrousel immersif destinations / types / collections.
 */
const ImmersiveCollectionCarousel = ({
  products = [],
  browseMode = 'byTaxonomyParent',
  storeKey = 'explore',
  onSelect,
  title,
}) => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const scrollerRef = useRef(null);

  const items = useMemo(() => {
    if (!products.length) return [];

    if (browseMode === 'byPropertyType' || storeKey === 'stays') {
      const byType = new Map();
      products.forEach((p) => {
        const type = p.luxuryStay?.propertyType || 'other';
        if (!byType.has(type)) byType.set(type, []);
        byType.get(type).push(p);
      });
      return PROPERTY_TYPE_ORDER.filter((id) => byType.has(id)).map((type) => {
        const list = byType.get(type);
        const minPrice = Math.min(...list.map((p) => Number(p.price)).filter((n) => Number.isFinite(n)));
        const firstImg = list[0]?.images?.[0];
        return {
          key: type,
          title: t(`stores.stays.type_${type}`, type),
          image: firstImg ? formatImageUrl(firstImg) : (STAY_IMAGES[type] || STAY_IMAGES.other),
          priceFrom: Number.isFinite(minPrice) ? minPrice : null,
          badge: t('stores.stays.property_type', 'Hébergement'),
          payload: { propertyType: type },
        };
      });
    }

    // Destinations from product cities
    const byCity = new Map();
    products.forEach((p) => {
      const city = p.city || '';
      if (!city) return;
      if (!byCity.has(city)) byCity.set(city, []);
      byCity.get(city).push(p);
    });

    return [...byCity.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 8)
      .map(([city, list]) => {
        const minPrice = Math.min(...list.map((p) => Number(p.price)).filter((n) => Number.isFinite(n)));
        return {
          key: city,
          title: city,
          image: getCityImage(city, 'card'),
          priceFrom: Number.isFinite(minPrice) ? minPrice : null,
          badge: t('catalog.cities', 'Destinations'),
          payload: { city },
        };
      });
  }, [products, browseMode, storeKey, t]);

  if (items.length === 0) return null;

  const scroll = (dir) => {
    scrollerRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-xl md:text-2xl font-heading font-bold text-slate-900">
          {title
            || (storeKey === 'stays'
              ? t('stores.immersive.stays_title', 'Séjours : types d’hébergement')
              : storeKey === 'extras'
                ? t('stores.immersive.extras_title', 'Extras : destinations phares')
                : t('stores.immersive.explore_title', 'Maroc : destinations incontournables'))}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll(-1)}
            className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center"
            aria-label={t('carousel.scroll_left')}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center"
            aria-label={t('carousel.scroll_right')}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2"
      >
        {items.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect?.(item.payload)}
              className="relative shrink-0 w-[220px] sm:w-[260px] h-[320px] rounded-2xl overflow-hidden snap-start group text-start"
            >
              <img
                src={item.image}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />
              <span className="absolute top-3 start-3 text-[10px] font-bold uppercase tracking-wide bg-black/50 text-white px-2 py-1 rounded-md">
                {item.badge}
              </span>
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <h3 className="font-heading font-bold text-xl leading-tight mb-2 group-hover:underline decoration-2 underline-offset-4">
                  {item.title}
                </h3>
                {item.priceFrom != null && (
                  <p className="text-sm font-semibold">
                    {t('common.from')} {formatPrice(item.priceFrom, 'MAD')}
                  </p>
                )}
              </div>
            </button>
        ))}
      </div>
    </section>
  );
};

export default ImmersiveCollectionCarousel;
