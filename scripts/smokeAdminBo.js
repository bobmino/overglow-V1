/**
 * Smoke test admin BO APIs (login + key routes).
 * Usage: node scripts/smokeAdminBo.js
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const base = process.env.API_URL || `http://127.0.0.1:${process.env.PORT || 5001}`;
const email = process.env.ADMIN_EMAIL || 'admin@overglow.online';
const password = process.env.ADMIN_PASSWORD || 'admin123';

const main = async () => {
  console.log('Base', base, 'as', email);
  const loginRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const login = await loginRes.json().catch(() => ({}));
  if (!login.token) {
    console.error('LOGIN FAIL', loginRes.status, login);
    process.exit(1);
  }
  console.log('LOGIN OK');

  const h = { Authorization: `Bearer ${login.token}`, 'Content-Type': 'application/json' };
  const checks = [
    ['GET', '/api/admin/badges'],
    ['GET', '/api/admin/products?page=1&limit=5'],
    ['GET', '/api/admin/operators'],
    ['GET', '/api/faq/admin/all?limit=5'],
    ['GET', '/api/badge-requests/admin/pending-count'],
    ['GET', '/api/badge-requests/admin/all?status=all'],
    ['GET', '/api/admin/reviews?status=Pending&limit=1'],
  ];

  let failed = 0;
  for (const [method, pathName] of checks) {
    const res = await fetch(`${base}${pathName}`, { method, headers: h });
    const text = await res.text();
    let summary = text.slice(0, 80);
    try {
      const j = JSON.parse(text);
      summary = Array.isArray(j)
        ? `arr:${j.length}`
        : Object.keys(j).slice(0, 6).join(',');
    } catch {
      /* keep */
    }
    const ok = res.status >= 200 && res.status < 300;
    if (!ok) failed += 1;
    console.log(ok ? 'OK' : 'FAIL', method, pathName, res.status, summary);
  }

  // FAQ create + delete roundtrip (no duplicate pollution: unique question)
  const q = `Smoke FAQ ${Date.now()}`;
  const createRes = await fetch(`${base}/api/faq`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify({
      question: q,
      answer: 'Réponse smoke test',
      category: 'general',
      language: 'fr',
      order: 999,
      isActive: true,
    }),
  });
  const created = await createRes.json().catch(() => ({}));
  console.log(createRes.ok ? 'OK' : 'FAIL', 'POST /api/faq', createRes.status, created._id || created.message);
  if (!createRes.ok) failed += 1;
  if (created._id) {
    const del = await fetch(`${base}/api/faq/${created._id}`, { method: 'DELETE', headers: h });
    console.log(del.ok ? 'OK' : 'FAIL', 'DELETE /api/faq', del.status);
    if (!del.ok) failed += 1;
  }

  if (failed) {
    console.error(`FAILED ${failed} checks`);
    process.exit(1);
  }
  console.log('ALL SMOKE CHECKS PASSED');
};

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
