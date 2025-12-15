# Plan de Test - Nouvelles Fonctionnalités

**Date :** 2025-02-XX  
**Fonctionnalités testées :** Skip-the-Line, Refresh Tokens, Health Check, Logging, SEO

---

## 🧪 Tests Skip-the-Line

### Test 1 : Création Produit avec Skip-the-Line
**Objectif :** Vérifier qu'un opérateur peut activer skip-the-line sur un produit

**Étapes :**
1. Se connecter en tant qu'opérateur
2. Aller sur `/operator/products/new`
3. Remplir les champs obligatoires (titre, description, prix, etc.)
4. Dans la section "Skip-the-Line" :
   - ✅ Cocher "Activer Skip-the-Line pour ce produit"
   - ✅ Sélectionner un type (Fast Track, VIP, Early Access)
   - ✅ Entrer un prix supplémentaire (ex: 50 MAD)
   - ✅ Ajouter une description personnalisée
5. Sauvegarder le produit

**Résultat attendu :**
- ✅ Produit créé avec succès
- ✅ Badge "Skip-the-Line" visible sur le produit
- ✅ Badge affiché avec icône ⚡ et couleur #F59E0B

**Critères de succès :**
- [ ] Produit visible dans la liste des produits opérateur
- [ ] Badge "Skip-the-Line" présent sur ProductCard
- [ ] Badge présent sur ProductDetailPage
- [ ] Informations skip-the-line visibles dans le formulaire d'édition

---

### Test 2 : Filtre Recherche Skip-the-Line
**Objectif :** Vérifier que le filtre skip-the-line fonctionne dans la recherche

**Étapes :**
1. Aller sur `/search`
2. Ouvrir "Filtres Avancés"
3. Cocher "Skip-the-Line"
4. Cliquer sur "Rechercher"

**Résultat attendu :**
- ✅ Seuls les produits avec skip-the-line activé sont affichés
- ✅ Tous les produits affichés ont le badge "Skip-the-Line"

**Critères de succès :**
- [ ] Filtre fonctionne correctement
- [ ] Compteur filtres actifs affiche "1"
- [ ] Résultats filtrés correctement
- [ ] Badge visible sur tous les produits filtrés

---

### Test 3 : Badge Automatique Skip-the-Line
**Objectif :** Vérifier que le badge est attribué automatiquement

**Étapes :**
1. Créer un produit avec skip-the-line activé
2. Vérifier que le badge est présent immédiatement
3. Vérifier dans la base de données que le badge est bien assigné

**Résultat attendu :**
- ✅ Badge "Skip-the-Line" présent dans `product.badges`
- ✅ Badge visible sur toutes les pages (liste, détail)

**Critères de succès :**
- [ ] Badge présent dans la réponse API `/api/products/:id`
- [ ] Badge visible sur ProductCard
- [ ] Badge visible sur ProductDetailPage
- [ ] Badge présent dans `/api/badges/product/:id`

---

## 🔐 Tests Refresh Tokens

### Test 4 : Login et Stockage Refresh Token
**Objectif :** Vérifier que le refresh token est stocké lors du login

**Étapes :**
1. Aller sur `/login`
2. Se connecter avec un compte valide
3. Ouvrir la console développeur
4. Vérifier `localStorage.getItem('userInfo')`

**Résultat attendu :**
- ✅ `userInfo` contient `accessToken` et `refreshToken`
- ✅ Les deux tokens sont présents et valides

**Critères de succès :**
- [ ] `accessToken` présent dans localStorage
- [ ] `refreshToken` présent dans localStorage
- [ ] Tokens sont des strings non vides
- [ ] Format JSON valide

---

### Test 5 : Refresh Automatique Access Token
**Objectif :** Vérifier que le refresh automatique fonctionne

**Étapes :**
1. Se connecter et noter l'access token
2. Modifier manuellement l'access token dans localStorage (simuler expiration)
3. Faire une requête API (ex: `/api/auth/me`)
4. Observer la console développeur

**Résultat attendu :**
- ✅ Requête initiale retourne 401
- ✅ Intercepteur axios détecte l'erreur
- ✅ Refresh token appelé automatiquement
- ✅ Nouveau access token obtenu
- ✅ Requête originale réessayée avec succès

**Critères de succès :**
- [ ] Refresh automatique fonctionne
- [ ] Nouveau token stocké dans localStorage
- [ ] Requête originale réussit après refresh
- [ ] Pas de boucle infinie

---

### Test 6 : Logout avec Révocation Token
**Objectif :** Vérifier que le logout révoque le refresh token

**Étapes :**
1. Se connecter
2. Noter le refresh token
3. Se déconnecter
4. Vérifier dans la base de données que le refresh token est supprimé

**Résultat attendu :**
- ✅ Refresh token supprimé de `user.refreshTokens`
- ✅ localStorage vidé
- ✅ Utilisateur redirigé vers `/login`

**Critères de succès :**
- [ ] Refresh token supprimé côté backend
- [ ] localStorage vidé
- [ ] Redirection vers login
- [ ] Tentative de refresh avec ancien token échoue

---

## 🏥 Tests Health Check

### Test 7 : Health Check Endpoint
**Objectif :** Vérifier que l'endpoint health check fonctionne

**Étapes :**
1. Appeler `GET /api/health`
2. Vérifier la réponse JSON

**Résultat attendu :**
```json
{
  "status": "ok",
  "timestamp": "2025-02-XX...",
  "uptime": 12345,
  "environment": "production",
  "version": "1.0.0",
  "services": {
    "database": "connected"
  }
}
```

**Critères de succès :**
- [ ] Status code 200
- [ ] Status "ok" si DB connectée
- [ ] Uptime présent et positif
- [ ] Database status "connected"
- [ ] Timestamp présent et valide

---

### Test 8 : Health Check avec DB Déconnectée
**Objectif :** Vérifier le comportement si DB déconnectée

**Étapes :**
1. Déconnecter la base de données (simuler)
2. Appeler `GET /api/health`
3. Vérifier la réponse

**Résultat attendu :**
```json
{
  "status": "degraded",
  "services": {
    "database": "disconnected"
  }
}
```

**Critères de succès :**
- [ ] Status code 503 ou 200 avec status "degraded"
- [ ] Database status "disconnected"
- [ ] Message clair dans la réponse

---

## 📝 Tests Logging Structuré

### Test 9 : Logs Sécurité - Failed Login
**Objectif :** Vérifier que les tentatives de login échouées sont loggées

**Étapes :**
1. Tenter de se connecter avec un mauvais mot de passe
2. Vérifier les logs backend (console ou fichier)

**Résultat attendu :**
```json
{
  "timestamp": "2025-02-XX...",
  "level": "WARN",
  "message": "Failed login attempt",
  "type": "SECURITY",
  "event": "FAILED_LOGIN",
  "email": "test@example.com",
  "ip": "127.0.0.1",
  "attempts": 1
}
```

**Critères de succès :**
- [ ] Log format JSON valide
- [ ] Event "FAILED_LOGIN" présent
- [ ] Email et IP présents
- [ ] Nombre de tentatives correct

---

### Test 10 : Logs Sécurité - Account Locked
**Objectif :** Vérifier que le verrouillage de compte est loggé

**Étapes :**
1. Tenter 5 connexions avec mauvais mot de passe
2. Vérifier les logs

**Résultat attendu :**
```json
{
  "timestamp": "2025-02-XX...",
  "level": "ERROR",
  "message": "Account locked",
  "type": "SECURITY",
  "event": "ACCOUNT_LOCKED",
  "email": "test@example.com",
  "ip": "127.0.0.1",
  "lockedUntil": "2025-02-XX..."
}
```

**Critères de succès :**
- [ ] Log ERROR niveau
- [ ] Event "ACCOUNT_LOCKED" présent
- [ ] lockedUntil présent et valide
- [ ] Email et IP présents

---

### Test 11 : Logs Sécurité - Rate Limit
**Objectif :** Vérifier que les rate limits sont loggés

**Étapes :**
1. Faire plus de 5 requêtes login en 15 minutes
2. Vérifier les logs

**Résultat attendu :**
```json
{
  "timestamp": "2025-02-XX...",
  "level": "WARN",
  "message": "Rate limit exceeded",
  "type": "SECURITY",
  "event": "RATE_LIMIT_EXCEEDED",
  "ip": "127.0.0.1",
  "endpoint": "/api/auth/login",
  "limit": 5
}
```

**Critères de succès :**
- [ ] Log WARN niveau
- [ ] Event "RATE_LIMIT_EXCEEDED" présent
- [ ] Endpoint et limit présents
- [ ] IP présente

---

## 🔍 Tests SEO

### Test 12 : Pages Destinations Accessibles
**Objectif :** Vérifier que les pages destinations sont accessibles

**Étapes :**
1. Aller sur `/destinations/Marrakech`
2. Vérifier le contenu affiché
3. Répéter pour autres villes (Casablanca, Fès, Rabat, Tanger, Agadir)

**Résultat attendu :**
- ✅ Page charge correctement
- ✅ Hero section avec image et description
- ✅ Highlights de la destination affichés
- ✅ Liste de produits affichée
- ✅ Filtre par catégorie fonctionnel

**Critères de succès :**
- [ ] Page accessible sans erreur 404
- [ ] Contenu dynamique chargé
- [ ] Produits affichés correctement
- [ ] Filtres fonctionnels
- [ ] Liens vers produits fonctionnels

---

### Test 13 : Pages Catégories Accessibles
**Objectif :** Vérifier que les pages catégories sont accessibles

**Étapes :**
1. Aller sur `/categories/Tours`
2. Vérifier le contenu affiché
3. Répéter pour autres catégories

**Résultat attendu :**
- ✅ Page charge correctement
- ✅ Hero section avec icône et description
- ✅ Liste de produits affichée
- ✅ Filtre par destination fonctionnel

**Critères de succès :**
- [ ] Page accessible sans erreur 404
- [ ] Contenu dynamique chargé
- [ ] Produits affichés correctement
- [ ] Filtres fonctionnels
- [ ] Liens vers destinations fonctionnels

---

### Test 14 : Sitemap XML Généré
**Objectif :** Vérifier que le sitemap XML est généré correctement

**Étapes :**
1. Appeler `GET /api/sitemap.xml`
2. Vérifier le format XML
3. Vérifier que toutes les pages sont incluses

**Résultat attendu :**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://overglow-v1-3jqp.vercel.app/</loc>
    ...
  </url>
  ...
</urlset>
```

**Critères de succès :**
- [ ] Format XML valide
- [ ] Homepage incluse
- [ ] Pages destinations incluses
- [ ] Pages catégories incluses
- [ ] Produits inclus avec lastmod
- [ ] Content-Type: application/xml

---

### Test 15 : Schema.org Markup
**Objectif :** Vérifier que le schema.org markup est présent

**Étapes :**
1. Aller sur `/products/:id` (produit existant)
2. Ouvrir les outils développeur
3. Vérifier le script JSON-LD dans `<head>`

**Résultat attendu :**
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "...",
  "description": "...",
  "image": [...],
  "offers": {
    "@type": "Offer",
    "price": 100,
    "priceCurrency": "MAD"
  }
}
```

**Critères de succès :**
- [ ] Script JSON-LD présent dans `<head>`
- [ ] Format JSON valide
- [ ] Type "Product" correct
- [ ] Informations produit présentes
- [ ] Offers avec prix et devise
- [ ] AggregateRating si disponible

---

### Test 16 : Organization Schema
**Objectif :** Vérifier que le schema Organization est présent

**Étapes :**
1. Aller sur n'importe quelle page
2. Vérifier le source HTML
3. Chercher le script JSON-LD Organization

**Résultat attendu :**
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Overglow Trip",
  "url": "https://overglow-v1-3jqp.vercel.app",
  ...
}
```

**Critères de succès :**
- [ ] Script JSON-LD présent dans `index.html`
- [ ] Type "Organization" correct
- [ ] Nom, URL, logo présents
- [ ] Description présente
- [ ] Format JSON valide

---

### Test 17 : Robots.txt Accessible
**Objectif :** Vérifier que robots.txt est accessible

**Étapes :**
1. Appeler `GET /robots.txt`
2. Vérifier le contenu

**Résultat attendu :**
```
User-agent: *
Allow: /

Sitemap: https://overglow-v1-3jqp.vercel.app/api/sitemap.xml
```

**Critères de succès :**
- [ ] Fichier accessible
- [ ] User-agent: * présent
- [ ] Allow: / présent
- [ ] Sitemap URL présente et correcte
- [ ] Content-Type: text/plain

---

## 📋 Checklist de Test Complète

### Skip-the-Line
- [ ] Test 1 : Création produit avec skip-the-line
- [ ] Test 2 : Filtre recherche skip-the-line
- [ ] Test 3 : Badge automatique skip-the-line

### Refresh Tokens
- [ ] Test 4 : Login et stockage refresh token
- [ ] Test 5 : Refresh automatique access token
- [ ] Test 6 : Logout avec révocation token

### Health Check
- [ ] Test 7 : Health check endpoint (DB connectée)
- [ ] Test 8 : Health check endpoint (DB déconnectée)

### Logging
- [ ] Test 9 : Logs failed login
- [ ] Test 10 : Logs account locked
- [ ] Test 11 : Logs rate limit

### SEO
- [ ] Test 12 : Pages destinations accessibles
- [ ] Test 13 : Pages catégories accessibles
- [ ] Test 14 : Sitemap XML généré
- [ ] Test 15 : Schema.org Product markup
- [ ] Test 16 : Schema.org Organization markup
- [ ] Test 17 : Robots.txt accessible

---

## 🐛 Tests de Régression

### Test 18 : Vérifier que les fonctionnalités existantes fonctionnent toujours
**Objectif :** S'assurer que les nouvelles fonctionnalités n'ont pas cassé l'existant

**Étapes :**
1. Tester login normal (sans refresh)
2. Tester création produit normale (sans skip-the-line)
3. Tester recherche normale (sans filtres)
4. Tester booking normal
5. Tester toutes les pages principales

**Critères de succès :**
- [ ] Toutes les fonctionnalités existantes fonctionnent
- [ ] Pas d'erreurs console
- [ ] Pas d'erreurs réseau
- [ ] Performance acceptable

---

## 📊 Résultats Attendus

### Taux de Succès
- **Objectif :** 100% des tests passent
- **Acceptable :** 95% des tests passent (avec bugs mineurs documentés)

### Temps de Test Estimé
- **Tests manuels :** ~2-3 heures
- **Tests automatisés :** ~30 minutes (si scripts créés)

---

## 🔧 Outils de Test Recommandés

### Tests Manuels
- Navigateur Chrome/Firefox avec DevTools
- Postman/Insomnia pour tests API
- MongoDB Compass pour vérification DB

### Tests Automatisés (Optionnel)
- Jest pour tests unitaires
- Cypress/Playwright pour tests E2E
- Supertest pour tests API

---

**Fin du Plan de Test**

