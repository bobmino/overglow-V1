import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/axios';
import ProductCard from './ProductCard';
import { Sparkles, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RecommendedProducts = ({ title = "Pour vous", limit = 8, type = 'personalized' }) => {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, [isAuthenticated, type]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      let data;
      
      if (isAuthenticated && type === 'personalized') {
        // Get personalized recommendations
        const response = await api.get(`/api/recommendations?limit=${limit}`);
        data = response.data;
      } else {
        // Get trending or new user recommendations
        const endpoint = type === 'trending' 
          ? `/api/recommendations/trending?limit=${limit}`
          : `/api/recommendations/new-user?limit=${limit}`;
        const response = await api.get(endpoint);
        data = response.data;
      }
      
      setProducts(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      setProducts([]);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-12 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles size={24} className="text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-80 bg-gray-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!Array.isArray(products) || products.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles size={24} className="text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          </div>
          <Link
            to="/search"
            className="text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1"
          >
            Voir tout
            <TrendingUp size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecommendedProducts;

