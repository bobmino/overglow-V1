/**
 * Assigne des galeries WebP locales uniques (frontend/public/images/cities)
 * aux produits Published. Remplace Unsplash / images distantes.
 *
 * Usage:
 *   node -r dotenv/config scripts/syncCatalogLocalImages.js
 * Docker:
 *   docker compose exec api node -r dotenv/config scripts/syncCatalogLocalImages.js
 */
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Product from '../backend/models/productModel.js';

dotenv.config();

/** Galeries distinctes par expérience (évite le même hero partout). */
const SLUG_IMAGES = {
  'medina-marrakech-guide-prive': [
    '/images/cities/marrakech-hero.webp',
    '/images/cities/marrakech-card.webp',
    '/images/cities/marrakech-g2.webp',
  ],
  'desert-agafay-coucher-soleil': [
    '/images/cities/marrakech-g2.webp',
    '/images/cities/taroudant-hero.webp',
    '/images/cities/marrakech-hero.webp',
  ],
  'atelier-cuisine-tagine-fes': [
    '/images/cities/fes-hero.webp',
    '/images/cities/fes-card.webp',
    '/images/cities/fes-g1.webp',
  ],
  'surf-taghazout-demi-journee': [
    '/images/cities/taghazout-hero.webp',
    '/images/cities/taghazout-card.webp',
    '/images/cities/agadir-hero.webp',
  ],
  'essaouira-journee-vent-et-medina': [
    '/images/cities/essaouira-hero.webp',
    '/images/cities/essaouira-card.webp',
    '/images/cities/essaouira-g1.webp',
  ],
  'trek-toubkal-2-jours': [
    '/images/cities/taroudant-hero.webp',
    '/images/cities/taroudant-g1.webp',
    '/images/cities/marrakech-g2.webp',
  ],
  'riad-visite-architecture-marrakech': [
    '/images/cities/marrakech-card.webp',
    '/images/cities/fes-g2.webp',
    '/images/cities/marrakech-hero.webp',
  ],
  'casablanca-hassan-ii-et-corniche': [
    '/images/cities/casablanca-hero.webp',
    '/images/cities/casablanca-card.webp',
    '/images/cities/casablanca-g1.webp',
  ],
};

const CITY_FALLBACK = {
  Marrakech: SLUG_IMAGES['medina-marrakech-guide-prive'],
  Casablanca: SLUG_IMAGES['casablanca-hassan-ii-et-corniche'],
  Fès: SLUG_IMAGES['atelier-cuisine-tagine-fes'],
  Agadir: SLUG_IMAGES['surf-taghazout-demi-journee'],
  Essaouira: SLUG_IMAGES['essaouira-journee-vent-et-medina'],
  Imlil: SLUG_IMAGES['trek-toubkal-2-jours'],
  Taghazout: SLUG_IMAGES['surf-taghazout-demi-journee'],
};

const resolveImages = (product) => {
  if (SLUG_IMAGES[product.slug]) return SLUG_IMAGES[product.slug];
  if (CITY_FALLBACK[product.city]) return CITY_FALLBACK[product.city];
  return ['/images/placeholder.webp'];
};

const run = async () => {
  await connectDB();
  const products = await Product.find({ status: 'Published' });
  let updated = 0;

  for (const product of products) {
    const next = resolveImages(product);
    const current = Array.isArray(product.images) ? product.images : [];
    const needsUpdate =
      current.length === 0 ||
      current.some((url) => /^https?:\/\//i.test(String(url))) ||
      JSON.stringify(current) !== JSON.stringify(next);

    if (!needsUpdate) continue;

    product.images = next;
    await product.save();
    updated += 1;
    console.log(`OK ${product.slug || product._id} → ${next[0]} (+${next.length - 1})`);
  }

  console.log(JSON.stringify({ total: products.length, updated }, null, 2));
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
