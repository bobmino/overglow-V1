import React from 'react';
import { useQuery } from '@tanstack/react-query';
import DestinationCard from './DestinationCard';
import api from '../config/axios';
import destinationsData from '../config/destinations';

const TopDestinations = () => {
  const { data: activeDestinations = [], isLoading: loading } = useQuery({
    queryKey: ['activeDestinations'],
    queryFn: async () => {
      // Fetch up to 100 products to get a good coverage of active cities
      const { data } = await api.get('/api/products?limit=100');
      const products = Array.isArray(data) ? data : (data.products || []);
      
      const activeCities = new Set(products.map(p => p.city?.toLowerCase().trim()));
      
      return destinationsData
        .filter(dest => activeCities.has(dest.name.toLowerCase().trim()))
        .map(dest => {
          const count = products.filter(p => p.city?.toLowerCase().trim() === dest.name.toLowerCase().trim()).length;
          return {
            name: dest.name,
            image: dest.image,
            toursCount: count
          };
        });
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Ne pas afficher la section si aucune destination n'est prête (products.length === 0)
  if (loading || activeDestinations.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Top Destinations</h2>
        <div className={`grid grid-cols-1 md:grid-cols-${Math.min(activeDestinations.length, 3)} gap-6 max-w-5xl mx-auto`}>
          {activeDestinations.map((dest, index) => (
            <DestinationCard key={index} {...dest} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopDestinations;
