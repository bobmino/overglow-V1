/**
 * Smoke upload local (STORAGE_DRIVER=local) → URL /uploads/*.webp servie.
 *
 * Docker:
 *   SMOKE_ADMIN_EMAIL=... SMOKE_ADMIN_PASSWORD=... \
 *   docker compose exec -T api node -r dotenv/config scripts/smokeUploadLocal.js
 *
 * Ne committez jamais de mots de passe dans ce fichier.
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const API = process.env.SMOKE_API_URL || 'http://127.0.0.1:5001';
const EMAIL = process.env.SMOKE_ADMIN_EMAIL || 'admin@overglow.online';
const PASSWORD = process.env.SMOKE_ADMIN_PASSWORD || '';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** PNG 1×1 minimal (valide pour sharp/multer). */
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

const run = async () => {
  if (!PASSWORD) {
    console.error('SMOKE_ADMIN_PASSWORD required');
    process.exit(1);
  }

  const loginRes = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const loginData = await loginRes.json().catch(() => ({}));
  if (!loginRes.ok) {
    console.error(JSON.stringify({ step: 'login', http: loginRes.status, loginData }));
    process.exit(1);
  }
  const token = loginData.token || loginData.accessToken;
  if (!token) {
    console.error(JSON.stringify({ step: 'login', error: 'no token', keys: Object.keys(loginData) }));
    process.exit(1);
  }

  const tmp = path.join(__dirname, '.smoke-upload.png');
  fs.writeFileSync(tmp, TINY_PNG);

  const form = new FormData();
  form.append('image', new Blob([TINY_PNG], { type: 'image/png' }), 'smoke.png');

  const upRes = await fetch(`${API}/api/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const upData = await upRes.json().catch(() => ({}));
  fs.unlinkSync(tmp);

  if (!upRes.ok || !upData.url) {
    console.error(JSON.stringify({ step: 'upload', http: upRes.status, upData }));
    process.exit(1);
  }

  const publicUrl = upData.url.startsWith('http')
    ? upData.url
    : `${API}${upData.url}`;

  const getRes = await fetch(publicUrl, { method: 'GET' });
  const ok = getRes.ok && Number(getRes.headers.get('content-length') || 0) > 0;

  console.log(
    JSON.stringify(
      {
        httpUpload: upRes.status,
        url: upData.url,
        source: upData.source,
        filename: upData.filename,
        httpGet: getRes.status,
        contentType: getRes.headers.get('content-type'),
        ok,
      },
      null,
      2
    )
  );

  if (!ok) process.exit(1);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
