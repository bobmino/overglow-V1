import React from 'react';
import DestinationCard from './DestinationCard';

const TopDestinations = () => {
  const destinations = [
    { name: "Las Vegas", image: "https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=800", toursCount: 1488 },
    { name: "Rome", image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800", toursCount: 6799 },
    { name: "Paris", image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800", toursCount: 3731 },
    { name: "London", image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800", toursCount: 4521 },
    { name: "New York City", image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800", toursCount: 2891 },
    { name: "Washington DC", image: "https://images.unsplash.com/photo-1617581629397-a72507c3de9e?w=800", toursCount: 1234 },
    { name: "Cancun", image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800", toursCount: 3721 },
    { name: "Florence", image: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800", toursCount: 2156 },
    { name: "Barcelona", image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800", toursCount: 4892 },
    { name: "Oahu", image: "https://images.unsplash.com/photo-1542259009477-d625272157b7?w=800", toursCount: 1876 }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Top Destinations</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {destinations.map((dest, index) => (
            <DestinationCard key={index} {...dest} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopDestinations;
