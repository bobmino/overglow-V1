# Audit de Sécurité - Overglow V1

**Date :** 2025-02-XX  
**Version Audité :** 1.0  
**Statut :** Production

---

## 1. Résumé Exécutif

### 1.1 Portée
Audit de sécurité complet de la plateforme Overglow V1, incluant :
- Authentification et autorisation
- Validation et sanitization des données
- Protection contre les vulnérabilités courantes
- Configuration CORS et headers sécurité
- Gestion des fichiers uploads
- Sécurité API

### 1.2 Méthodologie
- Analyse statique du code
- Revue des configurations
- Tests manuels des endpoints critiques
- Vérification des bonnes pratiques

---

## 2. Authentification et Autorisation

### 2.1 Points Positifs ✅
- ✅ Hashage mots de passe avec bcrypt (10 rounds)
- ✅ JWT pour authentification
- ✅ Middleware `protect` sur routes sensibles
- ✅ Middleware `authorize` pour vérification rôles
- ✅ Vérification token JWT avant accès routes protégées

### 2.2 Vulnérabilités Identifiées ⚠️

#### 2.2.1 JWT_SECRET Manquant
**Sévérité :** CRITIQUE  
**Description :** Si `JWT_SECRET` n'est pas défini, l'authentification échoue  
**Localisation :** `utils/generateToken.js`, `backend/controllers/authController.js`  
**Impact :** Impossible de se connecter, erreur 500  
**Recommandation :** 
- ✅ Vérification ajoutée dans `authController.js`
- ⚠️ S'assurer que `JWT_SECRET` est défini sur Vercel
- ⚠️ Utiliser un secret fort (min 32 caractères aléatoires)

#### 2.2.2 Pas de Refresh Tokens
**Sévérité :** MOYENNE  
**Description :** Tokens JWT n'expirent pas, pas de mécanisme de refresh  
**Impact :** Tokens volés restent valides indéfiniment  
**Recommandation :** 
- Implémenter refresh tokens avec expiration courte (15 min)
- Access token expiration : 1 heure
- Refresh token expiration : 7 jours
- Endpoint `/api/auth/refresh`

#### 2.2.3 Pas de Rate Limiting
**Sévérité :** MOYENNE  
**Description :** Pas de limitation de tentatives de connexion  
**Impact :** Attaques brute force possibles  
**Recommandation :** 
- Implémenter rate limiting (express-rate-limit)
- 5 tentatives max par IP/15 min sur `/api/auth/login`
- 10 tentatives max par IP/15 min sur `/api/auth/register`

**Code recommandé :**
```javascript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives
  message: 'Trop de tentatives, réessayez plus tard',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

---

## 3. Validation et Sanitization

### 3.1 Points Positifs ✅
- ✅ express-validator utilisé pour validation
- ✅ Validation backend sur tous les endpoints sensibles
- ✅ Mongoose schemas avec validation
- ✅ Types de données vérifiés

### 3.2 Vulnérabilités Identifiées ⚠️

#### 3.2.1 Sanitization Inputs Manquante
**Sévérité :** MOYENNE  
**Description :** Pas de sanitization explicite des inputs utilisateur  
**Impact :** Risque XSS si données affichées sans échappement  
**Recommandation :** 
- Utiliser `express-validator` avec `.trim()`, `.escape()`
- React échappe automatiquement, mais vérifier données backend
- Sanitizer HTML pour champs riches (descriptions)

**Code recommandé :**
```javascript
import { body } from 'express-validator';

body('description')
  .trim()
  .escape() // Échappe HTML
  .isLength({ max: 5000 })
```

#### 3.2.2 Validation Fichiers Upload
**Sévérité :** MOYENNE  
**Description :** Validation type/taille fichiers présente mais à renforcer  
**Impact :** Upload fichiers malveillants possible  
**Recommandation :** 
- ✅ Vérifier type MIME (pas seulement extension)
- ✅ Limiter taille (max 5MB par image)
- ✅ Scanner fichiers avec antivirus (optionnel)
- ✅ Renommer fichiers avec hash pour éviter collisions

---

## 4. Injection et Protection Données

### 4.1 Points Positifs ✅
- ✅ Mongoose protège contre injection NoSQL
- ✅ Paramètres queries échappés automatiquement
- ✅ Pas d'utilisation directe de `eval()` ou `Function()`

### 4.2 Vulnérabilités Identifiées ⚠️

#### 4.2.1 Requêtes MongoDB Non Sécurisées
**Sévérité :** FAIBLE  
**Description :** Certaines requêtes utilisent `req.query` directement  
**Impact :** Risque d'injection si requêtes mal construites  
**Recommandation :** 
- Toujours valider et sanitizer `req.query` avant utilisation
- Utiliser opérateurs Mongoose plutôt que strings brutes

**Exemple sécurisé :**
```javascript
// ❌ Non sécurisé
const products = await Product.find({ status: req.query.status });

// ✅ Sécurisé
const allowedStatuses = ['Published', 'Pending', 'Draft'];
const status = allowedStatuses.includes(req.query.status) 
  ? req.query.status 
  : 'Published';
const products = await Product.find({ status });
```

---

## 5. CORS et Headers Sécurité

### 5.1 Points Positifs ✅
- ✅ CORS configuré avec origines autorisées
- ✅ Credentials supportés
- ✅ OPTIONS preflight géré
- ✅ Headers CORS définis dans `api/index.js` et `server.js`

### 5.2 Vulnérabilités Identifiées ⚠️

#### 5.2.1 Headers Sécurité Manquants
**Sévérité :** MOYENNE  
**Description :** Headers sécurité standards manquants  
**Impact :** Risques XSS, clickjacking, MIME sniffing  
**Recommandation :** Ajouter middleware sécurité

**Code recommandé :**
```javascript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Headers personnalisés
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
```

#### 5.2.2 CORS Trop Permissif
**Sévérité :** FAIBLE  
**Description :** CORS accepte toutes origines Vercel (`*.vercel.app`)  
**Impact :** Risque si sous-domaine compromis  
**Recommandation :** 
- Lister explicitement les domaines autorisés
- Ne pas utiliser wildcards pour production

---

## 6. Gestion des Erreurs

### 6.1 Points Positifs ✅
- ✅ Middleware erreur global (`errorMiddleware.js`)
- ✅ Messages erreur génériques en production
- ✅ Logs détaillés en développement

### 6.2 Vulnérabilités Identifiées ⚠️

#### 6.2.1 Exposition Stack Traces
**Sévérité :** MOYENNE  
**Description :** Stack traces exposés dans réponses API (développement)  
**Impact :** Fuite informations sensibles (chemins fichiers, structure code)  
**Recommandation :** 
- ✅ Déjà géré avec `process.env.NODE_ENV === 'development'`
- ⚠️ S'assurer que `NODE_ENV=production` sur Vercel
- Ne jamais exposer stack traces en production

---

## 7. Gestion des Sessions

### 7.1 Points Positifs ✅
- ✅ JWT stateless (pas de sessions serveur)
- ✅ Tokens stockés localStorage côté client

### 7.2 Vulnérabilités Identifiées ⚠️

#### 7.2.1 localStorage pour Tokens
**Sévérité :** MOYENNE  
**Description :** Tokens JWT stockés dans localStorage  
**Impact :** Vulnérable aux attaques XSS  
**Recommandation :** 
- Option 1 : Utiliser httpOnly cookies (plus sécurisé)
- Option 2 : Garder localStorage mais renforcer protection XSS
- Implémenter CSP (Content Security Policy) strict

---

## 8. Sécurité API

### 8.1 Points Positifs ✅
- ✅ Routes protégées avec middleware
- ✅ Vérification rôles avant actions sensibles
- ✅ Validation IDs ObjectId avant requêtes

### 8.2 Vulnérabilités Identifiées ⚠️

#### 8.2.1 IDOR (Insecure Direct Object Reference)
**Sévérité :** MOYENNE  
**Description :** Vérification propriétaire parfois manquante  
**Impact :** Accès non autorisé à ressources d'autres utilisateurs  
**Recommandation :** 
- Toujours vérifier que l'utilisateur est propriétaire avant modification/suppression
- Exemple : Vérifier `booking.user === req.user._id` avant annulation

**Code recommandé :**
```javascript
const booking = await Booking.findById(req.params.id);
if (!booking) return res.status(404).json({ message: 'Not found' });
if (booking.user.toString() !== req.user._id.toString()) {
  return res.status(403).json({ message: 'Not authorized' });
}
```

#### 8.2.2 Mass Assignment
**Sévérité :** FAIBLE  
**Description :** Certains endpoints acceptent `req.body` directement  
**Impact :** Modification champs non autorisés  
**Recommandation :** 
- Utiliser whitelist des champs autorisés
- Ne jamais faire `Object.assign(product, req.body)`

**Code recommandé :**
```javascript
const allowedFields = ['title', 'description', 'price'];
const updates = {};
allowedFields.forEach(field => {
  if (req.body[field] !== undefined) {
    updates[field] = req.body[field];
  }
});
await Product.findByIdAndUpdate(id, updates);
```

---

## 9. Sécurité Paiements

### 9.1 Points Positifs ✅
- ✅ Stripe Payment Intents utilisés
- ✅ Pas de stockage données cartes
- ✅ Validation montants côté serveur

### 9.2 Vulnérabilités Identifiées ⚠️

#### 9.2.1 Validation Montants
**Sévérité :** CRITIQUE  
**Description :** Vérifier que montants ne sont pas modifiés côté client  
**Impact :** Paiement montant incorrect  
**Recommandation :** 
- ✅ Déjà fait : recalcul montant côté serveur avant paiement
- ⚠️ Toujours recalculer depuis schedule/product, jamais faire confiance au client

---

## 10. Recommandations Prioritaires

### 10.1 Critique (À faire immédiatement)
1. ✅ Vérifier `JWT_SECRET` défini sur Vercel
2. ⚠️ Ajouter rate limiting sur `/api/auth/login` et `/api/auth/register`
3. ⚠️ Ajouter headers sécurité (helmet)
4. ⚠️ Vérifier `NODE_ENV=production` sur Vercel

### 10.2 Haute Priorité (Semaine prochaine)
1. Implémenter refresh tokens
2. Renforcer validation fichiers upload (type MIME)
3. Ajouter vérifications IDOR sur tous les endpoints
4. Sanitization explicite des inputs

### 10.3 Moyenne Priorité (Mois prochain)
1. Migrer tokens localStorage → httpOnly cookies
2. Implémenter CSP strict
3. Ajouter logging sécurité (tentatives échouées)
4. Audit dépendances (npm audit)

---

## 11. Checklist Sécurité

### 11.1 Configuration
- [ ] `JWT_SECRET` défini et fort (32+ caractères)
- [ ] `NODE_ENV=production` sur Vercel
- [ ] Toutes variables d'environnement définies
- [ ] MongoDB Atlas avec IP whitelist
- [ ] CORS configuré avec domaines spécifiques

### 11.2 Code
- [ ] Rate limiting implémenté
- [ ] Headers sécurité (helmet)
- [ ] Validation tous les inputs
- [ ] Sanitization inputs utilisateur
- [ ] Vérifications IDOR sur endpoints sensibles
- [ ] Gestion erreurs sans exposition stack traces

### 11.3 Dépendances
- [ ] `npm audit` sans vulnérabilités critiques
- [ ] Dépendances à jour
- [ ] Pas de dépendances dépréciées

### 11.4 Monitoring
- [ ] Logs erreurs activés
- [ ] Alertes sécurité configurées
- [ ] Monitoring tentatives échouées

---

## 12. Tests de Sécurité Recommandés

### 12.1 Tests Manuels
- [ ] Tentative connexion avec mauvais mot de passe (5x) → rate limit
- [ ] Accès route protégée sans token → 401
- [ ] Accès route admin avec token client → 403
- [ ] Modification ressource d'un autre utilisateur → 403
- [ ] Upload fichier non-image → rejeté
- [ ] Injection SQL/NoSQL dans recherche → échoué

### 12.2 Tests Automatisés (À implémenter)
- Tests unitaires validation
- Tests intégration authentification
- Tests sécurité API (OWASP ZAP, Burp Suite)
- Scans vulnérabilités dépendances

---

## 13. Conclusion

### 13.1 Score Global
**Sécurité :** 7/10

### 13.2 Points Forts
- Architecture sécurisée avec JWT
- Validation backend présente
- Protection injection NoSQL (Mongoose)
- CORS configuré

### 13.3 Points à Améliorer
- Rate limiting manquant
- Headers sécurité à ajouter
- Refresh tokens à implémenter
- Vérifications IDOR à renforcer

### 13.4 Prochaines Étapes
1. Implémenter recommandations critiques (semaine 1)
2. Implémenter recommandations haute priorité (semaine 2-3)
3. Audit dépendances mensuel
4. Tests sécurité automatisés

---

**Fin de l'Audit de Sécurité**

