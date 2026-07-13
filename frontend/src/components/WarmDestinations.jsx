import React from 'react';
import { getCityImage } from '../config/cityMedia.js';

/** [WebP migration] Morocco destinations only — local WebP assets. */
const WarmDestinations = () => {
  const destinations = [
    { name: 'Marrakech', image: getCityImage('Marrakech', 'card'), toursCount: null },
    { name: 'Fès', image: getCityImage('Fès', 'card'), toursCount: null },
    { name: 'Chefchaouen', image: getCityImage('Chefchaouen', 'card'), toursCount: null },
    { name: 'Essaouira', image: getCityImage('Essaouira', 'card'), toursCount: null },
    { name: 'Agadir', image: getCityImage('Agadir', 'card'), toursCount: null },
    { name: 'Taghazout', image: getCityImage('Taghazout', 'card'), toursCount: null },
  ];

  return (
    <section className="py-12">
      <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-3 gap-4">
        {destinations.map((dest) => (
          <div key={dest.name} className="relative h-40 rounded-xl overflow-hidden">
            <img src={dest.image} alt={dest.name} className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-black/30 flex items-end p-3">
              <span className="text-white font-semibold">{dest.name}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WarmDestinations;
