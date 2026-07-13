/**
 * Génère docs/API-REFERENCE.md à partir de backend/routes/*.js
 * Usage: node scripts/generateApiReference.js
 */
import fs from 'fs';
import path from 'path';

const dir = 'backend/routes';
const mounts = {
  authRoutes: '/api/auth',
  productRoutes: '/api/products',
  scheduleRoutes: '/api/schedules',
  bookingRoutes: '/api/bookings',
  adminRoutes: '/api/admin',
  operatorRoutes: '/api/operator',
  onboardingRoutes: '/api/operator/onboarding',
  operatorWizardRoutes: '/api/operator/wizard',
  paymentRoutes: '/api/payments',
  uploadRoutes: '/api/upload',
  searchRoutes: '/api/search',
  inquiryRoutes: '/api/inquiries',
  settingsRoutes: '/api/settings',
  reviewRoutes: '/api/reviews',
  notificationRoutes: '/api/notifications',
  withdrawalRoutes: '/api/withdrawals',
  approvalRequestRoutes: '/api/approval-requests',
  badgeRoutes: '/api/badges',
  badgeRequestRoutes: '/api/badge-requests',
  favoriteRoutes: '/api/favorites',
  recommendationRoutes: '/api/recommendations',
  loyaltyRoutes: '/api/loyalty',
  viewHistoryRoutes: '/api/view-history',
  faqRoutes: '/api/faq',
  chatRoutes: '/api/chat',
  blogRoutes: '/api/blog',
  healthRoutes: '/api/health',
  orderRoutes: '/api/orders',
  homepageRoutes: '/api/homepage',
  contentRoutes: '/api/content',
  sitemapRoutes: '',
};

const groupNames = {
  authRoutes: 'Auth',
  productRoutes: 'Products',
  scheduleRoutes: 'Schedules',
  bookingRoutes: 'Bookings',
  adminRoutes: 'Admin',
  operatorRoutes: 'Operator',
  onboardingRoutes: 'Operator Onboarding',
  operatorWizardRoutes: 'Operator Wizard',
  paymentRoutes: 'Payments',
  uploadRoutes: 'Upload',
  searchRoutes: 'Search',
  inquiryRoutes: 'Inquiries',
  settingsRoutes: 'Settings',
  reviewRoutes: 'Reviews',
  notificationRoutes: 'Notifications',
  withdrawalRoutes: 'Withdrawals',
  approvalRequestRoutes: 'Approval Requests',
  badgeRoutes: 'Badges',
  badgeRequestRoutes: 'Badge Requests',
  favoriteRoutes: 'Favorites',
  recommendationRoutes: 'Recommendations',
  loyaltyRoutes: 'Loyalty',
  viewHistoryRoutes: 'View History',
  faqRoutes: 'FAQ',
  chatRoutes: 'Chat',
  blogRoutes: 'Blog',
  healthRoutes: 'Health',
  orderRoutes: 'Orders',
  homepageRoutes: 'Homepage',
  contentRoutes: 'Content',
  sitemapRoutes: 'Sitemap / SEO',
};

function detectAuth(snippet) {
  if (/authorize\(\s*['"]Admin['"]/.test(snippet)) return 'Private / Admin';
  if (/authorize\(\s*['"]Opérateur['"]/.test(snippet) || /authorize\(\s*['"]Operator['"]/.test(snippet)) {
    return 'Private / Opérateur';
  }
  if (/authorize\(/.test(snippet)) return 'Private / Role-restricted';
  if (/protect/.test(snippet)) return 'Private (JWT)';
  if (/optionalAuth/.test(snippet)) return 'Public (optional auth)';
  return 'Public';
}

function extractRoutes(fileText, mount) {
  const routes = [];
  // router.METHOD('path', ...)
  const simple = /router\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)['"]([^)]*)\)/gis;
  let m;
  while ((m = simple.exec(fileText))) {
    routes.push({
      method: m[1].toUpperCase(),
      path: `${mount}${m[2]}`,
      auth: detectAuth(m[0] + m[3]),
    });
  }
  // router.route('path').get(...).post(...)
  const routeBlocks = /router\.route\(\s*['"]([^'"]+)['"]\s*\)([\s\S]*?)(?=router\.|$)/g;
  while ((m = routeBlocks.exec(fileText))) {
    const subPath = m[1];
    const block = m[2];
    const chained = /\.(get|post|put|patch|delete)\(([^)]*)\)/gi;
    let c;
    while ((c = chained.exec(block))) {
      routes.push({
        method: c[1].toUpperCase(),
        path: `${mount}${subPath}`,
        auth: detectAuth(c[0]),
      });
    }
  }
  // de-dupe
  const seen = new Set();
  return routes.filter((r) => {
    const k = `${r.method} ${r.path}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

const byGroup = {};
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js'))) {
  const base = f.replace('.js', '');
  const mount = mounts[base];
  if (mount === undefined) continue;
  const text = fs.readFileSync(path.join(dir, f), 'utf8');
  const group = groupNames[base] || base;
  byGroup[group] = {
    file: `backend/routes/${f}`,
    mount: mount || '(root)',
    routes: extractRoutes(text, mount),
  };
}

let md = `# Overglow Trip — Référence API

> Généré le ${new Date().toISOString().slice(0, 10)} à partir de \`backend/routes/*.js\`.
> Base URL prod : \`https://overglow-backend.vercel.app\` (ou \`VITE_API_URL\`).
> Auth : header \`Authorization: Bearer <accessToken>\` sauf endpoints publics / webhooks.

## Conventions

| Élément | Détail |
|--------|--------|
| Format | JSON (\`Content-Type: application/json\`) |
| Erreurs | \`{ message }\` ou \`{ success: false, error, statusCode }\` |
| Pagination | Souvent \`page\`, \`limit\` en query ; réponse \`pagination\` ou \`total\`/\`page\`/\`totalPages\` |
| Devise | Montants souvent en MAD (paramètres plateforme) |

`;

let total = 0;
for (const [group, meta] of Object.entries(byGroup).sort((a, b) => a[0].localeCompare(b[0]))) {
  md += `\n## ${group}\n\n`;
  md += `- **Fichier** : \`${meta.file}\`\n`;
  md += `- **Préfixe** : \`${meta.mount}\`\n\n`;
  md += `| Méthode | Chemin | Auth | Description |\n`;
  md += `|---------|--------|------|-------------|\n`;
  for (const r of meta.routes) {
    total += 1;
    const desc = describe(r.method, r.path);
    md += `| \`${r.method}\` | \`${r.path}\` | ${r.auth} | ${desc} |\n`;
  }
}

md += `\n---\n\n**Total endpoints documentés :** ${total}\n`;

function describe(method, p) {
  const path = p.toLowerCase();
  if (path.includes('webhook')) return 'Webhook PSP / import (signature ou clé API)';
  if (path.includes('unread-count')) return 'Compteur non lus (léger)';
  if (path.includes('mark-all-read') || path.endsWith('/read')) return 'Marquer comme lu';
  if (path.includes('finance/stats')) return 'KPIs financiers admin (période)';
  if (path.includes('finance/transactions')) return 'Ledger transactions paginé + filtres';
  if (method === 'GET' && path.endsWith('/me')) return 'Utilisateur courant';
  if (path.includes('login') || path.includes('register')) return 'Authentification';
  if (path.includes('health')) return 'Santé service / dépendances';
  if (method === 'DELETE') return 'Suppression de la ressource';
  if (method === 'POST') return 'Création / action';
  if (method === 'PUT' || method === 'PATCH') return 'Mise à jour';
  return 'Lecture / listing';
}

fs.writeFileSync('docs/API-REFERENCE.md', md, 'utf8');
console.log('Wrote docs/API-REFERENCE.md with', total, 'endpoints');
