# Guide de débogage : Connexion Admin et vérification des fichiers JS

## 1. Vérifier les fichiers .js dans DevTools Network

### Étapes pour vérifier le Content-Type des fichiers JavaScript :

1. **Ouvrez DevTools** (F12 ou Clic droit > Inspecter)
2. **Allez dans l'onglet Network**
3. **Rechargez la page** (F5 ou Ctrl+R)
4. **Filtrez par "JS"** dans la barre de recherche du Network
5. **Cliquez sur un fichier .js** (par exemple `assets/js/main-xxx.js`)
6. **Vérifiez dans l'onglet "Headers"** :
   - Cherchez `Content-Type` dans "Response Headers"
   - Il devrait être : `application/javascript; charset=utf-8`
   - ❌ Si c'est `text/html`, le problème persiste

### Ce qu'il faut vérifier :

- ✅ **Content-Type correct** : `application/javascript` ou `application/javascript; charset=utf-8`
- ✅ **Status** : `200` (succès)
- ✅ **Size** : Le fichier a une taille raisonnable (pas 0 bytes)
- ❌ **Si vous voyez du HTML** dans la réponse, le fichier JS n'est pas servi correctement

## 2. Problème de connexion Admin

### Causes possibles :

1. **Mot de passe incorrect** - Vérifiez que vous utilisez le bon mot de passe
2. **Problème de connexion à la base de données** - La DB peut ne pas être accessible
3. **Problème CORS** - Les headers CORS peuvent bloquer la requête
4. **JWT_SECRET manquant** - Variable d'environnement non configurée sur Vercel

### Comment déboguer :

#### A. Vérifier dans DevTools Network :

1. **Ouvrez DevTools > Network**
2. **Tentez de vous connecter**
3. **Cherchez la requête POST vers `/api/auth/login`**
4. **Cliquez dessus et vérifiez** :
   - **Status** : 
     - `200` = Succès mais peut avoir une erreur dans le body
     - `400` = Erreur de validation (email/password manquant)
     - `401` = Identifiants incorrects
     - `500` = Erreur serveur (DB, JWT_SECRET, etc.)
   - **Response** : Regardez le message d'erreur dans le body JSON

#### B. Messages d'erreur possibles :

- `"Email and password are required"` → Champs manquants
- `"Invalid email or password"` → Identifiants incorrects
- `"Database connection error"` → Problème de connexion MongoDB
- `"JWT_SECRET missing"` → Variable d'environnement manquante sur Vercel
- `"User account is locked"` → Trop de tentatives échouées

#### C. Vérifier les variables d'environnement sur Vercel :

1. Allez sur votre dashboard Vercel
2. Sélectionnez votre projet backend
3. Settings > Environment Variables
4. Vérifiez que ces variables existent :
   - `MONGO_URI` - URI de connexion MongoDB
   - `JWT_SECRET` - Secret pour signer les tokens JWT
   - `JWT_REFRESH_SECRET` - Secret pour les refresh tokens

#### D. Réinitialiser le mot de passe admin :

Si vous avez oublié le mot de passe ou besoin d'en créer un nouveau :

```bash
# Option 1 : Utiliser le script createAdmin
node -r dotenv/config scripts/createAdmin.js

# Option 2 : Se connecter directement à MongoDB et mettre à jour
# (nécessite l'accès à MongoDB)
```

## 3. Vérifier les logs Vercel

1. Allez sur Vercel Dashboard
2. Sélectionnez votre projet
3. Allez dans l'onglet "Logs"
4. Cherchez les erreurs liées à :
   - `Database connection`
   - `JWT_SECRET`
   - `Login error`

## 4. Test rapide de l'API

Testez directement l'endpoint de login :

```bash
curl -X POST https://overglow-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@overglow.com","password":"votre_mot_de_passe"}'
```

Cela vous donnera le message d'erreur exact.

## 5. Solutions courantes

### Si le mot de passe est "faible" mais fonctionne en local :

Le système n'a **pas de validation de force de mot de passe** - un mot de passe de 6 caractères minimum est accepté. Si ça fonctionne en local mais pas en production :

1. **Vérifiez que le même utilisateur existe en production**
2. **Vérifiez que le mot de passe est le même** (hashé différemment = problème)
3. **Vérifiez les variables d'environnement** (MONGO_URI peut pointer vers une DB différente)

### Si c'est un problème après la mise à jour :

1. **Videz le cache du navigateur** (Ctrl+Shift+Delete)
2. **Vérifiez que le déploiement Vercel est terminé**
3. **Attendez quelques minutes** pour que les changements se propagent
4. **Vérifiez les logs Vercel** pour des erreurs de déploiement

## 6. Créer un nouvel admin si nécessaire

Si vous ne pouvez pas vous connecter et avez besoin de créer un admin :

1. Utilisez le script `createAdmin.js`
2. Ou connectez-vous directement à MongoDB et créez un utilisateur avec `role: 'Admin'`

