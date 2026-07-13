# Content Authenticity Audit — [TASK-24]

**Date:** 2026-07-13  
**Scope:** Public marketing surfaces (homepage trust, destinations, affiliate, tour cards)

## Checklist

| Check | Status | Notes / action |
|-------|--------|----------------|
| Statistics have a verifiable source | **PARTIEL** | Affiliate « 50+ / 100+ » → remplacé par libellés non chiffrés (« en croissance »). Destinations = 8 (catalogue config). |
| Partner logos authorized | **N/A** | Pas de logos partenaires affichés en homepage (OK). |
| Testimonials from real customers (permission) | **FIXED** | Témoignages nominatifs affiliés **retirés** jusqu’à obtention d’autorisations écrites. |
| Pricing current and accurate | **PASS** | Prix issus des produits API / formatCurrency (pas de prix marketing inventés). |
| Destination descriptions factually OK | **PASS** | Guides DestinationPage (faits généraux Maroc / UNESCO) — à affiner avec sources locales. |
| Trustpilot / review badges link to real profiles | **PASS** | Faux Trustpilot déjà retiré (TASK-11). |
| City images unique per destination | **FIXED** | `cityMedia.js` — Marrakech / Fès / Chefchaouen / Essaouira / etc. images distinctes. |
| Fake review counts on cards | **FIXED** | `TourCard` n’affiche plus `Math.random()` — notes réelles ou « Nouveauté ». |
| Trust claims (24/7, etc.) | **FIXED** | TrustBar : « Support voyageur » (plus de 24/7 non prouvé). |
| Non-Morocco placeholder destinations on Top Destinations | **FIXED** | Paris / Rome / Vegas / NY / Dubai retirés de `destinations.js`. |

## Remaining (non-blocking)

1. Remplacer Unsplash par photos locales/WebP hébergées (CDN Overglow) quand le budget photo est prêt.
2. Collecter 3–5 témoignages opérateurs avec autorisation écrite.
3. Afficher des stats live (`count` produits / opérateurs) depuis l’API admin publique au lieu de tirets.
4. Composants legacy `WarmDestinations` / `TopAttractions` (hors Maroc) : non montés sur homepage — à supprimer ou isoler.

## Verdict

**Contenu marketing plus honnête** pour soft-launch. Claims inventés (avis fake, 50+ partenaires, témoignages) corrigés ou retirés.
