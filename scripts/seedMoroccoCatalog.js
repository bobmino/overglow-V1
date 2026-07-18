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
import { logger } from '../backend/utils/logger.js';

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
    images: ['https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=1200'],
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
    images: ['https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=1200'],
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
    images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200'],
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
    images: ['https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=1200'],
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
    images: ['https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200'],
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
    images: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200'],
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
    images: ['https://images.unsplash.com/photo-1548013146-72479768bada?w=1200'],
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
    images: ['https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=1200'],
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
    await Product.create({
      ...p,
      operator: operator._id,
      status: 'Published',
      productType: 'tour',
      cancellationPolicy: { type: 'moderate', refundPercentage: 50, hoursBeforeStart: 48 },
      paymentMethod: 'Paiement sur place',
    });
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
