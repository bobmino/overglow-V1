# Configuration Google Analytics 4 (GA4)

## Vue d'ensemble

L'application Overglow Trip intègre Google Analytics 4 pour le tracking complet des conversions, du funnel de conversion et du comportement utilisateur.

## Configuration

### 1. Variables d'environnement

Ajouter dans `.env` (frontend) :
```env
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 2. Créer une propriété GA4

1. Aller sur [Google Analytics](https://analytics.google.com/)
2. Créer une nouvelle propriété GA4
3. Copier le Measurement ID (format: `G-XXXXXXXXXX`)
4. Ajouter dans les variables d'environnement Vercel

## Événements trackés

### Funnel de conversion

1. **`search`** - Recherche d'expériences
   - Paramètres : `search_term`, `results_count`, `city`, `category`, `min_price`, `max_price`, `date`

2. **`view_item`** - Visualisation d'un produit
   - Paramètres : `product_id`, `product_name`, `category`, `city`, `rating`, `review_count`, `price`

3. **`select_item`** - Clic sur un produit (depuis liste)
   - Paramètres : `item_list_id`, `item_list_name`, `items[]`

4. **`add_to_cart`** - Début de réservation (clic "Réserver maintenant")
   - Paramètres : `currency`, `value`, `items[]`

5. **`begin_checkout`** - Arrivée sur la page checkout
   - Paramètres : `totalAmount`, `totalPrice`, `items[]`

6. **`purchase`** - Réservation confirmée ✅
   - Paramètres : `transaction_id`, `value`, `currency`, `items[]`, `booking_reference`, `number_of_tickets`, `city`

### Événements utilisateur

- **`sign_up`** - Inscription
- **`login`** - Connexion
- **`add_to_wishlist`** / **`remove_from_wishlist`** - Favoris
- **`share`** - Partage social
- **`review`** - Soumission d'avis
- **`generate_lead`** - Envoi de demande (inquiry)
- **`currency_change`** - Changement de devise
- **`skip_the_line_selection`** - Sélection skip-the-line
- **`filter`** - Application de filtres
- **`view_item`** (blog) - Visualisation d'article de blog

### Événements d'erreur

- **`exception`** - Erreurs JavaScript

## Funnel de conversion GA4

Le funnel peut être configuré dans GA4 avec ces étapes :

1. **Recherche** (`search`)
2. **Visualisation produit** (`view_item`)
3. **Clic produit** (`select_item`)
4. **Début réservation** (`add_to_cart`)
5. **Checkout** (`begin_checkout`)
6. **Conversion** (`purchase`)

## Configuration dans GA4

### 1. Créer un événement de conversion

Dans GA4 Admin → Événements → Marquer comme conversion :
- ✅ `purchase` (réservation confirmée)

### 2. Créer un funnel personnalisé

Dans GA4 → Explorations → Funnel :
1. Étape 1 : `search`
2. Étape 2 : `view_item`
3. Étape 3 : `select_item`
4. Étape 4 : `add_to_cart`
5. Étape 5 : `begin_checkout`
6. Étape 6 : `purchase`

### 3. Créer des audiences

- **Abandons checkout** : Utilisateurs avec `begin_checkout` mais sans `purchase`
- **Visiteurs récurrents** : Utilisateurs avec plusieurs `view_item`
- **Chercheurs actifs** : Utilisateurs avec plusieurs `search`

## Vérification

1. Ouvrir la console navigateur
2. Vérifier que `window.gtag` existe
3. Vérifier les événements dans GA4 → Temps réel → Événements

## Désactivation en développement

Si `VITE_GA4_MEASUREMENT_ID` n'est pas défini, les événements sont ignorés silencieusement (pas d'erreur).

## Support

Pour toute question sur la configuration GA4, consulter :
- [Documentation GA4](https://developers.google.com/analytics/devguides/collection/ga4)
- [Événements GA4 recommandés](https://developers.google.com/analytics/devguides/collection/ga4/events)

