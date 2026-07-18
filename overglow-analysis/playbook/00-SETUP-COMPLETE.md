# 00 — Setup local & environnement (V1 réel)

## Prérequis

| Outil | Version |
|-------|---------|
| Node.js | 20.x recommandé |
| npm | 10.x |
| Git | 2.40+ |
| Compte MongoDB Atlas | requis |
| Cloudinary / Stripe / PayPal / CMI | selon go-live |

## Install

```bash
cd overglow-V1
npm install                 # dépendances API (racine)
cd frontend && npm install && cd ..
```

## Variables d’environnement

- Racine : copier [`.env.example`](../../.env.example) → `.env`
- Frontend : `frontend/.env.example` → `frontend/.env` (`VITE_API_URL=http://127.0.0.1:5001`)

Variables critiques : `MONGO_URI`, `MONGO_DB_NAME`, `JWT_SECRET`, `FRONTEND_URL`, `PORT` (défaut **5001**).

Paiements : `STRIPE_*`, `PAYPAL_*`, `CMI_*`, `BANK_*` — sans elles, endpoints paiement peuvent répondre 503 (comportement attendu soft-launch).

Admin bootstrap : `ADMIN_EMAIL`, `ADMIN_PASSWORD` → `npm run create-admin`.

## Seeds

| Commande | Effet |
|----------|--------|
| `npm run create-admin` | User Admin |
| `npm run seed:cms` | Blog SEO (20) + FAQ (32), idempotent |
| Admin UI « Initialiser badges » | Badges défaut + métriques |

## Run

```bash
# Terminal 1 — API
node -r dotenv/config server.js
# ou: npm run start

# Terminal 2 — SPA
cd frontend && npm run dev
```

- API : http://127.0.0.1:5001  
- SPA : http://localhost:5173  

## Smoke

```bash
node scripts/smokeAdminBo.js
```

Login : `POST /api/auth/login` (pas `/api/users/login`).

## Repo GitHub

Référence réelle du projet : organisation/compte GitHub du dépôt `overglow-V1` (ne pas utiliser des URLs `your-org` inventées).
