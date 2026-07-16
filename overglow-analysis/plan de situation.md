# Plan de situation — Overglow Trip (à jour)

**Date:** 2026-07-16  
**Branche:** `main`  
**Source de vérité:** code déployé + ce fichier.

---

## Décisions métier

- **Stripe / PayPal / CMI live** : reportés — comptes pas encore disponibles ; activer une fois la plateforme « finie ». Le code (booking différé + `bookingId`) est prêt.
- **Vercel** : OK — ne plus traiter comme bloquant.
- **Contenu** : UI voyageur via i18n FR/EN/ES/AR ; avis / notes / annulation **uniquement DB** (pas de fake).
- **Devices** : mobile 375px + tablette prioritaires sur le funnel public.

---

## Ce qui est FAIT

| Domaine | Status |
|--------|--------|
| Prompts 1–19 + INT-01/02 + admin/SEO/sécurité | Fait |
| Checkout différé + Stripe `bookingId` | Fait (prêt pour clés live plus tard) |
| Cookie banner GDPR + gate GA4 | Fait |
| i18n conversion surfaces + polish mobile | Fait |
| Avis + annulation 100 % DB + filtres `cancellationType` | Fait (`0af49d4`) |
| INT-03 Wave 1 (blog language + seed SEO multi-langue + destinations sans FR hardcodé) | En cours / commit suivant |

---

## Ce qui RESTE

### Court terme (Cursor)
1. Déployer seed blog INT-03 en prod (`POST /api/blog/admin/initialize` côté admin)
2. Smoke mobile 375px / tablette sur URL déployée
3. GEO-01 (villes MA + capitales) quand étude marchés fournie
4. Enrichir guides destinations dans les locales (optionnel)

### Toi (hors code)
- 5–10 expériences réelles + opérateur
- Compte Stripe / PayPal quand plateforme stabilisée
- Pages légales avocat
- Étude marchés (UK, GCC, US, JP…) avant GEO

---

## Docs obsolètes comme « état actuel »

- Ancien constat « 0 tâche exécutée »
- Audit ESLint FAIL (corrigé)
