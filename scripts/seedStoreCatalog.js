/**
 * Seed E2E catalogue for Overglow stores: /explore, /stays, /extras
 *
 * Idempotent upsert by stable slug (e2e-*). Does NOT wipe the DB.
 *
 * Usage:
 *   npm run seed:stores
 *   npm run seed:stores -- --dry-run
 *
 * Operators (password: OverglowE2E2026!):
 *   e2e-tours@overglow.test
 *   e2e-stays@overglow.test
 *   e2e-extras@overglow.test
 *
 * Requires MONGO_URI in .env (same as the app).
 */
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import connectDB from '../config/db.js';
import Product from '../backend/models/productModel.js';
import Schedule from '../backend/models/scheduleModel.js';
import Operator from '../backend/models/operatorModel.js';
import User from '../backend/models/userModel.js';

const DRY_RUN = process.argv.includes('--dry-run');
const E2E_PASSWORD = 'OverglowE2E2026!';

const IMG = {
  medina: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?q=80&w=1200&auto=format&fit=crop',
  desert: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=1200&auto=format&fit=crop',
  surf: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=1200&auto=format&fit=crop',
  food: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1200&auto=format&fit=crop',
  spa: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1200&auto=format&fit=crop',
  villa: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1200&auto=format&fit=crop',
  riad: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop',
  suite: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200&auto=format&fit=crop',
  car: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=1200&auto=format&fit=crop',
  yacht: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?q=80&w=1200&auto=format&fit=crop',
  photo: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1200&auto=format&fit=crop',
  balloon: 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=80&w=1200&auto=format&fit=crop',
};

const GPS = {
  Marrakech: [-7.9811, 31.6295],
  Fès: [-4.9998, 34.0181],
  Essaouira: [-9.77, 31.5085],
  Agadir: [-9.5981, 30.4278],
  Taghazout: [-9.7272, 30.5447],
  Merzouga: [-4.0133, 31.0801],
  Taroudant: [-8.8769, 30.4703],
  Casablanca: [-7.5898, 33.5731],
  Chefchaouen: [-5.2636, 35.1688],
};

const ensureOperator = async ({ email, name, companyName, description }) => {
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name,
      email,
      password: E2E_PASSWORD,
      role: 'Opérateur',
      isApproved: true,
      approvedAt: new Date(),
    });
  } else {
    user.password = E2E_PASSWORD;
    user.role = 'Opérateur';
    user.isApproved = true;
    await user.save();
  }

  let operator = await Operator.findOne({ user: user._id });
  if (!operator) {
    operator = await Operator.create({
      user: user._id,
      companyName,
      description,
      status: 'Active',
      isFormCompleted: true,
      isClaimed: true,
      city: 'Agadir',
    });
  } else {
    operator.status = 'Active';
    operator.companyName = companyName;
    await operator.save();
  }
  return operator;
};

const buildSchedules = (productId, price, days = 21) => {
  const rows = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (let i = 1; i <= days; i += 1) {
    const d = new Date(cursor);
    d.setDate(d.getDate() + i);
    rows.push({
      product: productId,
      date: d,
      time: '10:00',
      endTime: '13:00',
      capacity: 12,
      price,
      currency: 'MAD',
    });
  }
  return rows;
};

const upsertProduct = async (operatorId, payload) => {
  const {
    slug,
    title,
    description,
    category,
    productType,
    city,
    price,
    duration,
    image,
    tags = [],
    highlights = [],
    luxuryStay,
    serviceDetails,
  } = payload;

  const coords = GPS[city] || GPS.Agadir;
  const doc = {
    operator: operatorId,
    title,
    slug,
    description,
    category,
    productType,
    city,
    address: `${city}, Maroc`,
    duration,
    price,
    location: { type: 'Point', coordinates: coords },
    images: [image],
    status: 'Published',
    tags,
    highlights,
    seo: {
      metaTitle: title.slice(0, 70),
      metaDescription: description.slice(0, 160),
      ogTitle: title.slice(0, 70),
      ogDescription: description.slice(0, 200),
      ogImage: image,
    },
  };
  if (luxuryStay) doc.luxuryStay = luxuryStay;
  if (serviceDetails) doc.serviceDetails = serviceDetails;

  if (DRY_RUN) {
    console.log(`[DRY-RUN] ${productType} | ${category} | ${slug}`);
    return { created: true };
  }

  let product = await Product.findOne({ slug });
  if (product) {
    Object.assign(product, doc);
    await product.save();
    await Schedule.deleteMany({ product: product._id });
    await Schedule.insertMany(buildSchedules(product._id, price));
    return { updated: true };
  }

  product = await Product.create(doc);
  await Schedule.insertMany(buildSchedules(product._id, price));
  return { created: true };
};

const TOURS = [
  {
    slug: 'e2e-tour-marrakech-medina',
    title: 'Visite guidée médina de Marrakech',
    category: 'Tours',
    city: 'Marrakech',
    price: 280,
    duration: '3 hours',
    image: IMG.medina,
    tags: ['annulation-gratuite', 'confirmation-immediate', 'bestseller'],
    highlights: ['Guide local FR/EN', 'Souks & places emblématiques', 'Petit groupe'],
    description:
      'Explorez les souks, la place Jemaa el-Fna et les secrets de la médina avec un guide certifié Overglow.',
  },
  {
    slug: 'e2e-tour-fes-artisanat',
    title: 'Tour artisanat & tanneries de Fès',
    category: 'Tours',
    city: 'Fès',
    price: 320,
    duration: '4 hours',
    image: IMG.medina,
    tags: ['annulation-gratuite', 'confirmation-immediate'],
    highlights: ['Tanneries Chouara', 'Ateliers artisans', 'Thé à la menthe'],
    description: 'Immersion dans le savoir-faire fassi : cuir, céramique et médina millénaire.',
  },
  {
    slug: 'e2e-tour-essaouira-day',
    title: 'Journée Essaouira — médina & port',
    category: 'Tours',
    city: 'Essaouira',
    price: 450,
    duration: '8 hours',
    image: IMG.medina,
    tags: ['annulation-gratuite'],
    highlights: ['Ramparts', 'Port de pêche', 'Déjeuner fruits de mer optionnel'],
    description: 'Une journée complète sur la côte atlantique : vent, histoire et gastronomie.',
  },
  {
    slug: 'e2e-attr-agadir-oufella',
    title: 'Agadir Oufella — panoramas & histoire',
    category: 'Attractions',
    city: 'Agadir',
    price: 150,
    duration: '2 hours',
    image: IMG.medina,
    tags: ['confirmation-immediate'],
    highlights: ['Vue baie d’Agadir', 'Kasbah historique', 'Coucher de soleil'],
    description: 'Montez à la kasbah Oufella pour une vue imprenable sur la baie.',
  },
  {
    slug: 'e2e-attr-jardin-secret',
    title: 'Jardin secret & oasis urbaine',
    category: 'Attractions',
    city: 'Marrakech',
    price: 120,
    duration: '1.5 hours',
    image: IMG.spa,
    tags: ['annulation-gratuite'],
    highlights: ['Jardins luxuriants', 'Architecture', 'Accès prioritaire'],
    description: 'Visite commentée d’un jardin d’exception au cœur de Marrakech.',
  },
  {
    slug: 'e2e-attr-kasbah-taroudant',
    title: 'Remparts & kasbah de Taroudant',
    category: 'Attractions',
    city: 'Taroudant',
    price: 180,
    duration: '2.5 hours',
    image: IMG.medina,
    tags: ['annulation-gratuite'],
    highlights: ['Remparts roses', 'Souk local', 'Guide francophone'],
    description: 'Découvrez la « petite Marrakech » et ses remparts intactes.',
  },
  {
    slug: 'e2e-act-surf-taghazout',
    title: 'Cours de surf à Taghazout',
    category: 'Activities',
    city: 'Taghazout',
    price: 350,
    duration: '2 hours',
    image: IMG.surf,
    tags: ['confirmation-immediate', 'bestseller'],
    highlights: ['Planche incluse', 'Moniteur certifié', 'Combinaison'],
    description: 'Session surf adaptée à votre niveau sur les spots mythiques de Taghazout.',
  },
  {
    slug: 'e2e-act-quad-dunes',
    title: 'Quad dans les dunes — Agadir',
    category: 'Activities',
    city: 'Agadir',
    price: 400,
    duration: '2 hours',
    image: IMG.desert,
    tags: ['annulation-gratuite', 'confirmation-immediate'],
    highlights: ['Quad 250cc', 'Équipement fourni', 'Pause thé'],
    description: 'Balade en quad entre dunes et villages amazighs aux portes d’Agadir.',
  },
  {
    slug: 'e2e-act-montgolfiere',
    title: 'Survol en montgolfière — Atlas',
    category: 'Activities',
    city: 'Marrakech',
    price: 2200,
    duration: '4 hours',
    image: IMG.balloon,
    tags: ['confirmation-immediate', 'bestseller'],
    highlights: ['Vol lever du soleil', 'Certificat', 'Petit-déjeuner'],
    description: 'Volez au-dessus des villages berbères au lever du soleil.',
  },
  {
    slug: 'e2e-out-atlas-hike',
    title: 'Randonnée Atlas & villages berbères',
    category: 'Outdoor Activities',
    city: 'Marrakech',
    price: 380,
    duration: '6 hours',
    image: IMG.desert,
    tags: ['annulation-gratuite'],
    highlights: ['Guide de montagne', 'Déjeuner chez l’habitant', 'Transfert inclus'],
    description: 'Journée randonnée dans le Haut Atlas avec immersion villageoise.',
  },
  {
    slug: 'e2e-out-paradise-valley',
    title: 'Excursion Paradise Valley',
    category: 'Outdoor Activities',
    city: 'Agadir',
    price: 420,
    duration: '7 hours',
    image: IMG.spa,
    tags: ['annulation-gratuite', 'bestseller'],
    highlights: ['Cascades', 'Baignade', 'Thé berbère'],
    description: 'Oasis et piscines naturelles au nord d’Agadir — classique incontournable.',
  },
  {
    slug: 'e2e-out-merzouga-desert',
    title: 'Désert Merzouga — dunes & coucher de soleil',
    category: 'Outdoor Activities',
    city: 'Merzouga',
    price: 890,
    duration: '1 day',
    image: IMG.desert,
    tags: ['confirmation-immediate'],
    highlights: ['Dromadaire', 'Erg Chebbi', 'Thé sous tente'],
    description: 'Expérience désert authentique sur les dunes d’Erg Chebbi.',
  },
  {
    slug: 'e2e-food-cooking',
    title: 'Cours de cuisine marocaine',
    category: 'Food & Drink',
    city: 'Marrakech',
    price: 480,
    duration: '3 hours',
    image: IMG.food,
    tags: ['annulation-gratuite', 'confirmation-immediate'],
    highlights: ['Marché + atelier', 'Recettes à emporter', 'Déjeuner inclus'],
    description: 'Apprenez tajine et salades à partir d’ingrédients du marché local.',
  },
  {
    slug: 'e2e-food-street',
    title: 'Street food tour médina',
    category: 'Food & Drink',
    city: 'Fès',
    price: 260,
    duration: '2.5 hours',
    image: IMG.food,
    tags: ['bestseller'],
    highlights: ['6 dégustations', 'Guide foodie', 'Options végétariennes'],
    description: 'Parcours gourmand dans les ruelles : brochettes, pâtisseries, jus frais.',
  },
  {
    slug: 'e2e-food-tea',
    title: 'Parcours thés & pâtisseries fines',
    category: 'Food & Drink',
    city: 'Agadir',
    price: 190,
    duration: '2 hours',
    image: IMG.food,
    tags: ['annulation-gratuite'],
    highlights: ['Thé à la menthe', 'Pâtisseries', 'Rooftop'],
    description: 'Dégustation douce autour du rituel du thé marocain.',
  },
  {
    slug: 'e2e-show-caidal',
    title: 'Dîner spectacle sous tente caïdale',
    category: 'Shows & Performances',
    city: 'Agadir',
    price: 650,
    duration: '3 hours',
    image: IMG.spa,
    tags: ['confirmation-immediate', 'bestseller'],
    highlights: ['Buffet', 'Danse & musique', 'Transfert optionnel'],
    description: 'Soirée immersive avec musique live et cuisine traditionnelle.',
  },
  {
    slug: 'e2e-show-gnawa',
    title: 'Soirée musique Gnawa — Essaouira',
    category: 'Shows & Performances',
    city: 'Essaouira',
    price: 220,
    duration: '2 hours',
    image: IMG.medina,
    tags: ['annulation-gratuite'],
    highlights: ['Musiciens locaux', 'Ambiance médina', 'Boisson offerte'],
    description: 'Concert intimiste de musique Gnawa dans un riad culturel.',
  },
  {
    slug: 'e2e-day-ourika',
    title: 'Day trip vallée de l’Ourika',
    category: 'Day Trips',
    city: 'Marrakech',
    price: 390,
    duration: '8 hours',
    image: IMG.desert,
    tags: ['annulation-gratuite', 'confirmation-immediate'],
    highlights: ['Cascades', 'Déjeuner', 'A/R Marrakech'],
    description: 'Échappée montagnarde à une heure de Marrakech.',
  },
  {
    slug: 'e2e-day-ouzoud',
    title: 'Day trip cascades d’Ouzoud',
    category: 'Day Trips',
    city: 'Marrakech',
    price: 480,
    duration: '10 hours',
    image: IMG.spa,
    tags: ['bestseller'],
    highlights: ['Cascades 110 m', 'Guide', 'Pause photo'],
    description: 'Les plus hautes cascades du Maroc en excursion journée.',
  },
  {
    slug: 'e2e-day-taroudant',
    title: 'Day trip Taroudant & oasis Tiout',
    category: 'Day Trips',
    city: 'Agadir',
    price: 520,
    duration: '9 hours',
    image: IMG.medina,
    tags: ['annulation-gratuite'],
    highlights: ['Remparts', 'Oasis', 'Déjeuner'],
    description: 'Culture et nature entre Taroudant et l’oasis de Tiout.',
  },
];

const STAYS = [
  {
    slug: 'e2e-stay-villa-taghazout',
    title: 'Villa océan avec piscine — Taghazout',
    city: 'Taghazout',
    price: 3200,
    propertyType: 'villa',
    amenities: { pool: true, wifi: true, garden: true, jacuzzi: false },
    standing: 3,
    rooms: 4,
    capacity: 8,
    image: IMG.villa,
  },
  {
    slug: 'e2e-stay-villa-agadir',
    title: 'Villa prestige Marina — Agadir',
    city: 'Agadir',
    price: 2800,
    propertyType: 'villa',
    amenities: { pool: true, wifi: true, garden: true, jacuzzi: true },
    standing: 3,
    rooms: 3,
    capacity: 6,
    image: IMG.villa,
  },
  {
    slug: 'e2e-stay-villa-essaouira',
    title: 'Villa Atlantique — Essaouira',
    city: 'Essaouira',
    price: 2500,
    propertyType: 'villa',
    amenities: { pool: true, wifi: true, garden: false, jacuzzi: false },
    standing: 2,
    rooms: 3,
    capacity: 6,
    image: IMG.villa,
  },
  {
    slug: 'e2e-stay-riad-marrakech',
    title: 'Riad luxe patio & hammam — Marrakech',
    city: 'Marrakech',
    price: 2100,
    propertyType: 'riad',
    amenities: { pool: false, wifi: true, garden: false, jacuzzi: true },
    standing: 3,
    rooms: 5,
    capacity: 10,
    image: IMG.riad,
  },
  {
    slug: 'e2e-stay-riad-taroudant',
    title: 'Riad remparts — Taroudant',
    city: 'Taroudant',
    price: 1600,
    propertyType: 'riad',
    amenities: { pool: true, wifi: true, garden: true, jacuzzi: false },
    standing: 2,
    rooms: 4,
    capacity: 8,
    image: IMG.riad,
  },
  {
    slug: 'e2e-stay-riad-fes',
    title: 'Riad médina — Fès',
    city: 'Fès',
    price: 1800,
    propertyType: 'riad',
    amenities: { pool: false, wifi: true, garden: false, jacuzzi: true },
    standing: 2,
    rooms: 3,
    capacity: 6,
    image: IMG.riad,
  },
  {
    slug: 'e2e-stay-apt-agadir',
    title: 'Appartement vue océan — Agadir',
    city: 'Agadir',
    price: 1100,
    propertyType: 'apartment',
    amenities: { pool: true, wifi: true, garden: false, jacuzzi: false },
    standing: 2,
    rooms: 2,
    capacity: 4,
    image: IMG.suite,
  },
  {
    slug: 'e2e-stay-apt-taghazout',
    title: 'Duplex standing — Taghazout',
    city: 'Taghazout',
    price: 1300,
    propertyType: 'apartment',
    amenities: { pool: true, wifi: true, garden: false, jacuzzi: false },
    standing: 2,
    rooms: 2,
    capacity: 4,
    image: IMG.suite,
  },
  {
    slug: 'e2e-stay-apt-essaouira',
    title: 'Appartement médina — Essaouira',
    city: 'Essaouira',
    price: 950,
    propertyType: 'apartment',
    amenities: { pool: false, wifi: true, garden: false, jacuzzi: false },
    standing: 1,
    rooms: 1,
    capacity: 2,
    image: IMG.suite,
  },
  {
    slug: 'e2e-stay-suite-agadir',
    title: 'Suite présidentielle — Agadir',
    city: 'Agadir',
    price: 1900,
    propertyType: 'suite',
    amenities: { pool: false, wifi: true, garden: false, jacuzzi: true },
    standing: 3,
    rooms: 1,
    capacity: 2,
    image: IMG.suite,
  },
  {
    slug: 'e2e-stay-suite-marrakech',
    title: 'Suite riad rooftop — Marrakech',
    city: 'Marrakech',
    price: 1700,
    propertyType: 'suite',
    amenities: { pool: false, wifi: true, garden: false, jacuzzi: true },
    standing: 3,
    rooms: 1,
    capacity: 2,
    image: IMG.suite,
  },
  {
    slug: 'e2e-stay-suite-casablanca',
    title: 'Suite business ocean — Casablanca',
    city: 'Casablanca',
    price: 1500,
    propertyType: 'suite',
    amenities: { pool: false, wifi: true, garden: false, jacuzzi: false },
    standing: 2,
    rooms: 1,
    capacity: 2,
    image: IMG.suite,
  },
];

const EXTRAS = [
  {
    slug: 'e2e-svc-airport-agadir',
    title: 'Transfert aéroport VIP Agadir',
    category: 'Mobilité',
    city: 'Agadir',
    price: 350,
    image: IMG.car,
    serviceDetails: { vehicleType: 'Berline VIP', vehicleCount: 1, guideIncluded: false, languages: ['fr', 'en'] },
    description: 'Accueil nominatif, suivi de vol, véhicule climatisé porte-à-porte.',
  },
  {
    slug: 'e2e-svc-airport-marrakech',
    title: 'Transfert aéroport VIP Marrakech',
    category: 'Mobilité',
    city: 'Marrakech',
    price: 380,
    image: IMG.car,
    serviceDetails: { vehicleType: 'SUV', vehicleCount: 1, guideIncluded: false, languages: ['fr', 'en', 'es'] },
    description: 'Transfert premium depuis l’aéroport Menara vers riad ou hôtel.',
  },
  {
    slug: 'e2e-svc-suv-chauffeur',
    title: 'SUV avec chauffeur — journée',
    category: 'Mobilité',
    city: 'Agadir',
    price: 1200,
    image: IMG.car,
    serviceDetails: { vehicleType: 'SUV 4x4', vehicleCount: 1, guideIncluded: true, languages: ['fr', 'en', 'ar'] },
    description: 'Mise à disposition 8 h avec chauffeur polyglotte.',
  },
  {
    slug: 'e2e-svc-concierge',
    title: 'Conciergerie 24/7',
    category: 'Conciergerie',
    city: 'Marrakech',
    price: 500,
    image: IMG.spa,
    serviceDetails: { vehicleType: '', vehicleCount: 0, guideIncluded: false, languages: ['fr', 'en'] },
    description: 'Réservations restaurants, hammam, spectacles — assistance WhatsApp.',
  },
  {
    slug: 'e2e-svc-tables-vip',
    title: 'Réservation tables VIP',
    category: 'Conciergerie',
    city: 'Agadir',
    price: 200,
    image: IMG.food,
    serviceDetails: { vehicleType: '', vehicleCount: 0, guideIncluded: false, languages: ['fr', 'en'] },
    description: 'Accès privilégié aux meilleures tables de la côte.',
  },
  {
    slug: 'e2e-svc-photo-couple',
    title: 'Séance photo couple — médina',
    category: 'Photographie',
    city: 'Marrakech',
    price: 1200,
    image: IMG.photo,
    serviceDetails: { vehicleType: '', vehicleCount: 0, guideIncluded: false, languages: ['fr', 'en'] },
    description: '1 h de shooting + 20 photos retouchées sous 48 h.',
  },
  {
    slug: 'e2e-svc-photo-family',
    title: 'Séance photo famille — plage',
    category: 'Photographie',
    city: 'Agadir',
    price: 1400,
    image: IMG.photo,
    serviceDetails: { vehicleType: '', vehicleCount: 0, guideIncluded: false, languages: ['fr', 'en'] },
    description: 'Session plage ou marina, livrables HD inclus.',
  },
  {
    slug: 'e2e-svc-guide-medina',
    title: 'Guide privé multilingue — médina',
    category: 'Guides',
    city: 'Fès',
    price: 600,
    image: IMG.medina,
    serviceDetails: { vehicleType: '', vehicleCount: 0, guideIncluded: true, languages: ['fr', 'en', 'ar', 'es'] },
    description: 'Demi-journée avec guide certifié FR / EN / ES / AR.',
  },
  {
    slug: 'e2e-svc-guide-day',
    title: 'Guide journée complète',
    category: 'Guides',
    city: 'Marrakech',
    price: 900,
    image: IMG.medina,
    serviceDetails: { vehicleType: '', vehicleCount: 0, guideIncluded: true, languages: ['fr', 'en'] },
    description: 'Accompagnement sur mesure pour votre itinéraire journée.',
  },
  {
    slug: 'e2e-svc-spa',
    title: 'Hammam & spa privé pour 2',
    category: 'Bien-être',
    city: 'Marrakech',
    price: 900,
    image: IMG.spa,
    serviceDetails: { vehicleType: '', vehicleCount: 0, guideIncluded: false, languages: ['fr'] },
    description: 'Rituel hammam + massage argan en duo.',
  },
  {
    slug: 'e2e-svc-surf-coach',
    title: 'Coaching surf privé',
    category: 'Bien-être',
    city: 'Taghazout',
    price: 450,
    image: IMG.surf,
    serviceDetails: { vehicleType: '', vehicleCount: 0, guideIncluded: true, languages: ['fr', 'en'] },
    description: 'Cours 1:1 avec moniteur — planche incluse.',
  },
  {
    slug: 'e2e-svc-yacht',
    title: 'Sortie yacht demi-journée — Marina',
    category: 'Premium',
    city: 'Agadir',
    price: 3500,
    image: IMG.yacht,
    serviceDetails: { vehicleType: 'Yacht', vehicleCount: 1, guideIncluded: true, languages: ['fr', 'en'] },
    description: 'Skipper inclus, soft drinks, option sunset.',
  },
];

const main = async () => {
  console.log(DRY_RUN ? '=== DRY-RUN seed:stores ===' : '=== seed:stores ===');
  if (!DRY_RUN) {
    await connectDB();
  }

  let toursOp;
  let staysOp;
  let extrasOp;

  if (!DRY_RUN) {
    toursOp = await ensureOperator({
      email: 'e2e-tours@overglow.test',
      name: 'E2E Tours Partner',
      companyName: 'Overglow E2E Tours',
      description: 'Opérateur démo Explorer',
    });
    staysOp = await ensureOperator({
      email: 'e2e-stays@overglow.test',
      name: 'E2E Stays Partner',
      companyName: 'Overglow E2E Stays',
      description: 'Opérateur démo Logements luxe',
    });
    extrasOp = await ensureOperator({
      email: 'e2e-extras@overglow.test',
      name: 'E2E Extras Partner',
      companyName: 'Overglow E2E Extras',
      description: 'Opérateur démo Services',
    });
  }

  const counts = { tour: 0, luxury_stay: 0, service: 0, created: 0, updated: 0 };

  for (const t of TOURS) {
    const r = await upsertProduct(toursOp?._id, {
      ...t,
      productType: 'tour',
    });
    counts.tour += 1;
    if (r.created) counts.created += 1;
    if (r.updated) counts.updated += 1;
  }

  for (const s of STAYS) {
    const r = await upsertProduct(staysOp?._id, {
      slug: s.slug,
      title: s.title,
      description: `${s.title}. Hébergement de standing Overglow avec équipements premium.`,
      category: 'LuxuryStay',
      productType: 'luxury_stay',
      city: s.city,
      price: s.price,
      duration: '1 night',
      image: s.image,
      tags: ['annulation-gratuite', 'confirmation-immediate'],
      highlights: ['Check-in flexible', 'Linge premium', 'Support conciergerie'],
      luxuryStay: {
        rooms: s.rooms,
        capacity: s.capacity,
        amenities: s.amenities,
        propertyType: s.propertyType,
        standing: s.standing,
      },
    });
    counts.luxury_stay += 1;
    if (r.created) counts.created += 1;
    if (r.updated) counts.updated += 1;
  }

  for (const e of EXTRAS) {
    const r = await upsertProduct(extrasOp?._id, {
      slug: e.slug,
      title: e.title,
      description: e.description,
      category: e.category,
      productType: 'service',
      city: e.city,
      price: e.price,
      duration: '2 hours',
      image: e.image,
      tags: ['confirmation-immediate'],
      highlights: ['Réservation flexible', 'Support Overglow'],
      serviceDetails: e.serviceDetails,
    });
    counts.service += 1;
    if (r.created) counts.created += 1;
    if (r.updated) counts.updated += 1;
  }

  console.log('Seed complete:', counts);
  console.log('Logins: e2e-tours@overglow.test / e2e-stays@overglow.test / e2e-extras@overglow.test');
  console.log('Password:', E2E_PASSWORD);
  process.exit(0);
};

main().catch((err) => {
  console.error('seed:stores failed:', err);
  process.exit(1);
});
