# OVERGLOW TRIP V1 — Master Playbook

Point d’entrée unique. Si un doc contredit le **code** ou `plan de situation.md`, le code gagne.

---

## 1. Produit

Marketplace **voyageurs ↔ opérateurs** (expériences Maroc).  
Stack cible souveraine : **Express + Mongo (Docker VPS) + React/Vite + nginx + uploads locaux**.  
i18n **FR/EN/ES/AR**. Domaine canonique : **`https://www.overglow.online`**.

---

## 2. Statut & cap finalisation

| Domaine | État |
|--------|------|
| App métier (catalogue, bookings, BO CRUD) | En place |
| Paiements live Stripe/PayPal/CMI | **Reportés** — code différé OK ; clés en Wave 3 |
| Cloudinary | **Abandonné** — `STORAGE_DRIVER=local` → disque VPS |
| Hébergement | Cible **VPS** (pas dépendance Vercel long terme) |
| Domaine / DNS | `overglow.online` — DNS Wave 3 |
| CI/CD | GitHub Actions + Docker Compose (repo) |
| Charte / nav / BO skin / onboarding / Help | Wave 2 UX |

Détail : [`../plan de situation.md`](../plan%20de%20situation.md) · Feuille de route finalisation (plan Cursor).

---

## 3. Architecture cible (souveraineté)

```
Internet → nginx (TLS www.overglow.online)
              ├─ /          → SPA (frontend/dist)
              ├─ /api       → Node API (server.js)
              └─ /uploads   → volume disque persistant
                    │
              Docker Compose
              ├─ api
              ├─ mongo
              └─ (optionnel) mail relay
```

---

## 4. Carte documents playbook

| Fichier | Rôle |
|---------|------|
| [00-SETUP-COMPLETE.md](./00-SETUP-COMPLETE.md) | Local + VPS |
| [01-CURSOR-CONFIGURATION.md](./01-CURSOR-CONFIGURATION.md) | Rules agents |
| [02-TECH-STACK-DECISIONS.md](./02-TECH-STACK-DECISIONS.md) | Stack réel + dette |
| [03-GDPR-COMPLIANCE.md](./03-GDPR-COMPLIANCE.md) | Privacy |
| [04-PAYMENT-SETUP.md](./04-PAYMENT-SETUP.md) | Paiements différés → live |
| [05-TESTING-STRATEGY.md](./05-TESTING-STRATEGY.md) | Smoke / CI |
| [06-AUDIT-PLANS.md](./06-AUDIT-PLANS.md) | Checklists |
| [07-DEPLOYMENT-CHECKLIST.md](./07-DEPLOYMENT-CHECKLIST.md) | Deploy VPS |
| [08-POST-LAUNCH-MONITORING.md](./08-POST-LAUNCH-MONITORING.md) | Ops |
| [09-MAIL-DNS.md](./09-MAIL-DNS.md) | SMTP + SPF/DKIM |
| [10-WAVE3-GOLIVE.md](./10-WAVE3-GOLIVE.md) | DNS + secrets bloc |
| [11-BRAND-TOKENS.md](./11-BRAND-TOKENS.md) | Charte UI tokens |

---

## 5. Quick start local

```bash
npm install && cd frontend && npm install && cd ..
cp .env.example .env
# STORAGE_DRIVER=local  MONGO_URI=...  JWT_SECRET=...
npm run create-admin
npm run seed:cms
node -r dotenv/config server.js
cd frontend && npm run dev
```

Docker (proche prod) : `docker compose up -d` (voir `docker-compose.yml`).

---

## 6. Waves (rappel)

0. Docs décisions (fait dans ce playbook)  
1. Infra VPS + uploads locaux + CI  
2. UX charte / nav / BO / onboarding / Help  
3. DNS + secrets + smoke (+ paiements si comptes)  

**Fable** : audit UX optionnel *après* staging sur `overglow.online`, pas avant.
