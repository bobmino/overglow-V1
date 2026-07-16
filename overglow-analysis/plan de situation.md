# Plan de situation — Overglow Trip

**Date:** 2026-07-16  
**Branche:** `main`  
**Verdict:** **PRÊT POUR DÉPLOIEMENT** (soft-launch code + CMS seedé)

---

## Décisions métier (hors code — à toi)

- Stripe / PayPal / CMI **live** : activer quand comptes prêts (code booking différé déjà en place)
- 5–10 expériences réelles + opérateur en DB
- Pages légales avocat

---

## Livré côté code (go-live)

| Domaine | Status |
|--------|--------|
| Prompts 1–19 + INT-01/02/03 Wave 1 | Fait |
| Avis / annulation 100 % DB + filtres | Fait |
| Checkout différé + cookies GDPR | Fait |
| Phase 0–1 fondations / sécu | Fait |
| **CMS seed blog + FAQ (Mongo)** | **Fait** — 20 articles (FR/EN/ES/AR), 32 FAQ |
| **BO menus Admin/Opérateur restructurés** | **Fait** — Ops / Contenu / Confiance / Finance / People |
| Admin FAQ + seed boutons Blog/FAQ | Fait |
| Footer pages (safety, careers, press, cookies, a11y, operator help/resources) | Fait — contenu honnête, pas de faux jobs / faux sociaux |
| Benchmark BO marché | `BACKOFFICE-BENCHMARK.md` |

---

## Seed CMS (déjà exécuté sur Mongo connecté)

```bash
npm run seed:cms
# ou en prod une fois admin connecté :
# POST /api/blog/admin/initialize
# POST /api/faq/admin/initialize
```

Fix appliqué : index texte Mongo ne doit plus utiliser `language` comme override (casse le seed `ar`).

---

## Post-deploy (ops, pas bloquant code)

1. Vérifier Vercel Ready + smoke mobile 375px + `/fr/blog` + `/fr/faq`
2. Config env prod : Stripe/PayPal quand dispo, Sentry DSN, `PAYPAL_WEBHOOK_ID`
3. Soumettre sitemap Search Console
4. Remplacer emails génériques (hello@, press@) par boîtes réelles si besoin
