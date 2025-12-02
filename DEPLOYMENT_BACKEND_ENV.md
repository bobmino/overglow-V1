# Configuration des Variables d'Environnement Backend - Vercel

## Variables Requises

Pour que le backend fonctionne correctement sur Vercel, vous devez configurer les variables d'environnement suivantes dans le dashboard Vercel :

### Variables Obligatoires

1. **MONGO_URI**
   - Description : URI de connexion à MongoDB
   - Format : `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
   - Où configurer : Vercel Dashboard → Project Settings → Environment Variables

2. **JWT_SECRET**
   - Description : Secret pour signer les tokens JWT
   - Format : Chaîne de caractères aléatoire et sécurisée (minimum 32 caractères recommandé)
   - Exemple : `your-super-secret-jwt-key-minimum-32-characters-long`
   - ⚠️ **CRITIQUE** : Cette variable est obligatoire. Sans elle, l'authentification ne fonctionnera pas et vous obtiendrez des erreurs 500 sur `/api/auth/login`

### Variables Optionnelles

3. **EMAIL_HOST**
   - Description : Serveur SMTP pour l'envoi d'emails
   - Exemple : `smtp.gmail.com`
   - Par défaut : Les emails ne seront pas envoyés si non configuré

4. **EMAIL_PORT**
   - Description : Port SMTP
   - Exemple : `587`
   - Par défaut : `587`

5. **EMAIL_USER**
   - Description : Email de l'expéditeur
   - Exemple : `your-email@gmail.com`

6. **EMAIL_PASS**
   - Description : Mot de passe de l'application email
   - Pour Gmail : Utiliser un "App Password" (pas le mot de passe principal)

7. **EMAIL_ENABLED**
   - Description : Activer/désactiver l'envoi d'emails
   - Valeurs : `true` ou `false`
   - Par défaut : `true` si EMAIL_USER est défini

8. **NODE_ENV**
   - Description : Environnement d'exécution
   - Valeurs : `development` ou `production`
   - Par défaut : `production` sur Vercel

## Comment Configurer sur Vercel

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet backend (`overglow-backend`)
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez chaque variable :
   - **Key** : Le nom de la variable (ex: `JWT_SECRET`)
   - **Value** : La valeur de la variable
   - **Environment** : Sélectionnez `Production`, `Preview`, et/ou `Development` selon vos besoins
5. Cliquez sur **Save**
6. **Redéployez** votre application pour que les changements prennent effet

## Vérification

Après configuration, vérifiez que :
- ✅ Le backend démarre sans erreur
- ✅ `/api/auth/login` fonctionne (pas d'erreur 500)
- ✅ Les tokens JWT sont générés correctement
- ✅ La connexion à MongoDB fonctionne

## Dépannage

### Erreur 500 sur `/api/auth/login`
- **Cause** : `JWT_SECRET` n'est pas défini
- **Solution** : Ajoutez `JWT_SECRET` dans les variables d'environnement Vercel et redéployez

### Erreur de connexion MongoDB
- **Cause** : `MONGO_URI` incorrect ou non défini
- **Solution** : Vérifiez que `MONGO_URI` est correct et accessible depuis Vercel

### Emails non envoyés
- **Cause** : Variables email non configurées
- **Solution** : Configurez `EMAIL_HOST`, `EMAIL_USER`, et `EMAIL_PASS` (ou définissez `EMAIL_ENABLED=false`)

## Sécurité

⚠️ **Important** :
- Ne commitez JAMAIS les variables d'environnement dans Git
- Utilisez des secrets forts pour `JWT_SECRET` (minimum 32 caractères aléatoires)
- Régénérez `JWT_SECRET` si vous pensez qu'il a été compromis
- Utilisez des "App Passwords" pour Gmail, pas votre mot de passe principal

