# Guide Opérateur — Overglow Trip

Guide pour les partenaires qui publient des expériences sur Overglow.

## S’inscrire comme opérateur

1. Créer un compte voyageur (ou se connecter).
2. Passer opérateur via inscription partenaire `/partner` ou upgrade profil.
3. Compléter l’**onboarding** / **wizard** :
   - `/operator/onboarding` ou `/operator/wizard`
   - Type de prestataire, infos publiques, photos, adresse, expériences, infos privées
   - Soumettre le dossier (`POST /api/operator/onboarding/submit`)
4. Attendre validation admin (statut Active).

> **Screenshot :** étapes du wizard + écran « dossier soumis ».

---

## Navigation

Sidebar **Overglow Opérateur** :

- Mon tableau de bord
- Mes produits
- Mes réservations (badge si en attente)
- Messages / inquiries (badge chat)
- Mes revenus (retraits)
- Mes avis (ancre dashboard)
- Mon profil

Fil d’Ariane + cloche notifications en haut.

---

## Créer / modifier un produit

1. `/operator/products` → **Créer un produit** (`/operator/products/new`)  
   ou bouton CTA sur le dashboard.
2. Renseigner titre, description, catégorie, ville, adresse, durée, prix, images.
3. Statuts :
   - **Draft** : brouillon
   - **Pending Review** : soumis à l’admin
   - **Published** : visible catalogue (après approbation)
4. Ajouter des **créneaux** (schedules) liés au produit.
5. API : `POST/PUT /api/products`, `GET /api/products/my-products`.

> **Screenshot :** formulaire produit + liste Mes produits.

---

## Gérer les réservations

1. `/operator/bookings` ou tableau du dashboard.
2. Statuts : Pending, PENDING_PAYMENT, Confirmed, Cancelled.
3. Actions opérateur (selon droits) : notes, marquer traité (`PUT /api/bookings/:id/note`, `/handle`).
4. Contacter le client via messages / WhatsApp si renseigné.

> **Screenshot :** liste réservations avec filtres.

---

## Paiements (côté voyageur — ce que vous devez savoir)

Les voyageurs paient via :

| Méthode | Notes |
|---------|--------|
| Stripe | Carte, confirmation webhook |
| PayPal | Order + capture |
| CMI | Init paiement local |
| Virement / cash | Confirmation manuelle admin |

Vous n’avez pas à configurer Stripe côté opérateur pour recevoir les réservations plateforme : les encaissements passent par Overglow ; vous retirez vos gains ensuite.

Activation PSP globale : paramètres **admin** (onglet Paiements).

---

## Avis

- Les clients notent après réservation confirmée.
- Vous recevez une notification `new_review` (et `low_rating` si ≤ 2★).
- Répondre : `POST /api/reviews/:id/response` (réponse opérateur publique).
- Surveiller la note moyenne : impact badges & conversion.

> **Screenshot :** avis produit avec « Réponse de l’opérateur ».

---

## Retirer ses gains

1. `/operator/withdrawals` — consulter le **solde** (`GET /api/withdrawals/balance`).
2. Créer une demande `operator_payout` avec montant + moyen (virement / PayPal / Stripe).
3. Suivre le statut : Pending → Approved → Processed (ou Rejected + motif).
4. Respecter les seuils admin (`minWithdrawalAmountMad`, délais).

> **Screenshot :** solde disponible + formulaire de retrait.

---

## Messages & demandes

- `/operator/inquiries` : questions voyageurs sur vos produits.
- Répondre aux inquiries manuelles ; approuver / rejeter les automatiques si applicable.
- Chat support via inbox messages.

---

## Bonnes pratiques

- Photos haute qualité (upload Cloudinary via `/api/upload/...`).
- Prix et créneaux à jour.
- Répondre vite aux messages (métriques badges).
- Soumettre les produits complets pour accélérer la modération.

## Liens

- [`API-REFERENCE.md`](./API-REFERENCE.md) — endpoints Operator / Products / Withdrawals
- [`GUIDE-TRAVELER.md`](./GUIDE-TRAVELER.md) — parcours client
- [`DATA-MODEL.md`](./DATA-MODEL.md) — Product, Booking, Operator
