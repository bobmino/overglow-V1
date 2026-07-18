# 10 — Wave 3 Go-Live (ops en bloc)

**Pas de secrets dans git.** Détail VPS : [`deploy/OPS-VPS.md`](../../deploy/OPS-VPS.md).

## 1. DNS

- [x] `A` : `overglow.online` → `185.194.217.60`
- [x] `A` : `www.overglow.online` → `185.194.217.60`
- [x] Redirect HTTP→HTTPS, apex→www
- [ ] (Option) `api.overglow.online` si split static/API
- [ ] Ancien domaine : 301 → `https://www.overglow.online` (si conservé)

## 2. Secrets prod

- [x] JWT + MONGO Docker + SITE_URL / FRONTEND_URL / CORS
- [x] `STORAGE_DRIVER=local`
- [x] EMAIL Resend SMTP (`noreply@overglow.online`)
- [x] Rotation clé Resend faite
- [ ] SENTRY_DSN
- [ ] Paiements : laisser différé tant que comptes absents

## 3. Données

- [x] Admin + seed CMS FAQ/blog
- [x] Catalogue : 8 produits Maroc seedés (MAD) via post-deploy — smoke `/api/products` OK
- [ ] Mentions légales / CGU email `@overglow.online` (avocat)

## 4. Paiements

- [x] Différé assumé + FAQ à jour
- [ ] Live Stripe/PayPal/CMI quand comptes OK

## 5. Smoke

- [x] HTTPS home
- [x] Upload image → `/uploads/{uuid}.webp` (smoke API + HTTPS 200, 2026-07-18)
- [x] Booking différé API + TX rs0
- [~] Booking UI E2E (cash) — MAD fix + race succès corrigés ; retest écran succès
- [x] BO login
- [x] Mail SMTP configured successfully
- [x] AR RTL smoke (`/ar` → `dir=rtl`, UI arabe OK)
- [x] CI Deploy VPS vert
- [x] Backup cron installé + test manuel OK (`/root/backups/overglow/`)
- [x] Certbot renew hooks + `certbot renew --dry-run` OK

## 6. Critère Done

Site HTTPS sur **overglow.online**, app+DB+médias sur **votre** VPS, CI deploy, charte/nav/BO/onboarding/Help OK, paiements live **ou** différé documenté.
