# Configuration Cloudinary - Overglow Trip

## ✅ Implémentation Complétée

L'intégration Cloudinary a été implémentée avec succès. Les images sont maintenant uploadées vers Cloudinary au lieu d'être stockées en base64 dans MongoDB.

## 📋 Configuration Requise

### Variables d'Environnement

Assurez-vous d'avoir ces variables dans votre fichier `.env` :

```env
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret
```

### Configuration sur Vercel

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet backend (`overglow-backend`)
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez les trois variables Cloudinary :
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
5. Sélectionnez les environnements (Production, Preview, Development)
6. Cliquez sur **Save**
7. **Redéployez** votre application

## 🔧 Comment Ça Fonctionne

### Flux d'Upload

1. **Upload** : L'image est uploadée en mémoire (buffer)
2. **Compression** : L'image est compressée en WebP (85% qualité, max 1920x1080)
3. **Cloudinary** : Si configuré, l'image est uploadée vers Cloudinary
4. **URL** : L'URL Cloudinary est retournée et stockée dans MongoDB
5. **Fallback** : Si Cloudinary n'est pas configuré ou échoue, utilise base64

### Avantages

- ✅ Images servies via CDN (plus rapide)
- ✅ Réduction de la taille de la base de données
- ✅ Génération automatique de différentes tailles (responsive)
- ✅ Optimisation automatique des images
- ✅ Fallback vers base64 si Cloudinary n'est pas disponible

## 📁 Structure des Dossiers Cloudinary

Les images sont organisées dans Cloudinary comme suit :

```
overglow-trip/
  └── uploads/
      ├── image-1234567890.webp
      ├── image-1234567891.webp
      └── ...
```

## 🔄 Migration des Images Existantes

Si vous avez des images en base64 existantes, elles continueront de fonctionner. Pour migrer vers Cloudinary :

1. Identifier les images base64 dans MongoDB
2. Les télécharger et les uploader vers Cloudinary
3. Mettre à jour les URLs dans MongoDB

## 🧪 Tests

### Test d'Upload

1. Aller sur `/admin/blog/new`
2. Uploader une image
3. Vérifier dans la console que l'URL retournée est une URL Cloudinary (commence par `https://res.cloudinary.com/`)
4. Créer l'article
5. Vérifier que l'image s'affiche correctement

### Vérification

- ✅ L'URL retournée est une URL Cloudinary
- ✅ L'image s'affiche sur la page de création
- ✅ L'image est sauvegardée dans MongoDB avec l'URL Cloudinary
- ✅ L'image s'affiche sur la page publique `/blog`

## 🐛 Dépannage

### Erreur : "Cloudinary upload failed, falling back to base64"

**Causes possibles :**
- Variables d'environnement non configurées
- Credentials Cloudinary incorrects
- Problème de connexion réseau

**Solutions :**
1. Vérifier que les variables d'environnement sont bien configurées
2. Vérifier les credentials dans le dashboard Cloudinary
3. Vérifier les logs backend pour plus de détails

### L'image ne s'affiche pas

**Causes possibles :**
- URL Cloudinary incorrecte
- Problème CORS
- Image supprimée de Cloudinary

**Solutions :**
1. Vérifier que l'URL dans MongoDB est correcte
2. Vérifier que l'image existe dans Cloudinary
3. Vérifier les logs backend

### Fallback vers base64

Si Cloudinary n'est pas configuré, le système utilisera automatiquement base64. C'est normal et fonctionnel, mais moins optimal.

## 📊 Monitoring

### Dashboard Cloudinary

Vous pouvez surveiller l'utilisation dans le [Dashboard Cloudinary](https://cloudinary.com/console) :
- Nombre d'images uploadées
- Espace de stockage utilisé
- Bandwidth utilisé
- Transformations appliquées

## 🔒 Sécurité

- ✅ Les credentials Cloudinary sont stockés dans les variables d'environnement
- ✅ Les URLs Cloudinary sont sécurisées (HTTPS)
- ✅ Les images sont organisées dans des dossiers spécifiques
- ✅ Validation des types de fichiers avant upload

## 📝 Notes Techniques

- **Format** : WebP (meilleure compression)
- **Qualité** : Auto (optimisé par Cloudinary)
- **Dimensions max** : 1920x1080px
- **Taille max** : 5MB par fichier
- **Dossier** : `overglow-trip/uploads/`

## 🚀 Prochaines Étapes

- [ ] Tester l'upload d'images
- [ ] Vérifier que les images s'affichent correctement
- [ ] Monitorer l'utilisation Cloudinary
- [ ] Optionnel : Migrer les images existantes (base64) vers Cloudinary

