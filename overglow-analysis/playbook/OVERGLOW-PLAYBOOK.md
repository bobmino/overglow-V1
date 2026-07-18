# OVERGLOW TRIP V1 — Master Playbook

Point d’entrée unique pour humains et agents. Si un doc du pack contredit le **code** ou `plan de situation.md`, le code + plan de situation gagnent.

---

## 1. Qu’est-ce que c’est

Marketplace **voyageurs ↔ opérateurs locaux** (produits/expériences au Maroc).  
Stack : **Express + Mongoose** (API :5001) + **React 19 / Vite** (SPA) + **MongoDB Atlas** + Cloudinary + i18n **FR/EN/ES/AR**.  
Déploiement typique : frontend Vercel + API Node (Vercel serverless ou host Node).

**Ce n’est pas** : un catalogue Next.js « trips », ni Stripe Connect « déjà live » à 100 %.

---

## 2. Statut (2026-07)

| Domaine | État |
|--------|------|
| Catalogue produits / opérateurs / bookings | En place |
| i18n public + RTL AR | En place |
| Soft-launch hardening (sécu, headers, toasts) | En place |
| CMS blog (20) + FAQ (32) seed Mongo | En place (`npm run seed:cms`) |
| BO direction UX P0 (badges, edit produits/opérateurs, FAQ CRUD) | En place — voir `../BACKOFFICE-UX-AUDIT.md` |
| Avis / annulation 100 % DB | En place |
| Paiements Stripe/PayPal/CMI **live** | **Reportés** (code différé prêt ; activer avec comptes) |
| Contenu réel 5–10 expériences + pages légales avocat | Ops / métier |

Détail court : [`../plan de situation.md`](../plan%20de%20situation.md).

---

## 3. Architecture (réelle)

```
Browser (Vite SPA)
  ├─ /{fr|en|es|ar}/*     public + LocalizedLink
  ├─ /admin/*             AdminRoute + DashboardShell
  └─ /operator/*          OperatorRoute + DashboardShell
         │
         ▼  axios → VITE_API_URL
Express (server.js)  /api/auth|products|bookings|admin|payments|faq|blog|…
         │
         ├─ MongoDB Atlas
         ├─ Cloudinary (images)
         ├─ Stripe / PayPal / CMI (si env)
         ├─ Email (Resend et/ou SMTP)
         └─ Sentry / Upstash (optionnel)
```

---

## 4. Carte des documents

| Fichier | Rôle |
|---------|------|
| [00-SETUP-COMPLETE.md](./00-SETUP-COMPLETE.md) | Install local, env, seeds |
| [01-CURSOR-CONFIGURATION.md](./01-CURSOR-CONFIGURATION.md) | Rules `.mdc`, usage agents |
| [02-TECH-STACK-DECISIONS.md](./02-TECH-STACK-DECISIONS.md) | Choix stack **réels** vs dette |
| [03-GDPR-COMPLIANCE.md](./03-GDPR-COMPLIANCE.md) | Cookies, privacy, droits |
| [04-PAYMENT-SETUP.md](./04-PAYMENT-SETUP.md) | Stripe / PayPal / CMI / différé |
| [05-TESTING-STRATEGY.md](./05-TESTING-STRATEGY.md) | Smoke API, manuels BO, CI |
| [06-AUDIT-PLANS.md](./06-AUDIT-PLANS.md) | Checklists sécu / perf / a11y |
| [07-DEPLOYMENT-CHECKLIST.md](./07-DEPLOYMENT-CHECKLIST.md) | Soft-launch deploy |
| [08-POST-LAUNCH-MONITORING.md](./08-POST-LAUNCH-MONITORING.md) | Sentry, uptime, incidents |
| [../BACKOFFICE-UX-AUDIT.md](../BACKOFFICE-UX-AUDIT.md) | UX BO direction |
| `.cursor/rules/*.mdc` | Règles agent Cursor |

---

## 5. Quick start

```bash
git clone <repo> && cd overglow-V1
npm install
cd frontend && npm install && cd ..
cp .env.example .env          # remplir MONGO_URI, JWT_SECRET, …
cp frontend/.env.example frontend/.env
npm run create-admin          # si besoin
npm run seed:cms              # blog + FAQ
node -r dotenv/config server.js   # API :5001
cd frontend && npm run dev        # :5173
```

Smoke admin API (serveur up) : `node scripts/smokeAdminBo.js`.

---

## 6. Priorités soft-launch

1. Contenu réel (produits + opérateur) en DB  
2. Env prod paiements **quand comptes prêts**  
3. Smoke UI admin + parcours booking différé  
4. Seed CMS prod si collections vides  
5. Sitemap / Search Console  

Hors scope immédiat : calendrier type Booking Extranet, multi-rôles admin granulaires, app mobile Pulse.

---

## 7. Décisions figées (ne pas « re-décider » en chat)

- JS pas TS ; Vite SPA pas Next obligatoire  
- Rôles Admin / Opérateur / Client  
- 4 langues FR/EN/ES/AR  
- Contenu confiance (avis, FAQ, blog) = Mongo  
- Pas de fake social proof  
