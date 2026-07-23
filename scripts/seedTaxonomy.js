/**
 * Seed taxonomie Overglow (parents + feuilles) — pattern Viator Maroc.
 * Usage: node -r dotenv/config scripts/seedTaxonomy.js
 * Docker: docker compose exec -T api node -r dotenv/config scripts/seedTaxonomy.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Taxonomy from '../backend/models/taxonomyModel.js';

dotenv.config();

const L = (fr, en = fr, es = fr, ar = fr) => ({ fr, en, es, ar });

/**
 * Structure: { slug, label, productTypes, children: [{ slug, label }] }
 */
const TREE = [
  {
    slug: 'circuits',
    label: L('Circuits', 'Tours', 'Circuitos', 'جولات'),
    productTypes: ['tour'],
    children: [
      { slug: 'circuits-journee', label: L("Circuits d'une journée", 'Day tours', 'Tours de un día') },
      { slug: 'circuits-plusieurs-jours', label: L('Circuits de plusieurs jours', 'Multi-day tours') },
      { slug: 'circuits-prives', label: L('Circuits privés', 'Private tours', 'Tours privados') },
      { slug: 'circuits-terrestres', label: L('Circuits sur terre', 'Land tours') },
      { slug: 'circuits-aquatiques', label: L('Circuits aquatiques', 'Water tours') },
      { slug: 'circuits-aeriens', label: L('Circuits aériens', 'Air tours') },
      { slug: 'circuits-culturels', label: L('Circuits culturels', 'Cultural tours') },
      { slug: 'circuits-desert', label: L('Circuits désert', 'Desert tours') },
    ],
  },
  {
    slug: 'activites',
    label: L('Activités', 'Activities', 'Actividades', 'أنشطة'),
    productTypes: ['tour'],
    children: [
      { slug: 'activites-aquatiques', label: L('Activités aquatiques', 'Water activities') },
      { slug: 'activites-terrestres', label: L('Activités terrestres et de plein air', 'Land & outdoor') },
      { slug: 'activites-aeriennes', label: L('Activités aériennes', 'Aerial activities') },
      { slug: 'activites-extremes', label: L('Activités extrêmes', 'Extreme activities') },
      { slug: 'cours-ateliers', label: L('Cours et ateliers', 'Classes & workshops') },
      { slug: 'gastronomie', label: L('Gastronomie', 'Food & drink', 'Gastronomía') },
      { slug: 'bien-etre', label: L('Bien-être', 'Wellness') },
      { slug: 'attractions', label: L('Attractions', 'Attractions') },
    ],
  },
  {
    slug: 'hebergement',
    label: L('Hébergement', 'Stays', 'Alojamiento'),
    productTypes: ['luxury_stay'],
    children: [
      { slug: 'riads', label: L('Riads', 'Riads') },
      { slug: 'villas', label: L('Villas', 'Villas') },
      { slug: 'appartements', label: L('Appartements', 'Apartments') },
      { slug: 'suites-luxe', label: L('Suites & luxe', 'Luxury suites') },
      { slug: 'chambres-hotes', label: L("Chambres d'hôtes", 'Guest houses') },
    ],
  },
  {
    slug: 'transport',
    label: L('Transport', 'Transport', 'Transporte'),
    productTypes: ['service'],
    children: [
      { slug: 'transferts-aeroport', label: L('Transferts aéroport', 'Airport transfers') },
      { slug: 'chauffeur-prive', label: L('Chauffeur privé', 'Private driver') },
      { slug: 'location-vehicule', label: L('Location de véhicule', 'Vehicle rental') },
      { slug: 'navettes', label: L('Navettes', 'Shuttles') },
    ],
  },
  {
    slug: 'guides',
    label: L('Guides', 'Guides', 'Guías'),
    productTypes: ['service'],
    children: [
      { slug: 'guide-prive', label: L('Guide privé', 'Private guide') },
      { slug: 'guide-medina', label: L('Guide médina', 'Medina guide') },
      { slug: 'guide-montagne', label: L('Guide montagne', 'Mountain guide') },
    ],
  },
  {
    slug: 'services-premium',
    label: L('Services premium', 'Premium services'),
    productTypes: ['service'],
    children: [
      { slug: 'photographie', label: L('Photographie', 'Photography') },
      { slug: 'conciergerie', label: L('Conciergerie', 'Concierge') },
      { slug: 'autres-services', label: L('Autres services', 'Other services') },
    ],
  },
];

const upsertNode = async (data) => {
  return Taxonomy.findOneAndUpdate(
    { slug: data.slug },
    { $set: data },
    { upsert: true, new: true }
  );
};

const run = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/overglow';
  await mongoose.connect(uri);
  console.log('Connected', uri.replace(/\/\/.*@/, '//***@'));

  let parents = 0;
  let leaves = 0;

  for (let i = 0; i < TREE.length; i++) {
    const root = TREE[i];
    const parentDoc = await upsertNode({
      slug: root.slug,
      label: root.label,
      parent: null,
      productTypes: root.productTypes,
      kind: 'parent',
      order: i + 1,
      isActive: true,
    });
    parents += 1;

    for (let j = 0; j < root.children.length; j++) {
      const child = root.children[j];
      await upsertNode({
        slug: child.slug,
        label: child.label,
        parent: parentDoc._id,
        productTypes: root.productTypes,
        kind: 'leaf',
        order: j + 1,
        isActive: true,
      });
      leaves += 1;
    }
  }

  console.log(`Taxonomy seeded: ${parents} parents, ${leaves} leaves`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
