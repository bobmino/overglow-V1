/**
 * Génère robots.txt, sitemap.xml (pages publiques + hreflang) et manifests i18n.
 * Usage: node scripts/generateSeoAssets.js
 * Branché sur frontend `npm run build`.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'frontend', 'public');

const SITE_URL = (process.env.VITE_SITE_URL || process.env.FRONTEND_URL || 'https://www.overglowtrip.com').replace(
  /\/$/,
  ''
);
const ALLOW_INDEXING = process.env.ALLOW_INDEXING !== 'false' && process.env.SEO_NOINDEX !== 'true';
const LOCALES = ['fr', 'en', 'es', 'ar'];

const staticPaths = [
  { loc: '/', priority: '1.0', changefreq: 'daily' },
  { loc: '/search', priority: '0.9', changefreq: 'daily' },
  { loc: '/blog', priority: '0.8', changefreq: 'weekly' },
  { loc: '/about', priority: '0.6', changefreq: 'monthly' },
  { loc: '/help', priority: '0.6', changefreq: 'monthly' },
  { loc: '/faq', priority: '0.6', changefreq: 'monthly' },
  { loc: '/culture', priority: '0.7', changefreq: 'monthly' },
  { loc: '/privacy', priority: '0.4', changefreq: 'yearly' },
  { loc: '/terms', priority: '0.4', changefreq: 'yearly' },
  { loc: '/affiliate', priority: '0.7', changefreq: 'monthly' },
  { loc: '/partners/signup', priority: '0.7', changefreq: 'monthly' },
  { loc: '/contact', priority: '0.5', changefreq: 'monthly' },
  { loc: '/destinations/Marrakech', priority: '0.8', changefreq: 'weekly' },
  { loc: '/destinations/Casablanca', priority: '0.8', changefreq: 'weekly' },
  { loc: '/destinations/Fès', priority: '0.8', changefreq: 'weekly' },
  { loc: '/destinations/Rabat', priority: '0.8', changefreq: 'weekly' },
  { loc: '/destinations/Tanger', priority: '0.8', changefreq: 'weekly' },
  { loc: '/destinations/Agadir', priority: '0.8', changefreq: 'weekly' },
  { loc: '/categories/Tours', priority: '0.8', changefreq: 'weekly' },
  { loc: '/categories/Attractions', priority: '0.8', changefreq: 'weekly' },
  { loc: '/categories/Day%20Trips', priority: '0.7', changefreq: 'weekly' },
  { loc: '/categories/Outdoor%20Activities', priority: '0.7', changefreq: 'weekly' },
  { loc: '/categories/Food%20%26%20Drink', priority: '0.7', changefreq: 'weekly' },
];

function hreflangLinks(pathname) {
  const clean = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const links = LOCALES.map(
    (lang) =>
      `    <xhtml:link rel="alternate" hreflang="${lang}" href="${SITE_URL}${clean}${clean.includes('?') ? '&' : '?'}lang=${lang}" />`
  );
  links.push(
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${clean}" />`
  );
  return links.join('\n');
}

function buildSitemap() {
  const today = new Date().toISOString().split('T')[0];
  const urls = staticPaths
    .map(
      ({ loc, priority, changefreq }) => `  <url>
    <loc>${SITE_URL}${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
${hreflangLinks(loc)}
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}

function buildRobots() {
  if (!ALLOW_INDEXING) {
    return `# Staging / preview — noindex
User-agent: *
Disallow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
  }

  return `# Production
User-agent: *
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

Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${SITE_URL}/api/sitemap.xml
`;
}

const manifestCopy = {
  fr: {
    name: 'Overglow Trip - Expériences Authentiques au Maroc',
    short_name: 'Overglow',
    description: 'Découvrez des expériences authentiques et des activités uniques au Maroc',
    lang: 'fr',
    dir: 'ltr',
  },
  en: {
    name: 'Overglow Trip - Authentic Experiences in Morocco',
    short_name: 'Overglow',
    description: 'Discover authentic experiences and unique activities in Morocco',
    lang: 'en',
    dir: 'ltr',
  },
  es: {
    name: 'Overglow Trip - Experiencias auténticas en Marruecos',
    short_name: 'Overglow',
    description: 'Descubre experiencias auténticas y actividades únicas en Marruecos',
    lang: 'es',
    dir: 'ltr',
  },
  ar: {
    name: 'Overglow Trip - تجارب أصيلة في المغرب',
    short_name: 'Overglow',
    description: 'اكتشف تجارب أصيلة وأنشطة فريدة في المغرب',
    lang: 'ar',
    dir: 'rtl',
  },
};

function buildManifest(lang) {
  const copy = manifestCopy[lang] || manifestCopy.fr;
  return {
    name: copy.name,
    short_name: copy.short_name,
    description: copy.description,
    start_url: `/?lang=${lang}`,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#059669',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/vite.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
    categories: ['travel', 'lifestyle'],
    lang: copy.lang,
    dir: copy.dir,
    scope: '/',
    screenshots: [],
  };
}

fs.mkdirSync(publicDir, { recursive: true });

fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), buildSitemap());
fs.writeFileSync(path.join(publicDir, 'robots.txt'), buildRobots());

for (const lang of LOCALES) {
  const manifest = buildManifest(lang);
  fs.writeFileSync(path.join(publicDir, `manifest-${lang}.json`), `${JSON.stringify(manifest, null, 2)}\n`);
}
fs.writeFileSync(path.join(publicDir, 'manifest.json'), `${JSON.stringify(buildManifest('fr'), null, 2)}\n`);

console.log(`SEO assets generated for ${SITE_URL} (indexing=${ALLOW_INDEXING})`);
