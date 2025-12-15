# Fix Build Vercel - react-helmet-async

## Problème
- `react-helmet-async` n'est pas compatible avec React 19
- Erreur lors du build Vercel : `ERESOLVE could not resolve`

## Solution
1. **Création de `.npmrc`** dans `frontend/` avec `legacy-peer-deps=true`
   - Permet à npm d'ignorer les conflits de peer dependencies
   - Utilisé automatiquement par Vercel lors du build

2. **Correction des références `window`**
   - Toutes les références à `window.location.href` protégées avec `typeof window !== 'undefined'`
   - Évite les erreurs SSR (Server-Side Rendering)

## Fichiers modifiés
- `frontend/.npmrc` : Créé avec `legacy-peer-deps=true`
- Tous les fichiers utilisant `window.location.href` : Protégés avec vérification SSR

## Statut
✅ Résolu - Le build devrait maintenant fonctionner sur Vercel

