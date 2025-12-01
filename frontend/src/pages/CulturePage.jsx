import React, { useState } from 'react';
import { BookOpen, Calendar, Palette, Utensils, Music, MapPin, Sparkles } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';

// Import culture data - will be fetched from API or moved to frontend
const moroccanCultureData = {
  traditions: [
    {
      id: 'mint-tea',
      title: 'Le Thé à la Menthe',
      description: 'Le thé à la menthe est bien plus qu\'une simple boisson au Maroc. C\'est un rituel social profondément ancré dans la culture marocaine.',
      image: '/images/culture/mint-tea.jpg',
      content: 'Le thé à la menthe, ou "atay" en darija, est préparé avec du thé vert chinois Gunpowder, de la menthe fraîche et beaucoup de sucre.',
    },
    {
      id: 'hammam',
      title: 'Le Hammam Traditionnel',
      description: 'Le hammam est un bain de vapeur traditionnel, lieu de purification et de socialisation.',
      image: '/images/culture/hammam.jpg',
      content: 'Le hammam est un rituel hebdomadaire pour de nombreux Marocains. C\'est un espace de détente, de purification et de rencontre sociale.',
    },
  ],
  festivals: [
    {
      id: 'moussem',
      title: 'Les Moussems',
      description: 'Les moussems sont des festivals religieux et culturels qui rassemblent les communautés locales.',
      image: '/images/culture/moussem.jpg',
      dates: 'Toute l\'année selon les régions',
      content: 'Les moussems sont des célébrations annuelles en l\'honneur d\'un saint local. Ils combinent dévotion religieuse, foires commerciales et spectacles.',
    },
  ],
  crafts: [
    {
      id: 'zellige',
      title: 'Le Zellige',
      description: 'Art millénaire de la mosaïque marocaine, le zellige orne les palais et mosquées.',
      image: '/images/culture/zellige.jpg',
      content: 'Le zellige est une mosaïque de céramique émaillée, découpée à la main en formes géométriques. Cet art remonte au 10ème siècle.',
    },
  ],
  cuisine: [
    {
      id: 'tagine',
      title: 'Le Tajine',
      description: 'Le tajine est le plat emblématique du Maroc, cuit lentement dans un plat en terre cuite.',
      image: '/images/culture/tagine.jpg',
      content: 'Le tajine est à la fois un plat et un ustensile de cuisson. Il permet une cuisson lente qui préserve les saveurs.',
    },
  ],
  music: [
    {
      id: 'gnawa',
      title: 'Musique Gnawa',
      description: 'Musique spirituelle et rythmée originaire d\'Afrique subsaharienne, très populaire au Maroc.',
      image: '/images/culture/gnawa.jpg',
      content: 'La musique gnawa combine rythmes percussifs, chants spirituels et danse. Elle est jouée lors de cérémonies de guérison.',
    },
  ],
  regions: [
    {
      id: 'atlas',
      title: 'Le Haut Atlas',
      description: 'Chaîne de montagnes majestueuse, berceau de la culture berbère.',
      image: '/images/culture/atlas.jpg',
      content: 'Le Haut Atlas abrite des communautés berbères qui ont préservé leurs traditions millénaires.',
    },
  ],
};

const authenticityTags = [
  { id: 'local', label: 'Expérience Locale', icon: '🏘️', description: 'Animé par des locaux authentiques' },
  { id: 'traditional', label: 'Traditionnel', icon: '🕌', description: 'Respect des traditions marocaines' },
  { id: 'artisanal', label: 'Artisanal', icon: '🎨', description: 'Savoir-faire artisanal préservé' },
  { id: 'cultural', label: 'Culturel', icon: '📚', description: 'Immersion culturelle profonde' },
  { id: 'authentic', label: 'Authentique', icon: '⭐', description: 'Expérience 100% authentique' },
];

const CulturePage = () => {
  const [activeSection, setActiveSection] = useState('traditions');

  const sections = [
    { id: 'traditions', label: 'Traditions', icon: BookOpen, data: moroccanCultureData.traditions },
    { id: 'festivals', label: 'Fêtes & Festivals', icon: Calendar, data: moroccanCultureData.festivals },
    { id: 'crafts', label: 'Artisanat', icon: Palette, data: moroccanCultureData.crafts },
    { id: 'cuisine', label: 'Cuisine', icon: Utensils, data: moroccanCultureData.cuisine },
    { id: 'music', label: 'Musique', icon: Music, data: moroccanCultureData.music },
    { id: 'regions', label: 'Régions', icon: MapPin, data: moroccanCultureData.regions },
  ];

  const activeData = sections.find(s => s.id === activeSection)?.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Découvrir le Maroc</h1>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto">
            Plongez dans la richesse culturelle et les traditions authentiques du Maroc
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Authenticity Tags */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles size={24} className="text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">Tags d'Authenticité</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {authenticityTags.map((tag) => (
              <div
                key={tag.id}
                className="bg-white rounded-xl p-4 border border-gray-200 hover:border-primary-300 hover:shadow-md transition text-center"
              >
                <div className="text-3xl mb-2">{tag.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{tag.label}</h3>
                <p className="text-xs text-gray-600">{tag.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-2 border-b border-gray-200">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 px-6 py-3 font-semibold transition whitespace-nowrap ${
                    activeSection === section.id
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon size={20} />
                  {section.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeData.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition"
            >
              <div className="h-48 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-white text-4xl">🏛️</div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 mb-4">{item.description}</p>
                {item.dates && (
                  <p className="text-sm text-primary-600 font-semibold mb-3">
                    📅 {item.dates}
                  </p>
                )}
                <p className="text-sm text-gray-700 leading-relaxed">{item.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-12 bg-primary-50 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Vivez l'Authenticité Marocaine
          </h2>
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
            Découvrez nos expériences authentiques et immersives qui vous plongent au cœur 
            de la culture marocaine traditionnelle.
          </p>
          <a
            href="/search?authentic=true"
            className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-primary-700 transition"
          >
            Explorer les Expériences Authentiques
          </a>
        </div>
      </div>

      <ScrollToTopButton />
    </div>
  );
};

export default CulturePage;

