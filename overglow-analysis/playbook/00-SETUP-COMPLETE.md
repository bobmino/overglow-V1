# 00 — Setup local & VPS

## Domaine & URLs

| Usage | Valeur |
|-------|--------|
| Canonique | `https://www.overglow.online` |
| API (même host ou) | `https://www.overglow.online/api` |
| Uploads | `https://www.overglow.online/uploads/...` |
| Legacy | `overglowtrip.com` → redirect vers `.online` (Wave 3) |

## Local

```bash
npm install
cd frontend && npm install && cd ..
cp .env.example .env
cp frontend/.env.example frontend/.env
```

Vars critiques : `MONGO_URI`, `JWT_SECRET`, `PORT=5001`, `STORAGE_DRIVER=local`, `UPLOAD_DIR=uploads`, `FRONTEND_URL`, `SITE_URL`.

```bash
npm run create-admin
npm run seed:cms
node -r dotenv/config server.js   # :5001
cd frontend && npm run dev        # :5173
```

`VITE_API_URL=http://127.0.0.1:5001`  
`VITE_SITE_URL=https://www.overglow.online` (canonical même en local pour OG)

## Docker (proche prod)

```bash
docker compose up -d --build
```

Services : `mongo`, `api`, `web` (nginx). Volume `uploads_data`.

## VPS (résumé)

1. Ubuntu LTS, ufw 22/80/443, fail2ban  
2. Docker + Compose  
3. Clone repo + `.env` prod  
4. `docker compose up -d`  
5. Certbot / TLS sur nginx  
6. DNS Wave 3 → IP VPS  

Détail deploy : [07-DEPLOYMENT-CHECKLIST.md](./07-DEPLOYMENT-CHECKLIST.md).
