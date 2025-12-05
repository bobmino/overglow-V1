# Initialisation des Badges et Flags d'Authenticité

Ce document explique comment initialiser les badges et les flags d'authenticité pour les produits et opérateurs dans Overglow.

## Vue d'ensemble

Le système de badges permet d'attribuer automatiquement des badges aux produits et opérateurs basés sur des critères spécifiques (métriques, flags d'authenticité, etc.). Les badges sont affichés sur les cartes produits et les pages de détail pour améliorer la confiance et la visibilité.

## Méthodes d'initialisation

### 1. Script local (Développement)

Pour initialiser les badges localement, utilisez le script Node.js :

```bash
node scripts/initializeBadges.js
```

Ce script :
- Se connecte à la base de données MongoDB
- Initialise les badges par défaut (Vérifié, Artisan, Éco-responsable, 100% Marocain, Local Authentique, etc.)
- Marque tous les produits/opérateurs existants avec des flags d'authenticité par défaut
- Calcule et attribue les badges automatiquement

**Flags d'authenticité par défaut :**
- **Produits** : `isAuthenticLocal: true`, `isTraditional: true`, `isLocal100: true`, `isArtisan: false`, `isEcoFriendly: false`
- **Opérateurs** : `isAuthenticLocal: true`, `isTraditional: true`, `isLocal100: true`, `isArtisan: false`, `isEcoFriendly: false`

### 2. Endpoint Admin (Production)

Pour initialiser les badges en production via l'API :

```bash
POST https://overglow-backend.vercel.app/api/admin/initialize-badges
Authorization: Bearer <admin_token>
```

**Réponse :**
```json
{
  "message": "Badges initialized successfully",
  "summary": {
    "badgesInitialized": true,
    "productsUpdated": 10,
    "operatorsUpdated": 5,
    "productsWithBadges": 10,
    "operatorsWithBadges": 5,
    "productsWithErrors": 0,
    "operatorsWithErrors": 0,
    "totalProducts": 10,
    "totalOperators": 5
  }
}
```

**Prérequis :**
- Token d'authentification admin valide
- L'utilisateur doit avoir le rôle `Admin`

## Badges disponibles

### Badges Opérateurs

| Badge | Critères | Type |
|-------|----------|------|
| Vérifié | `isVerified: true` | Automatique |
| Artisan | `isArtisan: true` | Manuel |
| Éco-responsable | `isEcoFriendly: true` | Manuel |
| 100% Marocain | `isLocal: true, isLocal100: true` | Automatique |
| Local Authentique | `isLocal: true, isAuthenticLocal: true` | Automatique |
| Meilleur Opérateur | `minBookings: 50, minRating: 4.5` | Automatique |
| Réponse Rapide | `maxResponseTime: 2` (heures) | Automatique |
| Opérateur de Confiance | `minBookings: 100, minCompletionRate: 95%` | Automatique |

### Badges Produits

| Badge | Critères | Type |
|-------|----------|------|
| Populaire | `minBookings: 10` | Automatique |
| Meilleure Valeur | `isBestValue: true` | Automatique |
| Artisan | `isArtisan: true` | Manuel |
| Authentique locale | `isAuthenticLocal: true` | Automatique |
| Éco-responsable | `isEcoFriendly: true` | Manuel |
| Nouveau | `isNew: true` (créé < 30 jours) | Automatique |
| Dernières Places | `isLastMinute: true` (disponible < 24h) | Automatique |
| Excellent | `minRating: 4.5, minReviews: 5` | Automatique |

## Attribution automatique des badges

Les badges automatiques sont attribués lors de :
- Création/mise à jour d'un produit
- Confirmation d'une réservation
- Approbation d'une review
- Mise à jour manuelle via `/api/badges/update-product/:id` ou `/api/badges/update-operator/:id`

## Attribution manuelle des badges

Les badges manuels (Artisan, Éco-responsable) nécessitent une validation admin. Pour les attribuer :

1. Mettre à jour les flags d'authenticité du produit/opérateur :
```bash
PATCH /api/products/:id
{
  "authenticity": {
    "isArtisan": true,
    "isEcoFriendly": true
  }
}
```

2. Calculer les badges :
```bash
POST /api/badges/update-product/:id
```

## Affichage des badges

Les badges sont automatiquement affichés sur :
- **Cartes produits** (`ProductCard.jsx`) : Badges produits uniquement
- **Page détail produit** (`ProductDetailPage.jsx`) : Badges produits + badges opérateur

Les badges sont récupérés via :
- `/api/badges/product/:id` : Badges d'un produit
- `/api/badges/operator/:id` : Badges d'un opérateur

## Mise à jour des métriques

Les métriques sont calculées automatiquement lors de :
- Attribution de badges
- Création/mise à jour de réservations
- Création/mise à jour de reviews
- Mise à jour manuelle via les endpoints de badges

**Métriques produits :**
- `viewCount` : Nombre de vues
- `bookingCount` : Nombre de réservations
- `averageRating` : Note moyenne
- `reviewCount` : Nombre de reviews
- `isPopular` : Basé sur bookings/reviews
- `isBestValue` : Prix < moyenne catégorie
- `isNew` : Créé < 30 jours
- `isLastMinute` : Disponible < 24h

**Métriques opérateurs :**
- `totalBookings` : Total réservations
- `totalRevenue` : Revenus totaux
- `averageRating` : Note moyenne
- `totalReviews` : Nombre de reviews
- `responseTime` : Temps de réponse moyen (heures)
- `completionRate` : Taux de complétion (%)
- `isVerified` : Statut vérifié
- `isLocal` : Opérateur local

## Dépannage

### Les badges ne s'affichent pas

1. Vérifier que les badges sont initialisés :
```bash
GET /api/badges
```

2. Vérifier que les produits/opérateurs ont des flags d'authenticité :
```bash
GET /api/products/:id
# Vérifier le champ "authenticity"
```

3. Forcer le calcul des badges :
```bash
POST /api/badges/update-product/:id
POST /api/badges/update-operator/:id
```

### Erreurs lors de l'initialisation

- Vérifier la connexion à la base de données
- Vérifier que les modèles `Badge`, `Product`, `Operator` sont correctement configurés
- Vérifier les logs pour des erreurs spécifiques

## Notes importantes

- Les flags d'authenticité par défaut sont conservateurs (la plupart à `false` sauf `isAuthenticLocal` et `isLocal100`)
- Les badges automatiques sont attribués selon les critères définis dans `badgeService.js`
- Les badges manuels nécessitent une validation admin
- Le script et l'endpoint peuvent être exécutés plusieurs fois sans problème (idempotent)
- Les badges sont affichés avec leur icône, couleur et description définis dans le modèle `Badge`

