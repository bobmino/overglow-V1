import React from 'react';
import { Link } from 'react-router-dom';

const AttractionItem = ({ name, image, toursCount }) => (
  <Link 
    to={`/search?attraction=${encodeURIComponent(name)}`}
    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition group min-w-[280px]"
  >
    <img 
      src={image} 
      alt={name}
      className="w-16 h-16 rounded-lg object-cover group-hover:scale-105 transition"
    />
    <div>
      <h4 className="font-bold text-gray-900 group-hover:text-green-700 transition">{name}</h4>
      <p className="text-sm text-gray-500">{toursCount} Tours and Activities</p>
    </div>
  </Link>
);

const TopAttractions = () => {
  const attractions = [
    { name: "Colosseum", image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=200", toursCount: 121 },
    { name: "Ephesus (Efes)", image: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=200", toursCount: 103 },
    { name: "Louvre Museum", image: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=200", toursCount: 106 },
    { name: "Yellowstone National Park", image: "https://images.unsplash.com/photo-1490077476659-095159692ab5?w=200", toursCount: 121 },
    { name: "Moraine Lake", image: "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=200", toursCount: 103 },
    { name: "Blue Lagoon", image: "https://images.unsplash.com/photo-1520208422220-d12a3c588e6c?w=200", toursCount: 106 },
    { name: "Eiffel Tower", image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=200", toursCount: 839 },
    { name: "Sagrada Familia", image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=200", toursCount: 481 },
    { name: "Kona (Kailua-Kona)", image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=200", toursCount: 123 }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Top Attractions</h2>
        <div className="overflow-x-auto pb-4">
          <div className="flex space-x-4">
            {attractions.map((attr, index) => (
              <AttractionItem key={index} {...attr} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TopAttractions;
