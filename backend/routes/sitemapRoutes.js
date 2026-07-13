import express from 'express';
import Product from '../models/productModel.js';
import { popularDestinations } from '../data/popularDestinations.js';
import { activityCategories } from '../data/popularDestinations.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

const LOCALES = ['fr', 'en', 'es', 'ar'];

const getBaseUrl = () =>
  (process.env.FRONTEND_URL || process.env.SITE_URL || 'https://www.overglowtrip.com').replace(/\/$/, '');

const hreflangBlock = (baseUrl, pathname) => {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const lines = LOCALES.map(
    (lang) =>
      `    <xhtml:link rel="alternate" hreflang="${lang}" href="${baseUrl}${path}${path.includes('?') ? '&' : '?'}lang=${lang}"/>`
  );
  lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${path}"/>`);
  return lines.join('\n');
};

const urlEntry = (baseUrl, loc, { lastmod, changefreq = 'weekly', priority = '0.7' } = {}) => {
  const lastmodLine = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
  return `  <url>
    <loc>${baseUrl}${loc}</loc>${lastmodLine}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
${hreflangBlock(baseUrl, loc)}
  </url>`;
};

// @desc    Generate sitemap XML (production domain + hreflang)
// @route   GET /api/sitemap.xml
// @access  Public
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = getBaseUrl();

    const products = await Product.find({ status: 'Published' }).select('_id updatedAt city').lean();

    const moroccanCities = [
      ...new Set(
        products
          .map((p) => p.city)
          .filter(
            (city) => city && popularDestinations.some((d) => d.city === city && d.country === 'Morocco')
          )
      ),
    ];

    const staticEntries = [
      urlEntry(baseUrl, '/', { changefreq: 'daily', priority: '1.0' }),
      urlEntry(baseUrl, '/search', { changefreq: 'daily', priority: '0.9' }),
      urlEntry(baseUrl, '/blog', { changefreq: 'weekly', priority: '0.8' }),
      urlEntry(baseUrl, '/about', { changefreq: 'monthly', priority: '0.6' }),
      urlEntry(baseUrl, '/help', { changefreq: 'monthly', priority: '0.6' }),
      urlEntry(baseUrl, '/culture', { changefreq: 'monthly', priority: '0.7' }),
      urlEntry(baseUrl, '/privacy', { changefreq: 'yearly', priority: '0.4' }),
      urlEntry(baseUrl, '/affiliate', { changefreq: 'monthly', priority: '0.7' }),
    ];

    const destinationEntries = moroccanCities.map((city) =>
      urlEntry(baseUrl, `/destinations/${encodeURIComponent(city)}`, {
        changefreq: 'weekly',
        priority: '0.8',
      })
    );

    const categoryEntries = activityCategories.map((cat) => {
      const categorySlug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
      return urlEntry(baseUrl, `/categories/${encodeURIComponent(categorySlug)}`, {
        changefreq: 'weekly',
        priority: '0.8',
      });
    });

    const productEntries = products.map((product) =>
      urlEntry(baseUrl, `/products/${product._id}`, {
        lastmod: new Date(product.updatedAt || Date.now()).toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: '0.7',
      })
    );

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${[...staticEntries, ...destinationEntries, ...categoryEntries, ...productEntries].join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(sitemap);
  } catch (error) {
    logger.error('Sitemap generation error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

/**
 * robots.txt dynamique (prod indexable / staging noindex).
 * @route GET /api/robots.txt
 */
router.get('/robots.txt', (req, res) => {
  const baseUrl = getBaseUrl();
  const allowIndexing =
    process.env.ALLOW_INDEXING !== 'false' &&
    process.env.SEO_NOINDEX !== 'true' &&
    process.env.NODE_ENV === 'production';

  const body = allowIndexing
    ? `User-agent: *
Allow: /

Disallow: /api/
Disallow: /admin/
Disallow: /dashboard/
Disallow: /operator/
Disallow: /_next/
Disallow: /login
Disallow: /register
Disallow: /checkout
Disallow: /booking-success

Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/api/sitemap.xml
`
    : `User-agent: *
Disallow: /

Sitemap: ${baseUrl}/sitemap.xml
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(body);
});

export default router;
