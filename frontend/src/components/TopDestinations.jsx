import React from 'react';
import DestinationCard from './DestinationCard';

import destinationsData from '../config/destinations';

const TopDestinations = () => {
  const destinations = destinationsData.map(dest => ({
    name: dest.name,
    image: dest.image,
    toursCount: Math.floor(Math.random() * 500) + 100 // mock count
  }));

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Top Destinations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {destinations.map((dest, index) => (
            <DestinationCard key={index} {...dest} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopDestinations;
