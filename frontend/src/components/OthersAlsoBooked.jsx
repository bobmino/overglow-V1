import React, { useState, useEffect } from 'react';
import api from '../config/axios';
import ProductCard from './ProductCard';
import { Users } from 'lucide-react';

const OthersAlsoBooked = ({ productId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productId) {
      fetchAlsoBooked();
    }
  }, [productId]);

  const fetchAlsoBooked = async () => {
    try {
      // Get products that were booked together with this one
      // This would require a backend endpoint, for now we'll use similar products
      const { data } = await api.get(`/api/recommendations/similar/${productId}?limit=4`);
      setProducts(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch also booked products:', error);
      setProducts([]);
      setLoading(false);
    }
  };

  if (loading || !Array.isArray(products) || products.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Users size={24} className="text-primary-600" />
        <h2 className="text-2xl font-bold">Autres clients ont aussi réservé</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default OthersAlsoBooked;

