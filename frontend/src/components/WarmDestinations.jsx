import React from 'react';
import DestinationCard from './DestinationCard';

const WarmDestinations = () => {
  const destinations = [
    { name: "Rio de Janeiro", image: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800", toursCount: 1488 },
    { name: "Bali", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800", toursCount: 6799 },
    { name: "Cancun", image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800", toursCount: 3721 },
    { name: "Miami", image: "https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=800", toursCount: 1079 },
    { name: "Siem Reap", image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=800", toursCount: 2397 },
    { name: "Punta Cana", image: "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800", toursCount: 2521 }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Warm Destinations</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {destinations.map((dest, index) => (
            <DestinationCard key={index} {...dest} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default WarmDestinations;
