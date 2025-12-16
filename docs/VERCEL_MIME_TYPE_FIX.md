# Correction des erreurs MIME Type sur Vercel

## Problème

L'erreur `Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html"` se produit quand :

1. Les fichiers JavaScript sont interceptés par le rewrite SPA et servis comme HTML
2. Les fichiers statiques ne sont pas exclus du rewrite SPA
3. Les headers MIME types ne sont pas correctement définis

## Solution appliquée

### 1. Exclusion des fichiers statiques du rewrite SPA

Le rewrite SPA a été modifié pour exclure :
- Les fichiers dans `/assets/`
- Tous les fichiers avec une extension (`.js`, `.css`, `.png`, etc.)

Pattern utilisé : `/((?!assets|.*\\.[a-zA-Z0-9]+$).*)`

### 2. Headers MIME types explicites

Ajout de headers pour forcer les bons MIME types :
- `.js` → `application/javascript; charset=utf-8`
- `.css` → `text/css; charset=utf-8`

### 3. Configuration Vercel

Deux fichiers `vercel.json` ont été mis à jour :
- `vercel.json` (racine) - pour déploiement monorepo
- `frontend/vercel.json` - pour déploiement frontend séparé

## Erreur secondaire : content-all.js

L'erreur `Uncaught (in promise) Error: Could not establish connection. Receiving end does not exist` dans `content-all.js` est causée par :

- Une extension de navigateur (adblocker, extension de développement)
- Ce n'est **pas une erreur critique** de l'application
- Peut être ignorée ou désactivée en désactivant les extensions

## Vérification

Après déploiement sur Vercel :

1. Vérifiez que les fichiers JS se chargent correctement
2. Inspectez les headers dans les DevTools Network
3. Les fichiers `.js` doivent avoir `Content-Type: application/javascript`

## Notes

- Le cache du navigateur peut causer des problèmes - faites un hard refresh (Ctrl+Shift+R)
- Vercel peut prendre quelques minutes pour appliquer les changements de configuration
- Si le problème persiste, vérifiez que le build génère bien les fichiers dans `/assets/`

