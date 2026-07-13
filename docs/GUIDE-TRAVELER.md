# Guide Voyageur — Overglow Trip

Comment découvrir, réserver et profiter d’expériences authentiques au Maroc.

## Rechercher et réserver

1. Accueil : layout éditorial + recherche (`GET /api/homepage/layout`, `/api/search/...`).
2. Affiner via facets (ville, catégorie, prix) : `/api/search/advanced`.
3. Ouvrir une fiche produit : créneaux, avis, badges authenticité.
4. Choisir date / horaire / nombre de places → checkout.
5. Compte requis pour finaliser (ou guest selon parcours `orders/checkout`).

> **Screenshot :** résultats de recherche + fiche produit avec créneaux.

---

## Moyens de paiement

| Méthode | Usage |
|---------|--------|
| **Carte (Stripe)** | Paiement immédiat |
| **PayPal** | Compte PayPal |
| **CMI** | Cartes locales (si activé) |
| **Virement bancaire** | Coordonnées via `/api/payments/bank-details` ; confirmation admin |
| **Cash pickup / delivery** | Paiement hors ligne ; statut PENDING_PAYMENT |

Conversion devises : `GET /api/payments/convert-to-mad`.

Après paiement réussi → réservation **Confirmed** + e-mail / notification.

> **Screenshot :** étape paiement checkout (choix des méthodes).

---

## Annulation & remboursement

1. Espace `/dashboard` → Mes réservations.
2. Demande d’annulation : `POST /api/bookings/:id/cancel`.
3. Estimation remboursement : `GET /api/bookings/:id/refund-calculation`.
4. Traitement admin si besoin (`process-refund`).
5. Politique exacte : dépend du produit / délai avant l’activité (affichée au checkout et CGV).

> **Screenshot :** écran calcul de remboursement.

---

## Favoris et avis

### Favoris
- Cœur sur une fiche → `POST /api/favorites`.
- Listes, alertes prix, partage : `/favorites`, `/api/favorites/...`.

### Avis
- Après une réservation **Confirmed**, noter le produit (1–5★ + commentaire + photos).
- Modération possible (Pending → Approved).
- Voter utile / signaler : endpoints `/api/reviews/:id/vote|report`.

> **Screenshot :** formulaire d’avis + breakdown des notes sur la fiche.

---

## Programme de fidélité

- Statut points : `GET /api/loyalty/status`.
- Historique : `/api/loyalty/history`.
- Échanger des points : `POST /api/loyalty/redeem`.
- Page UI : parcours Loyalty (si activé dans le menu compte).

Les points s’accumulent typiquement après réservations confirmées (règles côté backend).

---

## Compte & notifications

- Profil : `/profile` (langue, infos personnelles).
- Notifications in-app (cloche) : nouvelles réservations liées, réponses, etc.
- Chat support : conversation avec l’équipe Overglow.
- Historique de consultation : `/view-history`.

---

## Aide

- FAQ publique (`/faq`, `/api/faq`).
- Centre d’aide / CGV / Confidentialité (footer).
- Contacter le support via chat ou e-mail plateforme.

## Liens

- [`API-REFERENCE.md`](./API-REFERENCE.md)
- [`GUIDE-OPERATOR.md`](./GUIDE-OPERATOR.md) — si vous devenez partenaire
