# Gestion du Blog - Tout passe par la base de données

## Architecture optimisée pour Vercel

Tous les articles de blog sont maintenant gérés directement depuis la base de données MongoDB via l'interface admin. **Aucun fichier seed n'est nécessaire** - tout passe par l'API et la base de données.

## Solution : Interface Admin

### Accès à la gestion du blog

1. Connectez-vous en tant qu'administrateur
2. Allez sur `/admin/dashboard`
3. Cliquez sur "Gérer le Blog"

### Initialiser les articles par défaut

1. Sur la page `/admin/blog`, cliquez sur le bouton **"Initialiser les articles par défaut"**
2. Les 3 articles de blog par défaut seront créés dans la base de données
3. Les articles existants seront conservés (pas de doublons)

### Gérer les articles

- **Créer** : Cliquez sur "Nouvel article" (à venir)
- **Publier/Dépublier** : Utilisez le bouton "Publier" / "Dépublier"
- **Supprimer** : Cliquez sur l'icône de suppression
- **Voir** : Cliquez sur "Voir" pour prévisualiser l'article

## Endpoints API disponibles

### Public
- `GET /api/blog` - Liste des articles publiés
- `GET /api/blog/:slug` - Détails d'un article
- `GET /api/blog/categories` - Liste des catégories
- `GET /api/blog/tags` - Liste des tags

### Admin (authentification requise)
- `GET /api/blog/admin/all` - Tous les articles (publiés et brouillons)
- `POST /api/blog` - Créer un article
- `PUT /api/blog/:id` - Modifier un article
- `DELETE /api/blog/:id` - Supprimer un article
- `POST /api/blog/admin/initialize` - Initialiser les articles par défaut

## Avantages de cette approche

✅ **Optimisé pour Vercel** : Pas de fichiers seed, tout passe par l'API serverless  
✅ **Base de données unique** : Une seule source de vérité (MongoDB)  
✅ **Interface intuitive** : Gestion via l'interface admin  
✅ **Pas de confusion** : Pas de distinction entre local et production  
✅ **Sécurisé** : Seuls les admins peuvent créer/modifier les articles  

## Vérification

Après avoir initialisé les articles depuis l'interface admin :

1. Visitez `https://overglow-backend.vercel.app/api/blog`
2. Vous devriez voir les articles retournés
3. La page `/blog` devrait afficher les articles

## Notes importantes

- Les articles sont créés directement dans la base de données MongoDB de production
- L'endpoint `/api/blog/admin/initialize` vérifie les doublons automatiquement
- Les articles sont publiés par défaut (`isPublished: true`)
- Assurez-vous qu'un utilisateur Admin existe dans la base de données
