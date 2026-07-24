import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Star, ChevronRight } from 'lucide-react';
import api from '../config/axios';
import LocalizedLink from './LocalizedLink';
import { formatImageUrl, getPlaceholderImage } from '../utils/formatImage';

/**
 * Carrousel avis voyageurs (DB only — masqué si vide).
 */
const TravelerReviewsCarousel = () => {
  const { t, i18n } = useTranslation();
  const scrollerRef = useRef(null);

  const { data } = useQuery({
    queryKey: ['featuredReviews', i18n.language],
    queryFn: async () => {
      const { data: res } = await api.get('/api/reviews/featured?limit=8');
      return Array.isArray(res?.reviews) ? res.reviews : [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const reviews = data || [];
  if (reviews.length === 0) return null;

  const monthFmt = new Intl.DateTimeFormat(i18n.language || 'fr', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <section className="w-full py-6 px-4 md:px-8">
      <div className="flex items-center justify-between gap-3 mb-8">
        <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
          {t('home.reviews_title', 'Le Maroc, vu par les voyageurs')}
        </h2>
        <button
          type="button"
          onClick={() => scrollerRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
          className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center shrink-0"
          aria-label={t('carousel.scroll_right')}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2"
      >
        {reviews.map((review) => {
          const thumb =
            Array.isArray(review.product?.images) && review.product.images[0]
              ? formatImageUrl(review.product.images[0])
              : getPlaceholderImage();
          const excerpt = String(review.comment || '').slice(0, 140);
          const headline = excerpt.split(/[.!?]/)[0]?.slice(0, 48) || t('home.review_default_headline', 'Belle expérience');
          const dateLabel = review.createdAt ? monthFmt.format(new Date(review.createdAt)) : '';

          return (
            <article
              key={review._id}
              className="shrink-0 w-[280px] sm:w-[300px] snap-start bg-white border border-slate-200 rounded-2xl p-4 flex flex-col"
            >
              <div className="flex gap-3 mb-3">
                <img
                  src={thumb}
                  alt=""
                  className="w-14 h-14 rounded-xl object-cover bg-slate-100 shrink-0"
                  loading="lazy"
                />
                <h3 className="font-semibold text-sm text-slate-900 line-clamp-3 leading-snug">
                  {review.product?.title}
                </h3>
              </div>

              <div className="flex items-center gap-0.5 mb-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={
                      i < Math.round(review.rating || 0)
                        ? 'text-primary-600 fill-primary-600'
                        : 'text-slate-200'
                    }
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500 mb-3">
                {review.userName}
                {dateLabel ? `, ${dateLabel}` : ''}
              </p>

              <p className="font-bold text-sm text-slate-900 mb-1 line-clamp-1">{headline}</p>
              <p className="text-sm text-slate-600 line-clamp-3 flex-1 mb-4">
                {excerpt}
                {String(review.comment || '').length > 140 ? '…' : ''}
              </p>

              <LocalizedLink
                to={`/products/${review.product._id}`}
                className="mt-auto inline-flex items-center justify-center min-h-11 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition-colors"
              >
                {t('home.review_cta', 'Vérifier la disponibilité')}
              </LocalizedLink>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default TravelerReviewsCarousel;
