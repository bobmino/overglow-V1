# Plan de situation — Overglow Trip V1

**Date:** 2026-07-18  
**Branche:** `main`  
**Verdict:** Soft-launch ops live ; BO MAD/peau + catalogue 8 produits prod + harden deploy

---

## Point d’entrée docs

| Doc | Rôle |
|-----|------|
| [playbook/OVERGLOW-PLAYBOOK.md](./playbook/OVERGLOW-PLAYBOOK.md) | Master playbook |
| [playbook/10-WAVE3-GOLIVE.md](./playbook/10-WAVE3-GOLIVE.md) | DNS + secrets + smoke |
| [deploy/OPS-VPS.md](../deploy/OPS-VPS.md) | Backup, Certbot, Resend, seed catalogue |
| [BACKOFFICE-UX-AUDIT.md](./BACKOFFICE-UX-AUDIT.md) | UX back-office |
| `.cursor/rules/*.mdc` | Règles agents |

---

## Décisions figées

| Sujet | Décision |
|-------|----------|
| Domaine | `https://www.overglow.online` |
| Infra | VPS Docker (api + web + mongo + uploads) |
| Médias | `STORAGE_DRIVER=local` |
| Mail | Resend SMTP (`noreply@overglow.online`) |
| Paiements | Différés jusqu’aux comptes |
| CI/CD | GitHub Actions Deploy VPS (clé SSH en base64) |

---

## Wave 3 ops — statut

| Item | Status |
|------|--------|
| DNS A @ + www → VPS | Fait |
| TLS Let’s Encrypt | Fait |
| CI/CD Deploy | Fait |
| Admin + seed CMS FAQ/blog | Fait |
| Resend SMTP | Fait (clé rotée) |
| Seed catalogue Maroc (`npm run seed:catalog`) | Fait en prod (8 produits, opérateur Active) |
| Backup cron Mongo/uploads | Installé + test OK (cron 03:15 → `/root/backups/overglow/`) |
| Certbot renew hooks | Installés + `certbot renew --dry-run` OK |
| Paiements live | Reporté (différé assumé) |
| Audit Fable | Non prévu |

---

## Code récent

| Domaine | Status |
|--------|--------|
| BO MAD + surface-card + titres shell i18n | Fait |
| Onboarding 3 étapes / LocalizedLink / FAQ | Fait |
| Uploads locaux + Docker | Fait |

---

## Accès soft-launch

| Compte | Email | Note |
|--------|-------|------|
| Admin | `admin@overglow.online` | Changer le mdp après soft-launch |
| Opérateur seed | `partenaire@overglow.online` | Compte catalogue démo |

## Ops manuels restants

1. Changer mdp admin (et partenaire seed) en prod
2. Si 502 / stack down : Actions → **Deploy VPS**, ou sur VPS :
   `cd ~/overglow-V1 && git fetch && git reset --hard origin/main && docker compose up -d --build && bash deploy/post-deploy-harden.sh`
3. Remplacer WebP villes démo par **vos** photos métier (upload BO → `/uploads/...`)

## Soft-launch vérifié (2026-07-18)

| Check | Résultat |
|-------|----------|
| Domaines legacy → `www.overglow.online` | Fait (code runtime) |
| Images catalogue locales `/images/cities/*` | Fait (8/8, HTTP 200 WebP) |
| Booking différé API (`deferPayment`) | OK — `PENDING_PAYMENT` |
| Homepage sections catalogue | OK (destinations + expériences) |
| Mongo TX / replica set `rs0` | **Déployé prod** — `rs.status().set = rs0`, `DISABLE_MONGO_TX=false` |
| Booking différé + TX rs0 | OK smoke API (`PENDING_PAYMENT`, 201) |

## P0 images — statut

| Item | Status |
|------|--------|
| Assets `frontend/public/images/cities/*.webp` (39) | En prod |
| Mapping slug → galeries (`syncCatalogLocalImages.js`) | Prêt local ; sync déjà appliqué une fois en prod |
| Volume Docker `uploads/` | Quasi vide — **pas** la source catalogue soft-launch |
| Photos métier réelles via BO | Optionnel post soft-launch (remplace les WebP villes) |

## Prochaines tâches (estimations)

| # | Tâche | Temps | Qui | Priorité |
|---|--------|-------|-----|----------|
| 1 | Changer mdp admin + partenaire | 10 min | Toi | P0 |
| 2 | Smoke UI booking (date → panier → cash pickup → success) | 45 min | Toi | P1 |
| 3 | Mentions légales / CGU avocat `@overglow.online` | 2–4 h | Toi | P1 |
| 4 | Deploy replica set Mongo rs0 | ~~fait~~ (2026-07-18) | Agent | Done |
| 5 | Sync images locales + smoke booking TX | ~~fait~~ | Agent | Done |
| 6 | Photos métier réelles (upload BO → `/uploads/...`) | 1–2 h | Toi | Post-launch |
| 7 | Paiements live (Stripe/CMI) quand comptes OK | 1–3 j | Différé | — |
| 8 | Décision marque `overcom.online` vs `overglow.online` (voir § ci-dessous) | 2–4 h si migrate | Toi | Décision |

## Décision marque : `overcom.online` vs `overglow.online`

**État actuel (ne pas casser)**  
- Marketplace live = **Overglow Trip** sur `https://www.overglow.online`  
- DNS, TLS, CORS, Resend prod, CI Deploy = tous câblés sur `overglow.online`  
- Comptes seed = `@overglow.online`

**Ce que signifie `overcom.online`**  
- Marque **agence** (Overcom), distincte du produit marketplace  
- Si tu bascules le site réservation dessus, ce n’est pas un rename cosmétique : DNS A/AAAA, Certbot, `FRONTEND_URL` / `SITE_URL` / `CORS`, rebuild Docker web, emails Resend (domaine vérifié), admin emails, redirects 301 depuis `overglow.online`

**3 options**

| Option | Quand | Effort |
|--------|--------|--------|
| **A. Statu quo** — marketplace = `overglow.online` ; Overcom = site agence à part | Soft-launch / clarté produit | 0 |
| **B. Dual** — `overglow.online` = booking ; `overcom.online` = agence (landing) | Tu veux les 2 marques | 1–2 j (2e site ou pages) |
| **C. Migration** — tout le booking vers `overcom.online` | Une seule marque publique | 2–4 h ops + emails + 301 |

**Reco CTO** : rester en **A** jusqu’après soft-launch + smoke UI. Ne migrate (C) que si la marque client-facing doit être Overcom partout.  
Si ton `.env` local pointe Resend vers `@overcom.online`, aligne-le sur le domaine **vérifié** chez Resend (prod = `@overglow.online`).
