import express from 'express';
import Product from '../models/productModel.js';
import { popularDestinations } from '../data/popularDestinations.js';
import { activityCategories } from '../data/popularDestinations.js';

const router = express.Router();

// @desc    Generate sitemap XML
// @route   GET /api/sitemap.xml
// @access  Public
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'https://overglow-v1-3jqp.vercel.app';
    
    // Get all published products
    const products = await Product.find({ status: 'Published' })
      .select('_id updatedAt')
      .lean();
    
    // Get Moroccan cities from products
    const moroccanCities = [...new Set(
      products
        .map(p => p.city)
        .filter(city => city && popularDestinations.some(d => d.city === city && d.country === 'Morocco'))
    )];
    
    // Build sitemap
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Search Page -->
  <url>
    <loc>${baseUrl}/search</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
  <!-- Destination Pages -->
${moroccanCities.map(city => `  <url>
    <loc>${baseUrl}/destinations/${encodeURIComponent(city)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
  
  <!-- Category Pages -->
${activityCategories.map(cat => {
  const categorySlug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
  return `  <url>
    <loc>${baseUrl}/categories/${categorySlug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
}).join('\n')}
  
  <!-- Product Pages -->
${products.map(product => `  <url>
    <loc>${baseUrl}/products/${product._id}</loc>
    <lastmod>${new Date(product.updatedAt || Date.now()).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
  
  <!-- Static Pages -->
  <url>
    <loc>${baseUrl}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/help</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/culture</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

export default router;

