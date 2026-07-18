/**
 * Remplace les images distantes (Unsplash/etc.) des produits Published
 * par les WebP locaux /images/cities/* (frontend public).
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

const CITY_IMAGE = {
  Marrakech: ['/images/cities/marrakech-hero.webp', '/images/cities/marrakech-card.webp', '/images/cities/marrakech-g2.webp'],
  Casablanca: ['/images/cities/casablanca-hero.webp', '/images/cities/casablanca-card.webp', '/images/cities/casablanca-g1.webp'],
  Fès: ['/images/cities/fes-hero.webp', '/images/cities/fes-card.webp', '/images/cities/fes-g1.webp'],
  Agadir: ['/images/cities/agadir-hero.webp', '/images/cities/agadir-card.webp', '/images/cities/taghazout-hero.webp'],
  Essaouira: ['/images/cities/essaouira-hero.webp', '/images/cities/essaouira-card.webp', '/images/cities/essaouira-g1.webp'],
  Imlil: ['/images/cities/marrakech-hero.webp', '/images/cities/taroudant-hero.webp', '/images/cities/marrakech-g2.webp'],
  Taghazout: ['/images/cities/taghazout-hero.webp', '/images/cities/taghazout-card.webp', '/images/cities/taghazout-g1.webp'],
};

const SLUG_IMAGES = {
  'medina-marrakech-guide-prive': CITY_IMAGE.Marrakech,
  'desert-agafay-coucher-soleil': ['/images/cities/marrakech-hero.webp', '/images/cities/marrakech-g2.webp'],
  'atelier-cuisine-tagine-fes': CITY_IMAGE.Fès,
  'surf-taghazout-demi-journee': CITY_IMAGE.Taghazout,
  'essaouira-journee-vent-et-medina': CITY_IMAGE.Essaouira,
  'trek-toubkal-2-jours': CITY_IMAGE.Imlil,
  'riad-visite-architecture-marrakech': ['/images/cities/marrakech-card.webp', '/images/cities/marrakech-hero.webp'],
  'casablanca-hassan-ii-et-corniche': CITY_IMAGE.Casablanca,
};

const resolveImages = (product) => {
  if (SLUG_IMAGES[product.slug]) return SLUG_IMAGES[product.slug];
  if (CITY_IMAGE[product.city]) return CITY_IMAGE[product.city];
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
    console.log(`OK ${product.slug || product._id} → ${next[0]}`);
  }

  console.log(JSON.stringify({ total: products.length, updated }, null, 2));
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
