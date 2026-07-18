/**
 * Seed catalogue soft-launch Maroc — 1 opérateur Active + 8 expériences Published (MAD).
 * Idempotent: skip si un produit avec le même slug existe.
 *
 * Usage:
 *   node -r dotenv/config scripts/seedMoroccoCatalog.js
 * Docker:
 *   docker compose exec api node -r dotenv/config scripts/seedMoroccoCatalog.js
 */
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../backend/models/userModel.js';
import Operator from '../backend/models/operatorModel.js';
import Product from '../backend/models/productModel.js';
import Schedule from '../backend/models/scheduleModel.js';
import { logger } from '../backend/utils/logger.js';

const buildSchedules = ({ productId, price, days = 90 }) => {
  const entries = [];
  const current = new Date();
  current.setHours(0, 0, 0, 0);
  for (let i = 0; i < days; i += 1) {
    const date = new Date(current);
    date.setDate(current.getDate() + i);
    entries.push({
      product: productId,
      date,
      time: '10:00',
      endTime: '13:00',
      capacity: 20,
      price,
      currency: 'MAD',
    });
  }
  return entries;
};

dotenv.config();

const OPERATOR_EMAIL = process.env.SEED_OPERATOR_EMAIL || 'partenaire@overglow.online';
const OPERATOR_PASSWORD = process.env.SEED_OPERATOR_PASSWORD || 'OverglowPartner2026!';

const PRODUCTS = [
  {
    slug: 'medina-marrakech-guide-prive',
    title: 'Médina de Marrakech — guide privé',
    description:
      'Parcours immersif dans la médina : souks, places et riads. Guide local francophone, groupes réduits, pauses thé à la menthe incluses.',
    category: 'Tours',
    city: 'Marrakech',
    address: 'Place Jemaa el-Fna, Marrakech',
    duration: '3 heures',
    price: 350,
    location: { type: 'Point', coordinates: [-7.9811, 31.6258] },
    images: ['/images/cities/marrakech-hero.webp', '/images/cities/marrakech-card.webp'],
  },
  {
    slug: 'desert-agafay-coucher-soleil',
    title: 'Désert d’Agafay — coucher de soleil',
    description:
      'Transfert A/R depuis Marrakech, thé berbère, vue sur les collines d’Agafay au coucher du soleil. Idéal demi-journée.',
    category: 'Day Trips',
    city: 'Marrakech',
    address: 'Agafay Desert, Marrakech',
    duration: '5 heures',
    price: 650,
    location: { type: 'Point', coordinates: [-8.05, 31.45] },
    images: ['/images/cities/marrakech-hero.webp', '/images/cities/marrakech-g2.webp'],
  },
  {
    slug: 'atelier-cuisine-tagine-fes',
    title: 'Atelier cuisine — tajine à Fès',
    description:
      'Marché local + atelier chez l’habitant : préparation d’un tajine, dégustation et recettes à emporter. Tout inclus sauf boissons alcoolisées.',
    category: 'Food & Drink',
    city: 'Fès',
    address: 'Médina de Fès',
    duration: '4 heures',
    price: 420,
    location: { type: 'Point', coordinates: [-4.9998, 34.0331] },
    images: ['/images/cities/fes-hero.webp', '/images/cities/fes-card.webp'],
  },
  {
    slug: 'surf-taghazout-demi-journee',
    title: 'Surf à Taghazout — demi-journée',
    description:
      'Cours adapté débutants et intermédiaires, planche et combinaison fournies, coach local. RDV plage Taghazout.',
    category: 'Activities',
    city: 'Agadir',
    address: 'Taghazout Beach',
    duration: '3 heures',
    price: 380,
    location: { type: 'Point', coordinates: [-9.711, 30.545] },
    images: ['/images/cities/taghazout-hero.webp', '/images/cities/taghazout-card.webp'],
  },
  {
    slug: 'essaouira-journee-vent-et-medina',
    title: 'Essaouira — journée vent & médina',
    description:
      'Départ Marrakech, visite guidée de la médina, temps libre port & plage. Déjeuner non inclus. Retour en fin d’après-midi.',
    category: 'Day Trips',
    city: 'Essaouira',
    address: 'Essaouira Medina',
    duration: '1 jour',
    price: 550,
    location: { type: 'Point', coordinates: [-9.77, 31.5085] },
    images: ['/images/cities/essaouira-hero.webp', '/images/cities/essaouira-card.webp'],
  },
  {
    slug: 'trek-toubkal-2-jours',
    title: 'Trek Toubkal — 2 jours (refuge)',
    description:
      'Ascension encadrée vers le Toubkal, nuit en refuge, mulets pour bagages. Niveau sportif requis. Départ Imlil.',
    category: 'Tours',
    city: 'Imlil',
    address: 'Imlil, Haut Atlas',
    duration: '2 jours',
    price: 1800,
    location: { type: 'Point', coordinates: [-7.921, 31.136] },
    images: ['/images/cities/marrakech-hero.webp', '/images/cities/taroudant-hero.webp'],
  },
  {
    slug: 'riad-visite-architecture-marrakech',
    title: 'Visite architecture — riads de Marrakech',
    description:
      'Découverte de 3 riads remarquables avec historien local : patio, zellige, histoire des familles. Thé offert.',
    category: 'Attractions',
    city: 'Marrakech',
    address: 'Médina, Marrakech',
    duration: '2 heures',
    price: 280,
    location: { type: 'Point', coordinates: [-7.9891, 31.6295] },
    images: ['/images/cities/marrakech-card.webp', '/images/cities/marrakech-hero.webp'],
  },
  {
    slug: 'casablanca-hassan-ii-et-corniche',
    title: 'Casablanca — Hassan II & Corniche',
    description:
      'Visite de la mosquée Hassan II (tickets inclus selon créneaux) puis promenade Corniche. Guide francophone.',
    category: 'Tours',
    city: 'Casablanca',
    address: 'Mosquée Hassan II',
    duration: '4 heures',
    price: 480,
    location: { type: 'Point', coordinates: [-7.6327, 33.6089] },
    images: ['/images/cities/casablanca-hero.webp', '/images/cities/casablanca-card.webp'],
  },
];

const ensureOperator = async () => {
  let user = await User.findOne({ email: OPERATOR_EMAIL });
  if (!user) {
    user = await User.create({
      name: 'Atlas Experiences',
      email: OPERATOR_EMAIL,
      password: OPERATOR_PASSWORD,
      role: 'Opérateur',
      isApproved: true,
    });
    logger.info(`Created operator user ${OPERATOR_EMAIL}`);
  } else if (user.role !== 'Opérateur') {
    user.role = 'Opérateur';
    user.isApproved = true;
    await user.save();
  }

  let operator = await Operator.findOne({ user: user._id });
  if (!operator) {
    operator = await Operator.create({
      user: user._id,
      providerType: 'company',
      publicName: 'Atlas Experiences',
      description:
        'Opérateur local Overglow — expériences authentiques au Maroc (médinas, désert, surf, trek).',
      location: { city: 'Marrakech', country: 'Maroc' },
      companyAddress: { city: 'Marrakech', country: 'Maroc', street: 'Médina' },
      companyInfo: { companyName: 'Atlas Experiences SARL', legalForm: 'SARL' },
      experiences: 'Guides locaux, groupes réduits, focus Maroc.',
      status: 'Active',
      isFormCompleted: true,
      completedSteps: [
        'providerType',
        'publicInfo',
        'photos',
        'address',
        'experiences',
        'privateInfo',
      ],
    });
    logger.info('Created operator profile Atlas Experiences');
  } else {
    operator.status = 'Active';
    operator.isFormCompleted = true;
    operator.publicName = operator.publicName || 'Atlas Experiences';
    if (operator.location) operator.location.country = 'Maroc';
    await operator.save();
  }

  return operator;
};

const run = async () => {
  await connectDB();
  const operator = await ensureOperator();

  let created = 0;
  let skipped = 0;

  for (const p of PRODUCTS) {
    const existing = await Product.findOne({ slug: p.slug });
    if (existing) {
      skipped += 1;
      continue;
    }
    const product = await Product.create({
      ...p,
      operator: operator._id,
      status: 'Published',
      productType: 'tour',
      cancellationPolicy: { type: 'moderate', refundPercentage: 50, hoursBeforeStart: 48 },
      paymentMethod: 'Paiement sur place',
    });
    await Schedule.insertMany(buildSchedules({ productId: product._id, price: p.price }));
    created += 1;
  }

  console.log(
    JSON.stringify(
      {
        operatorEmail: OPERATOR_EMAIL,
        operatorPasswordHint: 'see SEED_OPERATOR_PASSWORD or default in script',
        products: { created, skipped, total: PRODUCTS.length },
      },
      null,
      2
    )
  );
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
