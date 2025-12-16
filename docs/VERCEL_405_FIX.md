# Correction de l'erreur 405 Method Not Allowed

## Problème identifié

L'erreur **405 Method Not Allowed** se produit quand une requête POST vers `/api/auth/login` n'est pas correctement routée vers la fonction serverless.

## Cause

Le problème venait de la configuration axios qui utilisait une URL relative (`baseURL: ''`) quand le frontend et le backend sont sur le même domaine Vercel. Cependant :

1. **Le frontend est sur** : `overglow-v1-3jqp.vercel.app`
2. **Le backend est sur** : `overglow-backend.vercel.app`

Ce sont **deux domaines Vercel différents**, donc utiliser une URL relative ne fonctionne pas.

## Solution appliquée

### Configuration Axios corrigée

Revenir à l'utilisation de l'URL absolue du backend :

```javascript
// En production, toujours utiliser l'URL absolue du backend séparé
if (import.meta.env.PROD || window.location.hostname.includes('vercel.app')) {
  return 'https://overglow-backend.vercel.app';
}
```

### Configuration Vercel

Le `vercel.json` est correct avec les rewrites pour les routes API :

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.js"
    },
    {
      "source": "/((?!api|assets|_next|.*\\.[a-zA-Z0-9]+$).*)",
      "destination": "/index.html"
    }
  ]
}
```

## Architecture actuelle

- **Frontend** : `overglow-v1-3jqp.vercel.app` (déploiement frontend)
- **Backend** : `overglow-backend.vercel.app` (déploiement backend séparé)
- **Requêtes API** : Le frontend fait des requêtes vers `https://overglow-backend.vercel.app/api/*`

## Vérification

Après redéploiement :

1. **Dans DevTools Network**, cherchez `POST https://overglow-backend.vercel.app/api/auth/login`
2. **Vérifiez** :
   - Status : `200` ou `401` (pas `405`)
   - Content-Type : `application/json` (pas `text/html`)
   - Response : JSON avec `token` ou message d'erreur

## Notes importantes

- Le frontend et le backend sont sur **des domaines Vercel différents**
- Les requêtes API doivent utiliser l'URL absolue du backend
- Le CORS est déjà configuré pour autoriser `overglow-v1-3jqp.vercel.app`

