# Plan de situation — Overglow Trip (à jour)

**Date:** 2026-07-16  
**Branche:** `main`  
**Source de vérité:** code déployé + ce fichier (remplace l’ancien constat « l’app n’a pas bougé »).

---

## Ce qui est FAIT

| Domaine | Status |
|--------|--------|
| Prompts 1–19 + hotfixes S0–S2 | Fait |
| i18n FR/EN/ES/AR + RTL | Fait |
| INT-01 routes `/{lang}` | Fait |
| INT-02 SEOHead / hreflang / sitemap | Fait |
| Admin + opérateur (sidebar, finance, bookings, chat, DataTable…) | Fait |
| Sécurité P0 (CORS, uploads, sanitizer, payment sim guard, logger) | Fait |
| Emails Handlebars FR/EN | Fait |
| ESLint 0 erreur | Fait |
| Empty states unifiés | Fait |
| **Vercel deploys** | OK (confirmé métier — ne plus traiter comme bloquant) |
| Cookie banner GDPR + gate GA4 | En cours / livré ce sprint |
| Checkout Stripe `bookingId` avant PaymentIntent | En cours / livré ce sprint |

---

## Ce qui RESTE (priorité business)

### Sprint 1 (cette semaine) — en cours
1. ~~Corriger Vercel~~ → **zappé (OK)**
2. Smoke E2E manuel sur URL déployée : search → produit → booking → paiement → confirmation
3. Cookie banner + consent analytics → **code livré**
4. Fix flux Stripe (booking différé + `bookingId`) → **code livré**
5. 5–10 expériences réelles + opérateur Stripe (contenu métier, hors code)

### Sprint 2
- Stripe live keys + webhook test carte réelle
- Polish mobile 375px + micro-interactions
- GEO-01 API villes MA + capitales marchés (si étude fournie)

### Sprint 3
- Pages légales validées avocat
- `strict: true` Product, PayPal webhook verify, PII encryption
- INT-03 contenu SEO par marché

---

## Ce que TU prépares (non-code)

- Clés Stripe test/live + webhook URL
- Contenu catalogue réel (photos, prix, dispos)
- Entité légale / IBAN / TVA pour go-live marketing
- Étude marchés (capitales) **uniquement avant GEO-01**

---

## Docs à ignorer comme « état actuel »

- Ancien `plan de situation` (« 0 tâche exécutée ») — **obsolète**
- `FINAL_AUDIT_REPORT` ESLint FAIL — **obsolète** (corrigé depuis)
