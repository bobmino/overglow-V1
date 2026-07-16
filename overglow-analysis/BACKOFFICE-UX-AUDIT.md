# Back-office UX Audit — Overglow Trip

**Date:** 2026-07-16  
**Objectif:** qualité d’usage direction (pas un benchmark théorique).

## Verdict

| Zone | Avant | Après (ce lot) |
|------|-------|----------------|
| Badges | Approve ne poussait pas le badge manuel ; critères non rechargés ; pas de retrait | Approve → assign DB ; edit critères + isActive ; filtres ; unassign ; réactivation ; historique demandes ; toasts ; compteur sidebar |
| Produits | Voir / statut / assign seulement | **Éditer** `/admin/products/:id/edit` ; recherche ; pagination ; toasts |
| Opérateurs | Modal lecture seule + statut | **PUT fiche** (company, phone, notes, location, auto-approve) ; lien produits ; actions directes |
| FAQ | Seed + delete | **Créer / éditer / activer-désactiver** (Mongo, anti-doublon question+langue) |
| Listes | `alert` / recherche users morte | Toasts ; recherche users branchée ; compteurs reviews + badge-requests |

## Checklist pass/fail

| Parcours | Status | Notes |
|----------|--------|-------|
| Login admin → dashboard | Pass API | `POST /api/auth/login` OK |
| Badges list + create + edit critères | Pass | 18 badges après initialize |
| Badges assign / unassign | Pass API | assigned:1 puis removed:1 |
| Badge request approve → `product.badges` | Pass code | Fix critique Mongo |
| Produits éditer + republier | Pass code | Route admin + formulaire |
| Opérateurs éditer fiche | Pass API | PUT notes/phone OK |
| FAQ CRUD | Pass API | create 201 + delete 200 |
| Pas de faux KPIs / fake seed avis | Pass | Avis restent DB only |

## Source de vérité

Tout le contenu opérationnel (badges, FAQ, produits, opérateurs, demandes) passe par **MongoDB**. Les seeds (`npm run seed:cms`, initialize badges/FAQ) sont **idempotents** (skip doublons).

## Hors scope (volontaire)

- Calendrier Extranet, multi-rôles Admin granulaires, redesign visuel total du shell.

## Remplace

L’ancien `BACKOFFICE-BENCHMARK.md` (mapping Booking/Airbnb) est obsolète comme livrable UX — ce fichier est la référence actionnable.
