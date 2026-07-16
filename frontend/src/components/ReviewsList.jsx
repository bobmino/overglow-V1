import React, { useState, useCallback } from 'react';
import api from '../config/axios';
import { Star, ThumbsUp, CheckCircle, Filter, Flag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { logger } from '../utils/logger.js';

const ReviewItem = ({ review, onVote, onRefresh }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [hasVotedHelpful, setHasVotedHelpful] = useState(
    user && review.helpfulVoters?.some((v) => v.toString() === user._id)
  );
  const [_hasVotedNotHelpful, setHasVotedNotHelpful] = useState(
    user && review.notHelpfulVoters?.some((v) => v.toString() === user._id)
  );
  const [helpfulVotes, setHelpfulVotes] = useState(review.helpfulVotes || 0);

  const locale = i18n.language?.startsWith('ar')
    ? 'ar'
    : i18n.language?.startsWith('es')
      ? 'es'
      : i18n.language?.startsWith('en')
        ? 'en-GB'
        : 'fr-FR';

  const handleVote = async (helpful) => {
    if (!user) {
      alert(t('reviews.login_to_vote'));
      return;
    }

    try {
      const { data } = await api.post(`/api/reviews/${review._id}/vote`, { helpful });
      setHelpfulVotes(data.helpfulVotes || 0);
      setHasVotedHelpful(helpful === true);
      setHasVotedNotHelpful(helpful === false);
      if (onVote) onVote();
    } catch (error) {
      logger.error('Vote error:', error);
      alert(error.response?.data?.message || t('reviews.vote_error'));
    }
  };

  const handleReport = async () => {
    if (!user) {
      alert(t('reviews.login_to_report'));
      return;
    }

    const reason = prompt(t('reviews.report_prompt'));
    if (!reason) return;

    const reasonMap = {
      '1': 'spam',
      '2': 'inappropriate',
      '3': 'fake',
      '4': 'offensive',
      '5': 'other',
      spam: 'spam',
      inappropriate: 'inappropriate',
      fake: 'fake',
      offensive: 'offensive',
      other: 'other',
    };

    const mappedReason = reasonMap[reason.toLowerCase()] || 'other';
    const description = prompt(t('reviews.report_description_optional'));

    try {
      await api.post(`/api/reviews/${review._id}/report`, {
        reason: mappedReason,
        description: description || '',
      });
      alert(t('reviews.report_success'));
    } catch (error) {
      logger.error('Report error:', error);
      alert(error.response?.data?.message || t('reviews.report_error'));
    }
  };

  return (
    <div className="border-b border-gray-200 py-6 last:border-b-0">
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={16}
                className={
                  star <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                }
              />
            ))}
          </div>
          <span className="font-bold text-gray-900">{review.rating}.0</span>
          {review.isVerified && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
              <CheckCircle size={12} />
              {t('reviews.verified')}
            </span>
          )}
        </div>
        <div className="text-sm text-gray-500 shrink-0">
          {new Date(review.createdAt).toLocaleDateString(locale, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
      </div>

      {review.comment && <p className="text-gray-700 mb-3">{review.comment}</p>}

      {Array.isArray(review.photos) && review.photos.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-3">
          {review.photos.slice(0, 4).map((photo, index) => (
            <img
              key={index}
              src={photo}
              alt={t('reviews.photo_alt', { n: index + 1 })}
              className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition"
              onClick={() => window.open(photo, '_blank')}
            />
          ))}
        </div>
      )}

      {review.operatorResponse?.message && (
        <div className="bg-blue-50 border-s-4 border-blue-500 p-4 rounded-e-lg mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-blue-900">{t('reviews.operator_reply')}</span>
            {review.operatorResponse.respondedAt && (
              <span className="text-xs text-blue-600">
                {new Date(review.operatorResponse.respondedAt).toLocaleDateString(locale)}
              </span>
            )}
          </div>
          <p className="text-blue-800">{review.operatorResponse.message}</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center text-sm text-gray-500">
          <span className="font-semibold">{review.user?.name || t('reviews.anonymous')}</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => handleVote(true)}
            disabled={hasVotedHelpful}
            className={`flex items-center gap-1 text-sm transition ${
              hasVotedHelpful
                ? 'text-green-600 font-semibold cursor-default'
                : 'text-gray-500 hover:text-green-600 cursor-pointer'
            }`}
            title={hasVotedHelpful ? t('reviews.already_voted') : t('reviews.mark_helpful')}
          >
            <ThumbsUp size={16} className={hasVotedHelpful ? 'fill-current' : ''} />
            <span>
              {t('reviews.helpful')} ({helpfulVotes})
            </span>
          </button>
          <button
            type="button"
            onClick={handleReport}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 cursor-pointer transition"
            title={t('reviews.report')}
          >
            <Flag size={16} />
            <span className="hidden sm:inline">{t('reviews.report')}</span>
          </button>
          {user && user.role === 'Opérateur' && !review.operatorResponse && (
            <button
              type="button"
              onClick={() => {
                const response = prompt(t('reviews.reply_prompt'));
                if (response?.trim()) {
                  api
                    .post(`/api/reviews/${review._id}/reply`, { message: response.trim() })
                    .then(() => {
                      alert(t('reviews.reply_success'));
                      if (onRefresh) onRefresh();
                      else window.location.reload();
                    })
                    .catch((err) =>
                      alert(
                        t('reviews.reply_error') +
                          ': ' +
                          (err.response?.data?.message || '')
                      )
                    );
                }
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {t('reviews.reply')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Reviews are always loaded from API (Approved only).
 * initialReviews is ignored to avoid showing pending/rejected data from product payload.
 */
const ReviewsList = ({ productId }) => {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState([]);
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('helpful');

  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('filter', filter);
      if (sort) params.append('sort', sort);

      const { data } = await api.get(`/api/products/${productId}/reviews?${params.toString()}`);
      if (Array.isArray(data)) {
        setReviews(data);
        setBreakdown(null);
      } else {
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
        setBreakdown(data.breakdown || null);
      }
    } catch (error) {
      logger.error('Failed to fetch reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [productId, filter, sort]);

  React.useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const averageRating =
    breakdown?.average ??
    (reviews.length
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0');
  const totalCount = breakdown?.total ?? reviews.length;

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-600">{t('reviews.loading')}</p>
      </div>
    );
  }

  if ((!Array.isArray(reviews) || reviews.length === 0) && !breakdown?.total) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-600">{t('reviews.empty')}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex items-center flex-wrap gap-2">
          <h3 className="font-bold text-2xl me-2">{t('reviews.title')}</h3>
          <div className="flex items-center">
            <Star size={20} className="text-yellow-500 fill-yellow-500 me-1" />
            <span className="font-bold text-lg">{averageRating}</span>
            <span className="text-gray-500 ms-2">
              ({t('reviews.count', { count: totalCount })})
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Filter size={16} className="text-slate-400 hidden sm:block" />
          <label htmlFor="review-filter" className="sr-only">
            {t('reviews.filter_label')}
          </label>
          <select
            id="review-filter"
            name="review-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            aria-label={t('reviews.filter_label')}
          >
            <option value="all">{t('reviews.filter_all')}</option>
            <option value="5">{t('reviews.filter_stars', { stars: 5 })}</option>
            <option value="4">{t('reviews.filter_stars', { stars: 4 })}</option>
            <option value="3">{t('reviews.filter_stars', { stars: 3 })}</option>
            <option value="2">{t('reviews.filter_stars', { stars: 2 })}</option>
            <option value="1">{t('reviews.filter_stars', { stars: 1 })}</option>
            <option value="with-photos">{t('reviews.filter_photos')}</option>
            <option value="verified">{t('reviews.filter_verified')}</option>
          </select>
          <label htmlFor="review-sort" className="sr-only">
            {t('reviews.sort_label')}
          </label>
          <select
            id="review-sort"
            name="review-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            aria-label={t('reviews.sort_label')}
          >
            <option value="helpful">{t('reviews.sort_helpful')}</option>
            <option value="recent">{t('reviews.sort_recent')}</option>
            <option value="rating">{t('reviews.sort_rating')}</option>
          </select>
        </div>
      </div>

      {breakdown && breakdown.total > 0 && (
        <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-sm font-semibold text-slate-600 mb-3">{t('reviews.breakdown')}</p>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const pct = breakdown.percentages?.[star] ?? 0;
              const count = breakdown.counts?.[star] ?? 0;
              const isActive = filter === String(star);
              return (
                <button
                  type="button"
                  key={star}
                  onClick={() => setFilter(isActive ? 'all' : String(star))}
                  className={`w-full flex items-center gap-3 text-sm rounded-lg px-1 py-0.5 transition ${
                    isActive ? 'bg-amber-50 ring-1 ring-amber-200' : 'hover:bg-white'
                  }`}
                >
                  <span className="w-8 font-medium text-slate-700 shrink-0 text-start">
                    {star}★
                  </span>
                  <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-16 text-end text-slate-500 shrink-0">
                    {pct}% <span className="text-xs">({count})</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-gray-600">{t('reviews.empty_filter')}</p>
        </div>
      ) : (
        <div className="space-y-0">
          {reviews.map((review) => (
            <ReviewItem
              key={review._id}
              review={review}
              onVote={fetchReviews}
              onRefresh={fetchReviews}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsList;
