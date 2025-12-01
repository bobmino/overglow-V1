import React, { useState, useEffect } from 'react';
import api from '../config/axios';
import ProductCard from './ProductCard';
import { Sparkles, TrendingUp, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RecommendationsSection = ({ type = 'personalized', title, limit = 6 }) => {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, [type, limit, isAuthenticated]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      let endpoint = '';
      
      if (type === 'personalized' && isAuthenticated) {
        endpoint = `/api/recommendations?limit=${limit}`;
      } else if (type === 'trending') {
        endpoint = `/api/recommendations/trending?limit=${limit}`;
      } else {
        endpoint = `/api/recommendations/new-user?limit=${limit}`;
      }

      const { data } = await api.get(endpoint);
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  const getIcon = () => {
    switch (type) {
      case 'personalized':
        return <Sparkles size={24} className="text-primary-600" />;
      case 'trending':
        return <TrendingUp size={24} className="text-orange-600" />;
      default:
        return <Star size={24} className="text-yellow-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {title && (
        <div className="flex items-center gap-3">
          {getIcon()}
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default RecommendationsSection;

