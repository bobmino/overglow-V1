import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin } from 'lucide-react';
import BadgeDisplay from './BadgeDisplay';
import { useCurrency } from '../context/CurrencyContext';
import FavoriteButton from './FavoriteButton';
import { trackProductClick } from '../utils/analytics';

const ProductCard = ({ product }) => {
  if (!product) return null;
  const { formatPrice } = useCurrency();
  
  // Use first image or placeholder
  const image = Array.isArray(product.images) && product.images.length > 0 
    ? product.images[0] 
    : 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';

  // Calculate average rating (placeholder logic if no reviews yet)
  const rating = 4.8; 
  const reviewCount = 124;

  const schedulePrices = Array.isArray(product.schedules)
    ? product.schedules
        .map(schedule => Number(schedule.price))
        .filter(priceValue => Number.isFinite(priceValue) && priceValue >= 0)
    : [];

  const resolvedPrice = schedulePrices.length > 0
    ? Math.min(...schedulePrices)
    : Number(product.price);

  const price = Number.isFinite(resolvedPrice) && resolvedPrice >= 0
    ? resolvedPrice
    : 99;

  const handleClick = () => {
    trackProductClick(product, 'product_list');
  };

  return (
    <Link 
      to={`/products/${product._id}`} 
      onClick={handleClick}
      className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:-translate-y-1"
    >
      <div className="relative h-64 overflow-hidden bg-slate-200">
        <img 
          src={image} 
          alt={product.title} 
          loading="lazy"
          decoding="async"
          width="400"
          height="256"
          className="w-full h-full object-cover group-hover:scale-110 transition duration-700 ease-out"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
          }}
        />
        <div className="absolute top-0 inset-x-0 h-1/3 bg-gradient-to-b from-black/50 to-transparent opacity-60"></div>
        
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <div className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-sm flex items-center space-x-1">
            <Star size={14} className="text-secondary-500 fill-secondary-500" />
            <span className="text-sm font-bold text-slate-800">{rating}</span>
            <span className="text-xs text-slate-500">({reviewCount})</span>
          </div>
          <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg shadow-sm">
            <FavoriteButton productId={product._id} product={product} size={18} />
          </div>
        </div>

        <div className="absolute bottom-4 left-4">
          <div className="inline-flex items-center bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1 rounded-md">
            <MapPin size={12} className="mr-1" />
            {product.city}
          </div>
        </div>
        
        {/* Product Badges */}
        {product.badges && Array.isArray(product.badges) && product.badges.length > 0 && (
          <div className="absolute top-4 left-4 flex flex-wrap gap-1 max-w-[60%]">
            <BadgeDisplay badges={product.badges} size="sm" />
          </div>
        )}
      </div>
      
      <div className="p-5">
        <div className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-2">
          {product.category}
        </div>
        
        <h3 className="font-heading font-bold text-xl text-slate-900 mb-3 line-clamp-2 group-hover:text-primary-700 transition-colors">
          {product.title}
        </h3>
        
        <div className="flex items-end justify-between mt-4 pt-4 border-t border-slate-50">
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Starting from</span>
            <span className="font-bold text-2xl text-slate-900">
              {formatPrice(price, 'EUR')}
            </span>
          </div>
          <button className="bg-slate-50 text-slate-900 hover:bg-primary-600 hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors duration-300">
            View Details
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
