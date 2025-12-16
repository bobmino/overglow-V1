# Checklist de Tests - Overglow Trip

## 🔐 Tests d'Authentification

### Admin
- [ ] Connexion avec `admin@overglow.com` / `admin123`
- [ ] Accès à `/admin/dashboard` ✅
- [ ] Accès à `/admin/blog` ✅
- [ ] Accès à `/admin/blog/new` ✅
- [ ] Accès à `/admin/blog/:id/edit` ✅
- [ ] Accès à `/admin/operators` ✅
- [ ] Accès à `/admin/products` ✅
- [ ] Accès à `/admin/users` ✅

### Opérateur
- [ ] Connexion avec compte opérateur
- [ ] Accès à `/operator/dashboard` ⚠️ À VÉRIFIER
- [ ] Accès à `/operator/products` ⚠️ À VÉRIFIER
- [ ] Accès à `/operator/bookings` ⚠️ À VÉRIFIER
- [ ] Accès à `/operator/analytics` ⚠️ À VÉRIFIER
- [ ] Vérifier que l'onboarding ne bloque pas si déjà complété

### Client
- [ ] Connexion avec compte client
- [ ] Accès à `/dashboard` ⚠️ À VÉRIFIER
- [ ] Accès à `/profile` ⚠️ À VÉRIFIER
- [ ] Accès à `/favorites` ⚠️ À VÉRIFIER
- [ ] Accès à `/loyalty` ⚠️ À VÉRIFIER
- [ ] Accès à `/view-history` ⚠️ À VÉRIFIER

## 📝 Tests Blog CRUD

### Création
- [ ] Créer un article via `/admin/blog/new`
- [ ] Upload d'image fonctionne
- [ ] Tous les champs sont sauvegardés
- [ ] Slug généré automatiquement
- [ ] Article visible dans la liste

### Édition
- [ ] Éditer un article via `/admin/blog/:id/edit`
- [ ] Données pré-remplies correctement
- [ ] Modifications sauvegardées
- [ ] Article mis à jour dans la liste

### Publication
- [ ] Publier un article depuis la liste
- [ ] Dépublier un article depuis la liste
- [ ] Article visible/invisible sur `/blog`

### Suppression
- [ ] Supprimer un article
- [ ] Confirmation demandée
- [ ] Article supprimé de la liste

## 🔄 Tests de Session

### Refresh Token
- [ ] Token expire après 1 heure
- [ ] Refresh automatique fonctionne
- [ ] Utilisateur reste connecté après refresh
- [ ] Fonctionne pour Admin ✅
- [ ] Fonctionne pour Opérateur ⚠️ À VÉRIFIER
- [ ] Fonctionne pour Client ⚠️ À VÉRIFIER

## 🌐 Tests API

### Requêtes
- [ ] Toutes les requêtes vont vers `overglow-backend.vercel.app`
- [ ] Toutes les réponses sont en JSON (pas HTML)
- [ ] Content-Type correct pour toutes les réponses
- [ ] Pas d'erreurs 405 Method Not Allowed
- [ ] Pas d'erreurs 401 non gérées

## 📊 Points à surveiller

### Console Navigateur
- [ ] Pas d'erreurs JavaScript
- [ ] Pas d'erreurs de validation
- [ ] Logs de requêtes API visibles
- [ ] Logs de validation visibles

### Network DevTools
- [ ] Status codes corrects (200, 401, etc.)
- [ ] Pas de requêtes qui retournent HTML
- [ ] Headers Authorization présents
- [ ] Content-Type correct

## 🎯 Priorités

1. **CRITIQUE** : Tester l'accès des opérateurs et clients après authentification
2. **IMPORTANT** : Tester le CRUD blog complet
3. **IMPORTANT** : Vérifier le refresh token pour tous les types d'utilisateurs
4. **NORMAL** : Vérifier que tout fonctionne comme avant les modifications

