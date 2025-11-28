import React from 'react';
import { Link } from 'react-router-dom';

const DestinationCard = ({ name, image, toursCount }) => {
  return (
    <Link 
      to={`/search?city=${encodeURIComponent(name)}`}
      className="group relative h-48 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
    >
      <img 
        src={image} 
        alt={name}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white font-bold text-xl mb-1">{name}</h3>
        {toursCount && (
          <p className="text-white/90 text-sm">{toursCount.toLocaleString()} Tours</p>
        )}
      </div>
    </Link>
  );
};

export default DestinationCard;
