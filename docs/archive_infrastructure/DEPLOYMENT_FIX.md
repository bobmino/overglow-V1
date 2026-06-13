# Fix CORS - Instructions de Déploiement

## Problème Identifié
Les erreurs CORS persistent car le backend n'a pas été redéployé avec les nouvelles configurations.

## Fichiers Modifiés

### 1. `server.js`
- Configuration CORS simplifiée et renforcée
- Gestion explicite des requêtes OPTIONS
- Logs de debug ajoutés

### 2. `vercel.json`
- Configuration simplifiée pour utiliser `server.js` directement
- Plus de dépendance sur `api/index.js`

### 3. `frontend/src/config/axios.js`
- Détection automatique de l'URL du backend en production
- Fallback vers `https://overglow-backend.vercel.app`

## Actions Requises

### Étape 1: Commit et Push
```bash
git add .
git commit -m "Fix CORS configuration for Vercel deployment"
git push origin main
```

### Étape 2: Vérifier le Déploiement Backend
1. Aller sur https://vercel.com
2. Ouvrir le projet backend (`overglow-backend`)
3. Vérifier que le déploiement s'est bien terminé
4. Vérifier les logs pour voir les messages `[CORS]`

### Étape 3: Tester
1. Ouvrir https://overglow-backend.vercel.app/health
2. Devrait retourner `{"status":"ok",...}`
3. Tester une requête OPTIONS depuis le frontend

## Si le Problème Persiste

### Vérifier les Logs Vercel
1. Aller dans le dashboard Vercel du backend
2. Ouvrir "Functions" → "Logs"
3. Chercher les messages `[CORS]` pour voir ce qui se passe

### Vérifier la Configuration
- Le fichier `vercel.json` doit pointer vers `server.js`
- Le fichier `server.js` doit exporter `export default app;`
- Les middlewares CORS doivent être AVANT toutes les routes

## Configuration CORS Actuelle

Le backend autorise maintenant:
- Toutes les origines Vercel (`.vercel.app`)
- Localhost pour le développement
- Toutes les requêtes OPTIONS sont gérées immédiatement

