import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../config/axios';
import ProductCard from '../components/ProductCard';
import DestinationGuide from '../components/DestinationGuide';
import { MapPin, Star, Filter, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

const DestinationPage = () => {
  const { city } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showGuide, setShowGuide] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams();
        params.append('city', city);
        if (selectedCategory) {
          params.append('category', selectedCategory);
        }
        params.append('limit', '20');

        const { data } = await api.get(`/api/search/advanced?${params.toString()}`);
        setProducts(Array.isArray(data.products) ? data.products : []);
        
        // Get unique categories from products
        const uniqueCategories = [...new Set(data.products?.map(p => p.category).filter(Boolean) || [])];
        setCategories(uniqueCategories);
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to load products:', error);
        setProducts([]);
        setLoading(false);
      }
    };

    fetchData();
  }, [city, selectedCategory]);

  const cityInfo = {
    'Marrakech': {
      name: 'Marrakech',
      description: 'Découvrez la perle du Sud marocain avec ses souks animés, ses palais historiques et ses expériences authentiques.',
      fullDescription: 'Marrakech, surnommée la "Ville Rouge" en raison de ses murs en terre cuite, est l\'une des destinations les plus emblématiques du Maroc. Fondée en 1062, cette ville impériale allie histoire millénaire et modernité. La place Jemaa el-Fnaa, classée au patrimoine mondial de l\'UNESCO, s\'anime chaque soir avec ses conteurs, charmeurs de serpents et vendeurs de jus d\'orange. Les souks labyrinthiques offrent une expérience sensorielle unique où vous pourrez négocier des tapis berbères, des épices colorées et des objets artisanaux.',
      highlights: ['Place Jemaa el-Fnaa', 'Palais Bahia', 'Jardin Majorelle', 'Souks traditionnels', 'Médina historique', 'Tombeaux Saadiens'],
      image: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=1200',
      guide: {
        practicalInfo: {
          bestTime: 'Mars à mai et septembre à novembre (températures agréables)',
          duration: '3-4 jours minimum',
          budget: 'Budget moyen : 50-100€/jour',
          language: 'Arabe, français, anglais',
          currency: 'Dirham marocain (MAD)',
          climate: 'Climat désertique chaud, hivers doux',
        },
        tips: [
          'Négociez toujours dans les souks - commencez à 50% du prix demandé',
          'Portez des vêtements couvrants pour visiter les mosquées',
          'Évitez de boire l\'eau du robinet, préférez l\'eau en bouteille',
          'Apprenez quelques mots d\'arabe : "Shukran" (merci), "Salam" (bonjour)',
          'Soyez respectueux lors de la prise de photos des personnes',
          'Profitez des hammams traditionnels pour une expérience authentique',
        ],
        gettingAround: [
          { method: 'À pied', description: 'La médina se découvre parfaitement à pied. Prévoyez de bonnes chaussures.' },
          { method: 'Calèche', description: 'Moyen traditionnel et romantique pour visiter la ville (négociez le prix avant).' },
          { method: 'Taxi', description: 'Petits taxis (rouges) pour la ville, grands taxis pour les excursions.' },
          { method: 'Location de vélo', description: 'Idéal pour explorer les jardins et les quartiers modernes.' },
        ],
        culture: {
          description: 'Marrakech est un véritable creuset culturel où se mêlent traditions berbères, arabes et andalouses. La ville abrite de nombreux festivals tout au long de l\'année, notamment le Festival des Arts Populaires de Marrakech.',
          traditions: [
            'Cérémonie du thé à la menthe (rituel d\'hospitalité)',
            'Artisanat traditionnel (tapis, poterie, cuir)',
            'Musique gnawa et berbère',
            'Cuisine de rue sur la place Jemaa el-Fnaa',
          ],
        },
        food: {
          description: 'La gastronomie marrakchie est réputée pour ses saveurs épicées et ses plats traditionnels. Ne manquez pas le tajine, le couscous et les pâtisseries orientales.',
          specialties: ['Tajine', 'Couscous', 'Pastilla', 'Harira', 'Thé à la menthe', 'Pâtisseries orientales'],
        },
        safety: {
          general: 'Marrakech est généralement une ville sûre pour les touristes. Restez vigilant dans les souks et évitez les zones isolées la nuit.',
          tips: [
            'Gardez vos objets de valeur en sécurité',
            'Soyez prudent avec les pickpockets dans les souks',
            'Évitez les guides non officiels',
            'Respectez les coutumes locales',
          ],
        },
      },
    },
    'Casablanca': {
      name: 'Casablanca',
      description: 'Explorez la capitale économique du Maroc, mélange de modernité et de tradition.',
      fullDescription: 'Casablanca est la plus grande ville du Maroc et son principal centre économique. Contrairement aux autres villes impériales, Casablanca offre une expérience plus moderne avec ses buildings, ses plages et sa vie nocturne animée. La mosquée Hassan II, l\'une des plus grandes au monde, domine le front de mer avec son minaret de 210 mètres.',
      highlights: ['Mosquée Hassan II', 'Corniche', 'Médina', 'Art déco', 'Place Mohammed V', 'Mahkama du Pacha'],
      image: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1200',
      guide: {
        practicalInfo: {
          bestTime: 'Toute l\'année (climat océanique tempéré)',
          duration: '2-3 jours',
          budget: 'Budget moyen : 60-120€/jour',
          language: 'Arabe, français',
          currency: 'Dirham marocain (MAD)',
          climate: 'Climat océanique tempéré',
        },
        tips: [
          'Visitez la mosquée Hassan II tôt le matin pour éviter les foules',
          'Explorez le quartier Art déco pour l\'architecture',
          'Profitez des plages de la Corniche',
          'Goûtez aux fruits de mer frais',
        ],
        gettingAround: [
          { method: 'Tramway', description: 'Réseau moderne et efficace pour traverser la ville.' },
          { method: 'Taxi', description: 'Nombreux et abordables, utilisez les compteurs.' },
          { method: 'Location de voiture', description: 'Pratique pour explorer les environs.' },
        ],
        culture: {
          description: 'Casablanca est une ville cosmopolite où se côtoient modernité et tradition. L\'architecture Art déco du centre-ville témoigne de son passé colonial.',
          traditions: [
            'Vie nocturne animée',
            'Culture du cinéma (inspiration du film Casablanca)',
            'Art contemporain et galeries',
          ],
        },
        food: {
          description: 'Casablanca est réputée pour ses fruits de mer frais et sa cuisine moderne. Les restaurants offrent une grande variété de spécialités internationales.',
          specialties: ['Fruits de mer', 'Couscous', 'Tajine', 'Pâtisseries françaises'],
        },
        safety: {
          general: 'Casablanca est une ville moderne et sûre. Restez vigilant dans les zones touristiques.',
          tips: [
            'Évitez les quartiers isolés la nuit',
            'Gardez vos affaires en sécurité',
            'Utilisez les transports officiels',
          ],
        },
      },
    },
    'Fès': {
      name: 'Fès',
      description: 'Plongez dans l\'histoire millénaire de la capitale spirituelle du Maroc.',
      fullDescription: 'Fès est la plus ancienne des villes impériales et la capitale spirituelle du Maroc. Sa médina, classée au patrimoine mondial de l\'UNESCO, est un dédale de 9 000 ruelles où le temps semble s\'être arrêté. Les tanneries traditionnelles, l\'université Al Quaraouiyine (la plus ancienne au monde) et les médersas ornées font de Fès un véritable musée à ciel ouvert.',
      highlights: ['Médina de Fès', 'Tanneries', 'Université Al Quaraouiyine', 'Palais Royal', 'Médersa Bou Inania', 'Mausolée de Moulay Idriss'],
      image: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1200',
      guide: {
        practicalInfo: {
          bestTime: 'Avril à juin et septembre à novembre',
          duration: '2-3 jours',
          budget: 'Budget moyen : 40-80€/jour',
          language: 'Arabe, français',
          currency: 'Dirham marocain (MAD)',
          climate: 'Climat continental, étés chauds, hivers frais',
        },
        tips: [
          'Engagez un guide officiel pour la médina (facile de se perdre)',
          'Visitez les tanneries tôt le matin (odeur moins forte)',
          'Portez des chaussures confortables pour les ruelles pavées',
          'Respectez les lieux de culte',
          'Négociez les prix dans les souks',
        ],
        gettingAround: [
          { method: 'À pied', description: 'La médina se visite uniquement à pied. Prévoyez une carte ou un guide.' },
          { method: 'Taxi', description: 'Pour rejoindre la médina depuis la ville nouvelle.' },
        ],
        culture: {
          description: 'Fès est le cœur spirituel et intellectuel du Maroc. La ville abrite la plus ancienne université du monde et est un centre majeur de l\'artisanat traditionnel.',
          traditions: [
            'Artisanat traditionnel (cuir, céramique, métal)',
            'Musique andalouse',
            'Calligraphie arabe',
            'Cérémonies religieuses',
          ],
        },
        food: {
          description: 'La cuisine fassie est réputée pour sa sophistication. Ne manquez pas les spécialités locales dans les restaurants traditionnels de la médina.',
          specialties: ['Pastilla', 'Méchoui', 'Tajine aux pruneaux', 'Couscous fassi'],
        },
        safety: {
          general: 'Fès est une ville sûre. Restez vigilant dans la médina et évitez les guides non officiels.',
          tips: [
            'Ne suivez pas les guides non officiels',
            'Gardez vos affaires près de vous dans la médina',
            'Respectez les coutumes locales',
          ],
        },
      },
    },
    'Rabat': {
      name: 'Rabat',
      description: 'Visitez la capitale administrative avec ses monuments historiques et sa modernité.',
      fullDescription: 'Rabat, capitale administrative du Maroc, allie harmonieusement histoire et modernité. La ville offre une atmosphère plus calme que les autres grandes villes marocaines, avec ses larges boulevards, ses jardins et ses monuments historiques bien préservés.',
      highlights: ['Kasbah des Oudayas', 'Tour Hassan', 'Chellah', 'Médina', 'Palais Royal', 'Musée Mohammed VI'],
      image: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1200',
      guide: {
        practicalInfo: {
          bestTime: 'Toute l\'année',
          duration: '1-2 jours',
          budget: 'Budget moyen : 50-100€/jour',
          language: 'Arabe, français',
          currency: 'Dirham marocain (MAD)',
          climate: 'Climat océanique tempéré',
        },
        tips: [
          'Visitez la Kasbah des Oudayas au coucher du soleil',
          'Explorez le Chellah (ruines romaines)',
          'Profitez de la plage de Rabat',
          'Visitez le musée Mohammed VI d\'art moderne',
        ],
        gettingAround: [
          { method: 'Tramway', description: 'Réseau moderne pour traverser la ville.' },
          { method: 'À pied', description: 'Centre-ville compact et agréable à pied.' },
          { method: 'Taxi', description: 'Nombreux et abordables.' },
        ],
        culture: {
          description: 'Rabat est une ville culturelle avec de nombreux musées, festivals et événements artistiques.',
          traditions: [
            'Festival Mawazine (musique)',
            'Art contemporain',
            'Architecture moderne',
          ],
        },
        food: {
          description: 'Rabat offre une cuisine variée avec de nombreux restaurants modernes et traditionnels.',
          specialties: ['Poisson frais', 'Couscous', 'Tajine', 'Pâtisseries'],
        },
        safety: {
          general: 'Rabat est une ville très sûre avec une atmosphère détendue.',
          tips: [
            'Ville très sûre, même la nuit',
            'Respectez les zones gouvernementales',
          ],
        },
      },
    },
    'Tanger': {
      name: 'Tanger',
      description: 'Découvrez la porte de l\'Afrique avec ses influences méditerranéennes.',
      fullDescription: 'Tanger, située à la pointe nord du Maroc, est une ville chargée d\'histoire où se rencontrent l\'Atlantique et la Méditerranée. La ville a longtemps été une zone internationale, attirant artistes et écrivains du monde entier. Aujourd\'hui, Tanger connaît un renouveau avec de nouveaux projets culturels et touristiques.',
      highlights: ['Kasbah', 'Grottes d\'Hercule', 'Cap Spartel', 'Médina', 'Musée de la Kasbah', 'Plage de Tanger'],
      image: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1200',
      guide: {
        practicalInfo: {
          bestTime: 'Avril à octobre',
          duration: '2-3 jours',
          budget: 'Budget moyen : 50-100€/jour',
          language: 'Arabe, français, espagnol',
          currency: 'Dirham marocain (MAD)',
          climate: 'Climat méditerranéen',
        },
        tips: [
          'Visitez les Grottes d\'Hercule au coucher du soleil',
          'Explorez la Kasbah pour les vues panoramiques',
          'Profitez des plages de la région',
          'Goûtez aux spécialités de poisson',
        ],
        gettingAround: [
          { method: 'À pied', description: 'Centre-ville compact, facile à explorer à pied.' },
          { method: 'Taxi', description: 'Pour les excursions vers Cap Spartel et les grottes.' },
        ],
        culture: {
          description: 'Tanger a une riche histoire culturelle, ayant accueilli de nombreux artistes et écrivains célèbres.',
          traditions: [
            'Musique gnawa',
            'Art contemporain',
            'Festival Tanjazz',
          ],
        },
        food: {
          description: 'Tanger est réputée pour ses fruits de mer frais et sa cuisine méditerranéenne.',
          specialties: ['Fruits de mer', 'Poisson grillé', 'Couscous', 'Tajine'],
        },
        safety: {
          general: 'Tanger est une ville sûre. Restez vigilant dans la médina.',
          tips: [
            'Évitez les guides non officiels',
            'Négociez les prix avant les excursions',
          ],
        },
      },
    },
    'Agadir': {
      name: 'Agadir',
      description: 'Profitez du soleil et des plages de la station balnéaire du Sud.',
      fullDescription: 'Agadir est la principale station balnéaire du Maroc, réputée pour ses plages de sable fin, son climat ensoleillé toute l\'année et ses infrastructures touristiques modernes. Reconstruite après le séisme de 1960, Agadir offre une expérience de vacances détendue avec ses hôtels, ses restaurants et ses activités nautiques.',
      highlights: ['Plage d\'Agadir', 'Kasbah', 'Vallée du Paradis', 'Souk El Had', 'Marina', 'Musée du Patrimoine Amazigh'],
      image: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1200',
      guide: {
        practicalInfo: {
          bestTime: 'Toute l\'année (300 jours de soleil)',
          duration: '3-7 jours',
          budget: 'Budget moyen : 60-150€/jour',
          language: 'Arabe, français, anglais',
          currency: 'Dirham marocain (MAD)',
          climate: 'Climat désertique chaud, ensoleillé toute l\'année',
        },
        tips: [
          'Profitez des plages (équipements disponibles)',
          'Explorez la vallée du Paradis pour la randonnée',
          'Visitez le souk El Had le dimanche',
          'Essayez le surf ou le kitesurf',
          'Protégez-vous du soleil',
        ],
        gettingAround: [
          { method: 'Taxi', description: 'Nombreux et abordables pour se déplacer en ville.' },
          { method: 'Location de voiture', description: 'Idéal pour explorer les environs (vallée du Paradis, Taghazout).' },
          { method: 'À pied', description: 'Le front de mer est agréable à parcourir à pied.' },
        ],
        culture: {
          description: 'Agadir est une ville moderne avec une forte identité berbère. Le musée du Patrimoine Amazigh présente la culture locale.',
          traditions: [
            'Culture berbère',
            'Festival Timitar (musique)',
            'Artisanat berbère',
          ],
        },
        food: {
          description: 'Agadir offre une cuisine variée avec une forte influence berbère et des spécialités de poisson.',
          specialties: ['Poisson frais', 'Tajine berbère', 'Couscous', 'Amlou (pâte d\'amandes)'],
        },
        safety: {
          general: 'Agadir est une ville très sûre, idéale pour les familles.',
          tips: [
            'Ville très sûre',
            'Attention aux courants sur certaines plages',
            'Protégez-vous du soleil',
          ],
        },
      },
    },
  };

  const info = cityInfo[city] || {
    name: city,
    description: `Découvrez les meilleures expériences et activités à ${city}`,
    highlights: [],
    image: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=1200'
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <Helmet>
        <title>Expériences à {info.name} | Overglow Trip</title>
        <meta name="description" content={info.description} />
        <meta property="og:title" content={`Expériences à ${info.name} | Overglow Trip`} />
        <meta property="og:description" content={info.description} />
        <meta property="og:image" content={info.image} />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : ''} />
      </Helmet>
      {/* Hero Section */}
      <div className="relative h-64 md:h-96 overflow-hidden">
        <img 
          src={info.image} 
          alt={info.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">{info.name}</h1>
          <p className="text-lg md:text-xl">{info.description}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Full Description */}
        {info.fullDescription && (
          <div className="bg-white rounded-xl p-6 mb-8 shadow-sm">
            <p className="text-slate-700 leading-relaxed text-lg">{info.fullDescription}</p>
          </div>
        )}

        {/* Highlights */}
        {info.highlights.length > 0 && (
          <div className="bg-white rounded-xl p-6 mb-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-4">À ne pas manquer</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {info.highlights.map((highlight, idx) => (
                <div key={idx} className="flex items-center text-slate-700">
                  <MapPin size={16} className="text-primary-600 mr-2 flex-shrink-0" />
                  <span className="text-sm">{highlight}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Destination Guide */}
        {info.guide && (
          <div className="mb-8">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="w-full bg-white rounded-xl p-6 shadow-sm flex items-center justify-between hover:bg-slate-50 transition"
            >
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <BookOpen size={24} />
                Guide de voyage complet
              </h2>
              {showGuide ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>
            {showGuide && (
              <div className="mt-4">
                <DestinationGuide city={city} guide={info.guide} />
              </div>
            )}
          </div>
        )}

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={20} />
              <h3 className="font-bold text-lg">Filtrer par catégorie</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  !selectedCategory
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                Toutes
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedCategory === cat
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold">
                {selectedCategory ? `${selectedCategory} à ${info.name}` : `Expériences à ${info.name}`}
              </h2>
              <p className="text-slate-600">{products.length} expérience{products.length > 1 ? 's' : ''} disponible{products.length > 1 ? 's' : ''}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-slate-600 text-lg">Aucune expérience disponible pour le moment.</p>
            <Link to="/search" className="text-primary-600 hover:underline mt-4 inline-block">
              Voir toutes les expériences
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default DestinationPage;

