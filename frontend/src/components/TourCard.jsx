import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Heart } from 'lucide-react';
import BadgeDisplay from './BadgeDisplay';
import { useCurrency } from '../context/CurrencyContext';
import { formatImageUrl } from '../utils/formatImage';

/** [TASK-24] No fake Math.random ratings — use real product review data only. */
const TourCard = ({ product, isLikelyToSellOut = false }) => {
  if (!product) return null;
  const { formatPrice } = useCurrency();

  const fallbackImage = 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=800';
  const image = Array.isArray(product.images) && product.images.length > 0
    ? formatImageUrl(product.images[0])
    : fallbackImage;

  const rating = Number(product.rating || product.averageRating || 0);
  const reviewCount = Number(product.numReviews || product.reviewCount || 0);
  const hasReviews = reviewCount > 0 && rating > 0;

  return (
    <Link 
      to={`/products/${product._id}`}
      className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition border border-gray-100 min-w-[280px] max-w-[320px]"
    >
      <div className="relative h-56 overflow-hidden">
        <img 
          src={image} 
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          loading="lazy"
          onError={(e) => { e.target.src = fallbackImage; }}
        />
        {isLikelyToSellOut && (
          <div className="absolute top-3 start-3 bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            Likely to Sell Out
          </div>
        )}
        <button type="button" className="absolute top-3 end-3 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition" aria-label="Favorite">
          <Heart size={18} className="text-gray-700" />
        </button>
      </div>
      
      <div className="p-4">
        <div className="flex items-center text-gray-600 text-xs mb-2">
          <MapPin size={14} className="me-1" />
          {product.city}
        </div>

        {Array.isArray(product.badges) && product.badges.length > 0 && (
          <div className="mb-2">
            <BadgeDisplay badges={product.badges} size="sm" />
          </div>
        )}
        
        {hasReviews ? (
          <div className="flex items-center mb-2">
            <Star size={14} className="text-yellow-500 fill-yellow-500 me-1" />
            <span className="font-bold text-sm">{rating.toFixed(1)}</span>
            <span className="text-gray-500 text-xs ms-1">({reviewCount.toLocaleString()})</span>
          </div>
        ) : (
          <div className="mb-2 text-xs text-gray-400">Nouveauté</div>
        )}
        
        <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-green-700 transition min-h-[48px]">
          {product.title}
        </h3>
        {product.price !== undefined && (
          <p className="text-sm font-bold text-gray-900">{formatPrice(product.price, 'EUR')}</p>
        )}
      </div>
    </Link>
  );
};

export default TourCard;
