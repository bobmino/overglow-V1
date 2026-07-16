# Plan de situation — Overglow Trip (à jour)

**Date:** 2026-07-16  
**Branche:** `main`  
**Source de vérité:** code déployé + ce fichier.

---

## Décisions métier

- **Stripe / PayPal / CMI live** : reportés — comptes pas encore disponibles ; activer une fois la plateforme « finie ». Le code (booking différé + `bookingId`) est prêt.
- **Vercel** : OK — ne plus traiter comme bloquant.
- **Contenu** : tout le UI voyageur doit passer par i18n FR/EN/ES/AR (pas de FR en dur).
- **Devices** : mobile 375px + tablette prioritaires sur le funnel public.

---

## Ce qui est FAIT

| Domaine | Status |
|--------|--------|
| Prompts 1–19 + INT-01/02 + admin/SEO/sécurité | Fait |
| Checkout différé + Stripe `bookingId` | Fait (prêt pour clés live plus tard) |
| Cookie banner GDPR + gate GA4 | Fait |
| i18n ProductCard, TrustBar, Carousel, Destination, Date/Time, Cancellation | Fait (cette passe) |
| Polish mobile Home/Hero/Checkout/Search/Product/Payment | Fait (cette passe) |
| Micro-UX hover/press sur cards | Partiel |

---

## Ce qui RESTE

### Court terme (Cursor)
1. Poursuivre i18n restes : ReviewsList, storeCatalog curated, fallbacks ProductDetail
2. Smoke mobile 375px / tablette sur URL déployée
3. GEO-01 (villes MA + capitales) quand étude marchés fournie
4. INT-03 contenu SEO par marché

### Toi (hors code)
- 5–10 expériences réelles + opérateur
- Compte Stripe / PayPal quand plateforme stabilisée
- Pages légales avocat
- Étude marchés (UK, GCC, US, JP…) avant GEO

---

## Docs obsolètes comme « état actuel »

- Ancien constat « 0 tâche exécutée »
- Audit ESLint FAIL (corrigé)
