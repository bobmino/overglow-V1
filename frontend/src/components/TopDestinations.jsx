import React from 'react';
import { useQuery } from '@tanstack/react-query';
import DestinationCard from './DestinationCard';
import api from '../config/axios';
import destinationsData from '../config/destinations';
import { logger } from '../utils/logger.js';

const TopDestinations = () => {
  const { data: activeDestinations = [], isLoading: loading } = useQuery({
    queryKey: ['activeDestinations'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/api/products?limit=100');
        const products = Array.isArray(data) ? data : (data.products || []);
        
        const activeCities = new Set(products.map(p => p.city?.toLowerCase().trim()));
        
        return destinationsData.map(dest => {
          const count = products.filter(p => p.city?.toLowerCase().trim() === dest.name.toLowerCase().trim()).length;
          return {
            name: dest.name,
            image: dest.image,
            toursCount: count > 0 ? count : 0
          };
        });
      } catch (error) {
        logger.error('Failed to load active destinations:', error);
        // Fallback to default destinations
        return destinationsData.map(dest => ({ ...dest, toursCount: 0 }));
      }
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="h-8 w-64 bg-slate-200 rounded animate-pulse mx-auto mb-12"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-200 rounded-2xl animate-pulse"></div>)}
          </div>
        </div>
      </section>
    );
  }

  const displayDestinations = activeDestinations.length > 0 ? activeDestinations : destinationsData.map(dest => ({ ...dest, toursCount: 0 }));

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Top Destinations</h2>
        <div className={`grid grid-cols-1 md:grid-cols-${Math.min(displayDestinations.length, 3)} gap-6 max-w-5xl mx-auto`}>
          {displayDestinations.map((dest, index) => (
            <DestinationCard key={index} {...dest} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopDestinations;
