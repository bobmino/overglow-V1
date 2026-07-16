# Benchmark back-offices marketplace → Overglow

Référence marché (Booking Extranet, Airbnb Host, Stripe Dashboard) et mapping sur notre BO.

## Comment les plateformes structurent leur BO

| Zone | Booking Extranet | Airbnb Host | Stripe Dashboard | Overglow (cible) |
|------|------------------|-------------|------------------|------------------|
| **Ops du jour** | Accueil + alertes, Réservations, Inbox | Aujourd’hui, Réservations, Messages | Home, Payments, Customers | Dashboard, Réservations, Messages, Analytics |
| **Inventaire / contenu** | Calendrier, tarifs, fiche établissement | Annonces, calendrier, prix | Products (Billing) | Produits, Blog, FAQ, Badges |
| **Confiance** | Avis, litiges, qualité | Avis, Superhost | Disputes, Radar | Avis, Demandes opérateurs, Badges |
| **Finance** | Finance, factures, promotions | Gains, versements | Balances, Payouts, Reports | Finances, Paiements en attente, Retraits |
| **Personnes** | Comptes utilisateurs (rôles) | Co-hôtes | Team, Settings | Utilisateurs, Opérateurs |
| **Config** | Propriété, politiques, connectivité | Paramètres compte | Settings, Developers | Paramètres |

### Principes communs (à garder)

1. **Séparer voyageur / partenaire / admin** — jamais mélanger les menus.
2. **Ops en premier** — ce qui génère du CA aujourd’hui (bookings, messages).
3. **Contenu vs confiance** — publier ≠ modérer.
4. **Finance isolée** — payouts et pending payments à part.
5. **Aide contextuelle** — liens Help / Resources dans le shell partenaire (comme Extranet Help).
6. **Pas de faux liens** — sociaux / KPIs uniquement s’ils sont réels.

## Mapping Overglow livré

### Admin (`/admin/*`)

```
Opérations     → dashboard, bookings, chat, analytics
Contenu        → products, blog, faq, badges
Confiance      → reviews, approval-requests, badge-requests
Finance        → finance, pending-payments, withdrawals
Personnes      → users, operators
Configuration  → settings
```

### Opérateur (`/operator/*`)

```
Activité       → dashboard, products, bookings, inquiries, analytics, withdrawals
Compte & aide  → profile, help, resources
```

## Contenu CMS (base de données)

| Source | Collection | Seed | Admin |
|--------|------------|------|-------|
| Blog SEO | `blogs` | `npm run seed:cms` ou `POST /api/blog/admin/initialize` | `/admin/blog` |
| FAQ | `faqs` | idem + `POST /api/faq/admin/initialize` | `/admin/faq` |
| Avis | `reviews` (status Approved) | pas de fake | `/admin/reviews` |
| About / Culture | fichier éditorial / API content | hors blog | — |

## Écarts vs Booking/Airbnb (roadmap, pas bloquant soft-launch)

- Calendrier dispo multi-créneaux type Extranet (partiel côté produits).
- Rôles granulaires Primary / Admin / User (aujourd’hui Admin vs Operator).
- App mobile Pulse-like (hors scope V1).
- Forum communauté opérateurs (page « bientôt » honnête).
