import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup basic environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import Models
import Product from '../backend/models/productModel.js';
import Operator from '../backend/models/operatorModel.js';
import User from '../backend/models/userModel.js';
import Schedule from '../backend/models/scheduleModel.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/overglow';

const moroccoRegions = [
  'Tanger-Tétouan-Al Hoceïma',
  'L\'Oriental',
  'Fès-Meknès',
  'Rabat-Salé-Kénitra',
  'Béni Mellal-Khénifra',
  'Casablanca-Settat',
  'Marrakech-Safi',
  'Drâa-Tafilalet',
  'Souss-Massa',
  'Guelmim-Oued Noun',
  'Laâyoune-Sakia El Hamra',
  'Dakhla-Oued Ed-Dahab',
];

const internationalCatalog = [
  // USA
  { title: 'Séjour Midtown Manhattan', city: 'New York', country: 'USA', price: 850, category: 'Séjours', duration: '3 Jours' },
  { title: 'Tour VIP Hollywood & Beverly Hills', city: 'Los Angeles', country: 'USA', price: 250, category: 'Visites', duration: '4 Heures' },
  { title: 'Pass Accès Total Parcs Divertissement', city: 'Orlando', country: 'USA', price: 450, category: 'Activités', duration: '1 Jour' },
  
  // Inde
  { title: 'Retraite de Luxe au Taj Mahal Palace', city: 'Mumbai', country: 'Inde', price: 600, category: 'Séjours', duration: '2 Nuits' },
  { title: 'Découverte Culturelle et Gastronomique', city: 'New Delhi', country: 'Inde', price: 120, category: 'Visites', duration: '6 Heures' },
  { title: 'Visite Privée du Taj Mahal au Lever du Soleil', city: 'Agra', country: 'Inde', price: 180, category: 'Visites', duration: '5 Heures' },

  // Chine
  { title: 'Expérience Futuriste au Sommet de Shanghai', city: 'Shanghai', country: 'Chine', price: 150, category: 'Activités', duration: '3 Heures' },
  { title: 'Exploration VIP de la Cité Interdite', city: 'Pékin', country: 'Chine', price: 190, category: 'Visites', duration: 'Demi-journée' },
  { title: 'Croisière Victoria Harbour & Shopping Premium', city: 'Hong Kong', country: 'Chine', price: 320, category: 'Croisières', duration: '1 Jour' },

  // Angleterre
  { title: 'Visite Royale : Tour de Londres & Palais', city: 'Londres', country: 'Angleterre', price: 210, category: 'Visites', duration: '1 Jour' },
  { title: 'Immersion Footballistique & Culturelle', city: 'Manchester', country: 'Angleterre', price: 180, category: 'Activités', duration: '6 Heures' },
  { title: 'Détente aux Thermes Historiques', city: 'Bath', country: 'Angleterre', price: 140, category: 'Bien-être', duration: '4 Heures' },

  // France
  { title: 'Croisière Dîner sur la Seine & Tour Eiffel', city: 'Paris', country: 'France', price: 280, category: 'Croisières', duration: 'Soirée' },
  { title: 'Évasion Azuréenne en Yacht Privé', city: 'Nice', country: 'France', price: 950, category: 'Activités', duration: '1 Jour' },
  { title: 'Ascension VIP du Mont-Blanc en Téléphérique', city: 'Chamonix', country: 'France', price: 160, category: 'Visites', duration: 'Demi-journée' },

  // Espagne
  { title: 'Immersion Artistique au Musée du Prado', city: 'Madrid', country: 'Espagne', price: 90, category: 'Visites', duration: '3 Heures' },
  { title: 'Chef-d\'œuvre de Gaudí : Sagrada Família & Parc', city: 'Barcelone', country: 'Espagne', price: 140, category: 'Visites', duration: '5 Heures' },
  { title: 'Croisière Coucher de Soleil & Divertissement', city: 'Ibiza', country: 'Espagne', price: 200, category: 'Croisières', duration: 'Soirée' },

  // Italie
  { title: 'Voyage dans le Temps : Colisée & Vatican', city: 'Rome', country: 'Italie', price: 220, category: 'Visites', duration: '1 Jour' },
  { title: 'Balade Romantique en Gondole Privée', city: 'Venise', country: 'Italie', price: 150, category: 'Activités', duration: '2 Heures' },
  { title: 'Art & Renaissance : Galerie des Offices', city: 'Florence', country: 'Italie', price: 130, category: 'Visites', duration: '4 Heures' },
];

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

const seedCatalog = async () => {
  await connectDB();

  try {
    console.log('🔄 Cleaning old demo data if necessary (optional)...');
    // Decide if we should clear all products. For safety, we just append here.

    console.log('👤 Finding or creating Official Operator...');
    let adminUser = await User.findOne({ role: 'Admin' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Admin Overglow',
        email: 'admin@overglow.com',
        password: 'password123', // should be hashed in real app
        role: 'Admin',
        isApproved: true
      });
      console.log('  -> Admin User created.');
    }

    let officialOperator = await Operator.findOne({ companyName: 'Overglow Official' });
    if (!officialOperator) {
      officialOperator = await Operator.create({
        user: adminUser._id,
        companyName: 'Overglow Official',
        publicName: 'Overglow Official',
        providerType: 'company',
        description: 'Compte opérateur officiel pour le catalogue de lancement.',
        status: 'Active',
        metrics: {
          isVerified: true
        }
      });
      console.log('  -> Official Operator created.');
    }

    console.log('🌍 Seeding Morocco Regions as base products...');
    const moroccoProducts = moroccoRegions.map((region) => ({
      operator: officialOperator._id,
      title: `Découverte Authentique - ${region}`,
      slug: `decouverte-authentique-${region.toLowerCase().replace(/[' -]+/g, '-')}`,
      description: `Explorez les merveilles de la région ${region}. Une expérience inoubliable optimisée pour le SEO et l'attractivité touristique.`,
      category: 'Tours Régionaux',
      city: region,
      address: 'Centre-ville',
      duration: 'Flexible',
      price: 250,
      images: ['https://images.unsplash.com/photo-1539020140153-e479b8c22e70?q=80&w=800&auto=format&fit=crop'],
      status: 'Published',
      metrics: {
        viewCount: Math.floor(Math.random() * 500),
        bookingCount: Math.floor(Math.random() * 50),
        averageRating: 4.8,
        reviewCount: Math.floor(Math.random() * 20),
        isPopular: true,
      }
    }));

    await Product.insertMany(moroccoProducts);
    console.log(`  -> Inserted ${moroccoProducts.length} Morocco regions.`);

    console.log('✈️ Seeding International Catalog...');
    const internationalProducts = internationalCatalog.map((item) => ({
      operator: officialOperator._id,
      title: item.title,
      slug: `${item.title.toLowerCase().replace(/[' -]+/g, '-')}-${item.city.toLowerCase()}`,
      description: `Profitez d'une expérience premium à ${item.city}, ${item.country}. ${item.title} offre des moments inoubliables et exclusifs.`,
      category: item.category,
      city: item.city,
      address: `Lieu central, ${item.city}, ${item.country}`,
      duration: item.duration,
      price: item.price,
      images: ['https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800&auto=format&fit=crop'],
      status: 'Published',
      metrics: {
        viewCount: Math.floor(Math.random() * 1000),
        bookingCount: Math.floor(Math.random() * 100),
        averageRating: 4.9,
        reviewCount: Math.floor(Math.random() * 40),
        isPopular: true,
      }
    }));

    await Product.insertMany(internationalProducts);
    console.log(`  -> Inserted ${internationalProducts.length} International products.`);

    // Create default schedules for these products to allow checkout
    console.log('📅 Creating default schedules for all new products...');
    const allProducts = await Product.find({ operator: officialOperator._id });
    
    // Tomorrow at 10 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const schedules = allProducts.map(product => ({
      product: product._id,
      operator: officialOperator._id,
      date: tomorrow,
      time: '10:00',
      endTime: '18:00',
      capacity: 50,
      bookedCount: 0,
      price: product.price,
      currency: 'EUR',
      status: 'Available'
    }));

    await Schedule.insertMany(schedules);
    console.log(`  -> Created ${schedules.length} schedules.`);

    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedCatalog();
