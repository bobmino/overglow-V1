# Configuration Sentry - Monitoring des Erreurs

## Vue d'ensemble

Sentry est intégré pour le monitoring des erreurs en production, permettant de :
- Capturer automatiquement les erreurs JavaScript (frontend) et Node.js (backend)
- Enregistrer les sessions utilisateur avec Session Replay
- Suivre les performances avec Performance Monitoring
- Recevoir des alertes en temps réel sur les erreurs critiques

## Configuration

### 1. Créer un compte Sentry

1. Aller sur [sentry.io](https://sentry.io)
2. Créer un compte gratuit
3. Créer un nouveau projet :
   - **Frontend** : Sélectionner "React"
   - **Backend** : Sélectionner "Node.js/Express"
4. Copier les DSN (Data Source Names) fournis

### 2. Variables d'environnement

#### Frontend (`.env` dans `frontend/`)
```env
VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

#### Backend (`.env` à la racine)
```env
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

#### Vercel

Ajouter les variables dans Vercel Dashboard :
- **Frontend** : `VITE_SENTRY_DSN`
- **Backend** : `SENTRY_DSN`

## Fonctionnalités

### Frontend

1. **Error Boundary**
   - Capture automatique des erreurs React
   - UI de fallback personnalisée
   - Enregistrement dans Sentry

2. **Session Replay**
   - Enregistrement de 10% des sessions (production)
   - 100% des sessions avec erreurs
   - Masquage automatique des données sensibles

3. **Performance Monitoring**
   - Tracking des transactions
   - Mesure des temps de chargement
   - Identification des goulots d'étranglement

4. **User Context**
   - Association automatique des erreurs aux utilisateurs
   - Tracking des actions utilisateur

### Backend

1. **Error Tracking**
   - Capture automatique des erreurs Express
   - Filtrage des erreurs non critiques (404, validation)
   - Contexte complet (request, headers, body)

2. **Performance Monitoring**
   - Tracking des requêtes HTTP
   - Mesure des temps de réponse
   - Identification des endpoints lents

3. **Breadcrumbs**
   - Historique des actions avant l'erreur
   - Contexte de débogage enrichi

## Utilisation

### Capturer une erreur manuellement

#### Frontend
```javascript
import { captureException, captureMessage } from '../utils/sentry';

try {
  // Code qui peut échouer
} catch (error) {
  captureException(error, {
    extra: {
      userId: user.id,
      action: 'booking_creation',
    },
  });
}

// Capturer un message
captureMessage('Something important happened', 'warning', {
  context: 'user_action',
});
```

#### Backend
```javascript
import { captureException, captureMessage } from '../utils/sentry.js';

try {
  // Code qui peut échouer
} catch (error) {
  captureException(error, {
    extra: {
      userId: req.user?._id,
      endpoint: req.path,
    },
  });
}
```

### Ajouter un breadcrumb

```javascript
import { addBreadcrumb } from '../utils/sentry';

addBreadcrumb('User clicked checkout button', 'user_action', 'info', {
  productId: product._id,
  price: product.price,
});
```

## Filtrage des erreurs

### Erreurs ignorées automatiquement

**Frontend :**
- Erreurs réseau (NetworkError, Failed to fetch)
- Erreurs de connexion réseau

**Backend :**
- Erreurs 404 (Not Found)
- Erreurs de validation (tag `validation`)

### Personnaliser le filtrage

Modifier `beforeSend` dans :
- `frontend/src/utils/sentry.js`
- `backend/utils/sentry.js`

## Alertes

### Configuration dans Sentry

1. Aller dans **Settings** → **Alerts**
2. Créer une nouvelle règle d'alerte :
   - **Condition** : Nombre d'erreurs > seuil
   - **Action** : Email, Slack, Discord, etc.
   - **Filtres** : Par environnement, niveau d'erreur, etc.

### Alertes recommandées

1. **Erreurs critiques** : Erreurs 500+ dans les 5 dernières minutes
2. **Erreurs fréquentes** : Même erreur > 10 fois en 1 heure
3. **Nouvelle erreur** : Première occurrence d'une erreur
4. **Performance** : Temps de réponse > 3 secondes

## Dashboard Sentry

### Métriques importantes

- **Error Rate** : Taux d'erreurs par heure
- **Affected Users** : Nombre d'utilisateurs touchés
- **Performance** : Temps de réponse moyen
- **Release Health** : Santé des déploiements

### Filtres utiles

- **Environment** : `production`, `development`
- **Level** : `error`, `warning`, `info`
- **Tags** : `component`, `endpoint`, `user_id`

## Bonnes pratiques

1. **Ne pas logger les données sensibles**
   - Les mots de passe sont automatiquement masqués
   - Éviter de logger les tokens, cartes bancaires, etc.

2. **Utiliser les tags**
   - Ajouter des tags pour faciliter le filtrage
   - Exemple : `component: 'checkout'`, `feature: 'booking'`

3. **Enrichir le contexte**
   - Ajouter des informations utiles dans `extra`
   - Inclure l'ID utilisateur, l'action, les paramètres

4. **Tester en développement**
   - Sentry fonctionne aussi en développement
   - Utiliser pour tester les alertes

## Désactivation

Pour désactiver Sentry temporairement :

1. **Frontend** : Ne pas définir `VITE_SENTRY_DSN`
2. **Backend** : Ne pas définir `SENTRY_DSN`

L'application continuera de fonctionner normalement, mais les erreurs ne seront pas envoyées à Sentry.

## Support

- [Documentation Sentry React](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Documentation Sentry Node.js](https://docs.sentry.io/platforms/javascript/guides/node/)
- [Dashboard Sentry](https://sentry.io)

