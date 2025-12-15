# Configuration Analytics GA4

## Variables d'environnement

Ajoutez dans votre fichier `.env` (frontend) :

```env
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

Pour obtenir votre Measurement ID :
1. Allez sur [Google Analytics](https://analytics.google.com/)
2. Créez une propriété GA4
3. Récupérez le Measurement ID (format: G-XXXXXXXXXX)

## Événements trackés

### Conversions
- **purchase** : Réservation confirmée (BookingSuccessPage)
- **begin_checkout** : Début du checkout (CheckoutPage)

### Funnel
- **view_item** : Vue produit (ProductDetailPage)
- **search** : Recherche effectuée (SearchPage)
- **select_item** : Clic sur produit depuis liste
- **view_item** : Vue page booking (BookingPage)

### Comportement utilisateur
- **sign_up** : Inscription (RegisterPage)
- **login** : Connexion (LoginPage)
- **share** : Partage social
- **add_to_wishlist** / **remove_from_wishlist** : Favoris
- **generate_lead** : Envoi d'inquiry
- **review** : Soumission d'avis
- **filter** : Application de filtres
- **currency_change** : Changement de devise
- **skip_the_line_selection** : Sélection skip-the-line

### Autres
- **view_item** (blog_post) : Vue article blog
- **exception** : Erreurs

## Intégration dans les pages

Les événements sont automatiquement trackés via :
- `usePageTracking()` hook dans App.jsx (page views)
- Appels manuels dans les pages clés

## Vérification

1. Ouvrez la console développeur
2. Vérifiez que `window.gtag` est défini
3. Vérifiez les événements dans GA4 DebugView (en temps réel)

## Funnel de conversion

1. **search** → Recherche
2. **view_item** → Vue produit
3. **select_item** → Clic sur produit
4. **begin_checkout** → Début checkout
5. **purchase** → Réservation confirmée

