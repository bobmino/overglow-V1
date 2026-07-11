# Checklist go-live — Overglow Trip

À cocher avant soft launch production.

## 1. Environnement

- [ ] `.env` prod backend : `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`, `FRONTEND_URL`
- [ ] Stripe live ou test documenté : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- [ ] Frontend : `VITE_API_URL`, `VITE_STRIPE_PUBLIC_KEY`
- [ ] Cloudinary : `CLOUDINARY_*`
- [ ] Email : `RESEND_API_KEY` + `RESEND_FROM` (ou SMTP)
- [ ] Sentry : `SENTRY_DSN` + `VITE_SENTRY_DSN`
- [ ] GA4 : `VITE_GA4_MEASUREMENT_ID` (optionnel)
- [ ] PayPal : `PAYPAL_CLIENT_ID` / `SECRET` (+ `PAYPAL_MODE=live` si prod)

## 2. Paiements

- [ ] Webhook Stripe pointant vers `https://<API>/api/payments/webhook/stripe`
- [ ] Events : `payment_intent.succeeded`, `payment_intent.payment_failed`
- [ ] Test carte → booking passe à `Confirmed` / `paymentStatus: paid`
- [ ] Test virement → `PENDING_PAYMENT` → admin confirme via `/admin/pending-payments`
- [ ] Aucun mock Stripe en `NODE_ENV=production`

## 3. Contenu & accès

- [ ] Admin créé (`create-admin`)
- [ ] Catalogue minimum publié (villes cibles)
- [ ] Images Cloudinary OK (pas de 404 massifs)
- [ ] Pages `/faq`, `/terms`, `/how-it-works`, `/privacy` accessibles
- [ ] Onboarding opérateur `/operator/onboarding` + `/partners/signup`

## 4. Qualité

- [ ] Cypress critical-flow vert en local
- [ ] Smoke prod : login, search, fiche produit, checkout offline
- [ ] CORS : front Vercel autorisé ; webhooks sans Origin OK
- [ ] Rate limits actifs ; route test sync notification absente en prod

## 5. Soft launch

- [ ] Switch Stripe test → live documenté
- [ ] Monitoring Sentry 48h
- [ ] Tag git `v1.0.0-prod` après validation

## Switch Stripe test → live

1. Remplacer `sk_test_` / `pk_test_` par clés live
2. Recréer le webhook Stripe en mode live
3. Redéployer backend + frontend
4. Faire 1 paiement réel à 1 MAD / 1 EUR puis refund
