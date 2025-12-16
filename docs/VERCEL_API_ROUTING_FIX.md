# Correction du routage API sur Vercel

## Problème identifié

La requête `/api/auth/login` retournait `Content-Type: text/html` au lieu de JSON, ce qui signifie que le rewrite SPA interceptait les routes API au lieu de les router vers la fonction serverless.

## Cause

Quand le frontend et le backend sont déployés sur le même domaine Vercel (`overglow-v1-3jqp.vercel.app`), les requêtes `/api/*` doivent être routées vers `/api/index.js` (fonction serverless), mais le rewrite SPA les interceptait.

## Solution appliquée

### 1. Configuration Vercel (`vercel.json`)

L'ordre des rewrites est crucial - le rewrite API doit être **en premier** :

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

### 2. Configuration Axios

Si le frontend et le backend sont sur le même domaine Vercel, utiliser une URL relative (vide) pour que les requêtes `/api/*` soient gérées par Vercel :

```javascript
// Si sur le même domaine Vercel (overglow-v1-xxx.vercel.app)
// Utiliser URL relative pour que Vercel route /api/* vers la fonction serverless
return '';

// Si backend séparé (overglow-backend.vercel.app)
// Utiliser URL absolue
return 'https://overglow-backend.vercel.app';
```

## Vérification

Après déploiement :

1. **Dans DevTools Network**, cherchez la requête `POST /api/auth/login`
2. **Vérifiez les Headers** :
   - `Content-Type` doit être `application/json` (pas `text/html`)
   - `Status` doit être `200` ou `401` (pas `200` avec du HTML)
3. **Vérifiez la Response** : Doit être du JSON, pas du HTML

## Architecture recommandée

### Option 1 : Frontend et Backend sur le même domaine (recommandé)

- **Avantage** : Pas de problèmes CORS, routage simple
- **Configuration** : `baseURL: ''` dans axios (URL relative)
- **Vercel** : Routes `/api/*` vers `/api/index.js` automatiquement

### Option 2 : Frontend et Backend séparés

- **Avantage** : Séparation claire, déploiements indépendants
- **Configuration** : `baseURL: 'https://overglow-backend.vercel.app'` dans axios
- **CORS** : Doit être configuré sur le backend

## Notes importantes

- L'ordre des rewrites dans `vercel.json` est crucial
- Le rewrite API doit toujours être **avant** le rewrite SPA
- Les requêtes `/api/*` ne doivent jamais être interceptées par le rewrite SPA
- Si vous voyez du HTML au lieu de JSON, le rewrite SPA intercepte les routes API

