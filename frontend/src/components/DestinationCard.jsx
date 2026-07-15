import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatImageUrlWithFallback } from '../utils/formatImage';
import { getCityAlt } from '../config/cityMedia.js';
import LocalizedLink from './LocalizedLink';

const DestinationCard = ({ name, image, toursCount }) => {
  const { i18n } = useTranslation();
  const imageSrc = formatImageUrlWithFallback(image);

  return (
    <LocalizedLink
      to={`/search?city=${encodeURIComponent(name)}`}
      className="group relative h-48 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
    >
      <img
        src={imageSrc}
        alt={getCityAlt(name, i18n.language)}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
      <div className="absolute bottom-0 start-0 end-0 p-4">
        <h3 className="text-white font-bold text-xl mb-1">{name}</h3>
        {toursCount > 0 && (
          <p className="text-white/90 text-sm">{toursCount.toLocaleString()} expériences</p>
        )}
      </div>
    </LocalizedLink>
  );
};

export default DestinationCard;
