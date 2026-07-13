import React from 'react';
import { getCityImage } from '../config/cityMedia.js';

/** [WebP migration] Moroccan highlights with local WebP (replaces global fake attractions). */
const TopAttractions = () => {
  const attractions = [
    { name: 'Médina de Marrakech', image: getCityImage('Marrakech', 'card') },
    { name: 'Médina de Fès', image: getCityImage('Fès', 'card') },
    { name: 'Chefchaouen', image: getCityImage('Chefchaouen', 'card') },
    { name: 'Essaouira', image: getCityImage('Essaouira', 'card') },
    { name: 'Plage d’Agadir', image: getCityImage('Agadir', 'card') },
    { name: 'Taghazout', image: getCityImage('Taghazout', 'card') },
  ];

  return (
    <section className="py-12">
      <div className="container mx-auto px-4 flex flex-wrap gap-4 justify-center">
        {attractions.map((item) => (
          <div key={item.name} className="w-36 text-center">
            <img
              src={item.image}
              alt={item.name}
              className="w-36 h-24 object-cover rounded-lg mb-2"
              loading="lazy"
            />
            <p className="text-sm font-medium text-gray-800">{item.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TopAttractions;
