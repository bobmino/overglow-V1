/**
 * Validate that FR/EN/ES/AR locale files have identical key structures.
 * Exit code 1 if any key is missing or empty.
 * Usage: node scripts/validateLocales.js
 */
import fs from 'fs';

const LANGS = ['fr', 'en', 'es', 'ar'];

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

const maps = {};
for (const lang of LANGS) {
  const path = `frontend/public/locales/${lang}/translation.json`;
  maps[lang] = flatten(JSON.parse(fs.readFileSync(path, 'utf8')));
}

const frKeys = Object.keys(maps.fr).sort();
let errors = 0;

console.log('Key counts:', Object.fromEntries(LANGS.map((l) => [l, Object.keys(maps[l]).length])));

for (const lang of LANGS.filter((l) => l !== 'fr')) {
  const missing = frKeys.filter((k) => !(k in maps[lang]));
  const extra = Object.keys(maps[lang]).filter((k) => !(k in maps.fr));
  const empty = frKeys.filter((k) => maps[lang][k] !== undefined && String(maps[lang][k]).trim() === '');
  if (missing.length || extra.length || empty.length) {
    errors += missing.length + extra.length + empty.length;
    console.error(`[${lang}] missing=${missing.length} extra=${extra.length} empty=${empty.length}`);
    if (missing.length) console.error('  missing sample:', missing.slice(0, 20).join(', '));
    if (extra.length) console.error('  extra sample:', extra.slice(0, 20).join(', '));
  } else {
    console.log(`[${lang}] OK — same keys as FR`);
  }
}

const emptyFr = frKeys.filter((k) => String(maps.fr[k] ?? '').trim() === '');
if (emptyFr.length) {
  errors += emptyFr.length;
  console.error(`[fr] empty values: ${emptyFr.length}`);
}

if (errors) {
  console.error(`\nFAILED: ${errors} issue(s)`);
  process.exit(1);
}

console.log(`\nPASSED: ${frKeys.length} keys synchronized across ${LANGS.join(', ')}`);
