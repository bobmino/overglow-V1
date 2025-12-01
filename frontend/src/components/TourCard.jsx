import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Heart } from 'lucide-react';

const TourCard = ({ product, isLikelyToSellOut = false }) => {
  if (!product) return null;
  
  const image = Array.isArray(product.images) && product.images.length > 0 
    ? product.images[0] 
    : 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=800';

  const rating = 4.5 + Math.random() * 0.5;
  const reviewCount = Math.floor(Math.random() * 10000) + 1000;

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
        />
        {isLikelyToSellOut && (
          <div className="absolute top-3 left-3 bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            Likely to Sell Out
          </div>
        )}
        <button className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition">
          <Heart size={18} className="text-gray-700" />
        </button>
      </div>
      
      <div className="p-4">
        <div className="flex items-center text-gray-600 text-xs mb-2">
          <MapPin size={14} className="mr-1" />
          {product.city}
        </div>
        
        <div className="flex items-center mb-2">
          <Star size={14} className="text-yellow-500 fill-yellow-500 mr-1" />
          <span className="font-bold text-sm">{rating.toFixed(1)}</span>
          <span className="text-gray-500 text-xs ml-1">({reviewCount.toLocaleString()})</span>
        </div>
        
        <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-green-700 transition min-h-[48px]">
          {product.title}
        </h3>
      </div>
    </Link>
  );
};

export default TourCard;
