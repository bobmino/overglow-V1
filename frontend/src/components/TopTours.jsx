import React, { useState, useEffect, useRef } from 'react';
import api from '../config/axios';
import TourCard from './TourCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TopTours = () => {
  const [products, setProducts] = useState([]);
  const scrollContainerRef = useRef(null);

  const fallbackProducts = [
    {
      _id: 'fallback_1',
      title: 'Session de Surf Premium',
      city: 'Taghazout',
      category: 'Surf',
      price: 45,
      averageRating: 4.9,
      reviews: new Array(124),
      images: ['https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&q=80'],
    },
    {
      _id: 'fallback_2',
      title: 'Aventure Quad dans les Dunes',
      city: 'Agadir',
      category: 'Aventure',
      price: 60,
      averageRating: 4.8,
      reviews: new Array(89),
      images: ['https://images.unsplash.com/photo-1518557984649-7b161c230cfa?w=800&q=80'],
    },
    {
      _id: 'fallback_3',
      title: 'Hammam Traditionnel & Spa Privé',
      city: 'Marrakech',
      category: 'Bien-être',
      price: 85,
      averageRating: 5.0,
      reviews: new Array(210),
      images: ['https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80'],
    }
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.get('/api/products');
        // Backend may return either an array (legacy) or { products, pagination }
        const productsArray = Array.isArray(data) ? data : (data?.products || []);
        
        if (productsArray.length === 0) {
          setProducts(fallbackProducts);
        } else {
          setProducts(productsArray.slice(0, 8)); // Limit to 8 products
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setProducts(fallbackProducts); // Set fallback on error
      }
    };
    fetchProducts();
  }, []);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 340; // Card width + gap
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Top Tours</h2>
        
        <div className="relative">
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 transition"
            aria-label="Scroll left"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div 
            ref={scrollContainerRef}
            className="overflow-x-auto scrollbar-hide pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex space-x-4">
              {Array.isArray(products) && products.length > 0 ? products.map((product, index) => (
                <TourCard 
                  key={product?._id || index} 
                  product={product}
                  isLikelyToSellOut={index % 3 === 0}
                />
              )) : (
                <div className="text-center text-gray-500 py-8">No tours available</div>
              )}
            </div>
          </div>
          
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 transition"
            aria-label="Scroll right"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default TopTours;
