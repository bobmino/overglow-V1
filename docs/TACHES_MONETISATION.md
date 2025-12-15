# Tâches Techniques Prioritaires - Monétisation

**Date :** 2025-02-XX  
**Objectif :** Produit opérationnel, ergonomique, riche, fluide et optimisé pour la monétisation

---

## 🔴 PRIORITÉ CRITIQUE - Bloquants Monétisation

### 1. Paiements Fonctionnels (BLOQUANT)
**Problème :** Paiements en mode mock/placeholder → **Impossible de monétiser**

**Tâches techniques :**
1. **Stripe Production**
   - [ ] Configurer clés Stripe production dans Vercel ENV
   - [ ] Tester création PaymentIntent avec vraies clés
   - [ ] Implémenter webhooks Stripe (confirmation paiement)
   - [ ] Gérer erreurs paiement (carte refusée, fonds insuffisants)
   - [ ] Tester flux complet : intent → paiement → webhook → confirmation

2. **PayPal Production**
   - [ ] Configurer clés PayPal production dans Vercel ENV
   - [ ] Passer de Sandbox à Production
   - [ ] Tester création order PayPal
   - [ ] Implémenter webhooks PayPal
   - [ ] Gérer cas échec PayPal

3. **CMI (Paiements Locaux Maroc)**
   - [ ] Finaliser intégration CMI complète
   - [ ] Tester avec vraies cartes bancaires marocaines
   - [ ] Gérer callbacks CMI (success, failure)
   - [ ] Gérer timeout CMI

4. **Multi-devise dans Paiements**
   - [ ] Conversion automatique avant paiement (MAD ↔ € ↔ USD)
   - [ ] Afficher montant dans devise sélectionnée
   - [ ] Envoyer montant correct à Stripe/PayPal/CMI
   - [ ] Coherence devise affichée vs devise payée

5. **Gestion Skip-the-Line dans Prix**
   - [ ] Ajouter prix skip-the-line au total si activé
   - [ ] Afficher décomposition prix (base + skip-the-line)
   - [ ] Gérer skip-the-line dans calcul total booking

**Impact :** 🔴 **BLOQUANT** - Sans ça, pas de revenus  
**Temps estimé :** 2-3 jours  
**Fichiers à modifier :**
- `backend/controllers/paymentController.js`
- `frontend/src/components/PaymentSelector.jsx`
- `frontend/src/pages/CheckoutPage.jsx`
- Variables ENV Vercel

---

### 2. Flux Booking Robuste et Testé (BLOQUANT)
**Problème :** Flux peut avoir des bugs non détectés → **Perte de conversions**

**Tâches techniques :**
1. **Tests E2E Flux Critique**
   - [ ] Test complet : Login → Recherche → Détail → Date/Créneau → Booking → Paiement → Confirmation
   - [ ] Tester cas limites :
     - Produit avec inquiry requise
     - Produit avec skip-the-line
     - Produit sans disponibilité
     - Double booking (concurrence)
     - Paiement échoué
     - Annulation

2. **Gestion Disponibilité Réelle**
   - [ ] Vérifier blocage créneaux après booking
   - [ ] Gérer cas double booking (optimistic locking)
   - [ ] Afficher disponibilité en temps réel
   - [ ] Gérer annulation (libérer créneau)

3. **Calcul Prix Correct**
   - [ ] Prix de base + skip-the-line (si activé)
   - [ ] Multi-devise correcte
   - [ ] Réductions fidélité (si applicable)
   - [ ] Taxes/frais (si applicable)

4. **Emails Transactionnels**
   - [ ] Email confirmation booking (client)
   - [ ] Email notification booking (opérateur)
   - [ ] Email confirmation paiement
   - [ ] Email annulation (si applicable)
   - [ ] Templates emails professionnels

**Impact :** 🔴 **BLOQUANT** - Flux principal doit être parfait  
**Temps estimé :** 2-3 jours  
**Fichiers à modifier :**
- `backend/controllers/bookingController.js`
- `frontend/src/pages/BookingPage.jsx`
- `frontend/src/pages/CheckoutPage.jsx`
- `backend/utils/emailService.js`

---

## 🟠 PRIORITÉ HAUTE - Impact Conversion

### 3. Performance et Optimisation (HAUTE PRIORITÉ)
**Problème :** Performance faible = perte de conversions (bounce rate élevé)

**Tâches techniques :**
1. **Optimisation Images**
   - [ ] Compression automatique uploads (sharp ou imagemin)
   - [ ] Formats modernes (WebP avec fallback)
   - [ ] Lazy loading images (Intersection Observer)
   - [ ] Responsive images (srcset)
   - [ ] CDN pour images (Cloudinary ou Vercel Image Optimization)

2. **Optimisation Bundle Frontend**
   - [ ] Code splitting par route (React.lazy)
   - [ ] Lazy loading composants lourds
   - [ ] Tree shaking (supprimer imports inutilisés)
   - [ ] Minification production
   - [ ] Réduire taille bundle (< 500KB initial)

3. **Optimisation Requêtes Backend**
   - [ ] Index MongoDB sur champs fréquents (_id, operator, status, etc.)
   - [ ] Pagination partout (limite 20-50 items)
   - [ ] Select uniquement champs nécessaires (.select())
   - [ ] Cache Redis pour données fréquentes (optionnel mais recommandé)

4. **Performance Lighthouse**
   - [ ] Score > 90 Performance
   - [ ] Score > 90 SEO
   - [ ] Score > 90 Best Practices
   - [ ] Score > 90 Accessibility

5. **Core Web Vitals**
   - [ ] LCP < 2.5s (Largest Contentful Paint)
   - [ ] FID < 100ms (First Input Delay)
   - [ ] CLS < 0.1 (Cumulative Layout Shift)

**Impact :** 🟠 **HAUTE** - Performance = conversions  
**Temps estimé :** 3-4 jours  
**Fichiers à modifier :**
- `frontend/vite.config.js` (optimisation build)
- Composants avec images
- `backend/controllers/*.js` (optimisation requêtes)
- Configuration MongoDB (indexes)

---

### 4. Fonctionnalités Critiques Complètes (HAUTE PRIORITÉ)
**Problème :** Modèles créés mais contrôleurs manquants → **Fonctionnalités incomplètes**

**Tâches techniques :**
1. **Système Notifications Complet**
   - [ ] Créer `backend/controllers/notificationController.js`
   - [ ] Routes `/api/notifications` (GET, PUT, DELETE)
   - [ ] Badge compteur dans Header
   - [ ] Page `NotificationsPage.jsx` complète
   - [ ] Notifications automatiques :
     - Nouvelle réservation → opérateur
     - Produit en attente → admin
     - Review en attente → admin
     - Inquiry reçue → opérateur
     - Inquiry répondue → client
   - [ ] Notifications temps réel (WebSocket ou polling)

2. **Système Withdrawals Complet**
   - [ ] Créer `backend/controllers/withdrawalController.js`
   - [ ] Routes `/api/withdrawals`
   - [ ] Calcul solde disponible opérateurs
   - [ ] Page withdrawals opérateur (`WithdrawalsPage.jsx`)
   - [ ] Page admin withdrawals (`AdminWithdrawalsPage.jsx`)
   - [ ] Intégration remboursements

3. **Système Approval Requests Complet**
   - [ ] Créer `backend/controllers/approvalRequestController.js`
   - [ ] Routes `/api/approval-requests`
   - [ ] Logique délai (relance si pas de réponse > X jours)
   - [ ] Page admin approval requests
   - [ ] Boutons "Demander approbation" dans UI

**Impact :** 🟠 **HAUTE** - Fonctionnalités attendues par utilisateurs  
**Temps estimé :** 3-4 jours  
**Fichiers à créer :**
- `backend/controllers/notificationController.js`
- `backend/controllers/withdrawalController.js`
- `backend/controllers/approvalRequestController.js`
- Routes correspondantes

---

### 5. UX/UI Ergonomique et Fluide (HAUTE PRIORITÉ)
**Problème :** UX peut être améliorée → **Réduction friction = plus de conversions**

**Tâches techniques :**
1. **Amélioration Formulaire Booking**
   - [ ] Validation en temps réel
   - [ ] Messages d'erreur clairs et contextuels
   - [ ] Indicateurs de progression (steps)
   - [ ] Sauvegarde brouillon (localStorage)
   - [ ] Auto-complétion adresses

2. **Amélioration Recherche**
   - [ ] Recherche instantanée (debounce 300ms)
   - [ ] Suggestions pendant la saisie
   - [ ] Filtres persistants (URL params)
   - [ ] Historique recherches
   - [ ] Recherches populaires affichées

3. **Amélioration Pages Produits**
   - [ ] Galerie images améliorée (lightbox)
   - [ ] Avis clients visibles facilement
   - [ ] Partage social (Facebook, WhatsApp, Twitter)
   - [ ] Impression fiche produit
   - [ ] Comparaison produits (optionnel)

4. **Feedback Utilisateur**
   - [ ] Loading states partout (skeletons)
   - [ ] Messages succès/erreur clairs
   - [ ] Confirmations actions importantes
   - [ ] Tooltips pour explications
   - [ ] Empty states informatifs

5. **Mobile-First Amélioré**
   - [ ] Touch gestures (swipe galerie, pull to refresh)
   - [ ] Navigation mobile optimisée
   - [ ] Formulaire mobile adapté
   - [ ] Performance mobile vérifiée

**Impact :** 🟠 **HAUTE** - UX = taux de conversion  
**Temps estimé :** 4-5 jours  
**Fichiers à modifier :**
- `frontend/src/pages/BookingPage.jsx`
- `frontend/src/pages/SearchPage.jsx`
- `frontend/src/pages/ProductDetailPage.jsx`
- Composants UI généraux

---

### 6. SEO et Contenu (HAUTE PRIORITÉ)
**Problème :** SEO partiellement fait → **Trafic organique limité**

**Tâches techniques :**
1. **Meta Tags Dynamiques (React Helmet)**
   - [ ] Installer react-helmet-async
   - [ ] Meta tags par page (title, description, OG)
   - [ ] Images OG dynamiques par produit
   - [ ] Canonical URLs
   - [ ] Hreflang si multilingue

2. **Blog Enrichi**
   - [ ] Créer modèle Blog (`backend/models/blogModel.js`)
   - [ ] Contrôleur blog (`backend/controllers/blogController.js`)
   - [ ] Routes `/api/blog`
   - [ ] Page blog avec articles (`BlogPage.jsx`)
   - [ ] Articles SEO optimisés :
     - Guides Maroc (top 10 destinations, meilleures expériences)
     - Culture marocaine (traditions, fêtes, artisanat)
     - Conseils pratiques (quand visiter, quoi apporter)
   - [ ] Catégories blog
   - [ ] Recherche blog
   - [ ] Partage social articles

3. **Contenu Riche Pages Destinations**
   - [ ] Enrichir descriptions villes (500+ mots)
   - [ ] Ajouter images réelles (Unsplash ou stock)
   - [ ] Guides locaux détaillés
   - [ ] Conseils pratiques par ville

4. **Structured Data Enrichi**
   - [ ] Breadcrumbs schema.org
   - [ ] FAQ schema.org (si FAQ sur page)
   - [ ] Review schema.org amélioré
   - [ ] Event schema.org (pour produits événements)

**Impact :** 🟠 **HAUTE** - SEO = trafic organique = conversions  
**Temps estimé :** 3-4 jours  
**Fichiers à créer/modifier :**
- `backend/models/blogModel.js`
- `backend/controllers/blogController.js`
- `frontend/src/pages/BlogPage.jsx`
- `frontend/src/pages/DestinationPage.jsx` (enrichir)
- `frontend/src/components/Helmet.jsx` (wrapper)

---

## 🟡 PRIORITÉ MOYENNE - Amélioration Continue

### 7. Monitoring et Analytics
**Tâches techniques :**
- [ ] Analytics événements (Google Analytics 4)
- [ ] Tracking conversions (view → booking → payment)
- [ ] Funnel de conversion
- [ ] Monitoring erreurs production (Sentry)
- [ ] Dashboard analytics admin

**Impact :** 🟡 **MOYENNE** - Important pour optimisation continue  
**Temps estimé :** 2-3 jours

---

### 8. Tests et Qualité
**Tâches techniques :**
- [ ] Tests E2E flux critiques (Cypress/Playwright)
- [ ] Tests sur différents navigateurs
- [ ] Tests sur mobile (iOS/Android)
- [ ] Tests accessibilité
- [ ] Documentation utilisateur

**Impact :** 🟡 **MOYENNE** - Qualité = confiance = conversions  
**Temps estimé :** 3-4 jours

---

## 📊 Plan d'Exécution Recommandé

### Semaine 1 : Bloquants Monétisation
**Jours 1-2 :** Paiements fonctionnels (Stripe, PayPal, CMI)  
**Jours 3-4 :** Flux booking complet et testé  
**Jour 5 :** Tests E2E complets

### Semaine 2 : Performance et UX
**Jours 1-2 :** Optimisation images et bundle  
**Jours 3-4 :** UX/UI améliorations  
**Jour 5 :** Performance Lighthouse

### Semaine 3 : Fonctionnalités et SEO
**Jours 1-2 :** Notifications, Withdrawals, Approval Requests  
**Jours 3-4 :** SEO et contenu (meta tags, blog)  
**Jour 5 :** Tests finaux et corrections

---

## 🎯 Critères de Succès Monétisation

### Technique
- ✅ Paiements fonctionnels à 100%
- ✅ Flux booking sans bugs
- ✅ Performance Lighthouse > 90
- ✅ Temps chargement < 3s
- ✅ Taux erreur < 0.1%

### Business
- ✅ Taux conversion vues → booking > 3%
- ✅ Taux conversion booking → paiement > 80%
- ✅ Taux abandon panier < 20%
- ✅ Temps moyen sur site > 3min
- ✅ Pages vues par session > 5

---

## ⚠️ Risques et Mitigation

### Risque 1 : Paiements non fonctionnels
**Impact :** 🔴 Critique  
**Mitigation :** Priorité absolue, tests complets avant mise en prod

### Risque 2 : Performance faible
**Impact :** 🟠 Haute  
**Mitigation :** Optimisation continue, monitoring performance

### Risque 3 : Bugs en production
**Impact :** 🟠 Haute  
**Mitigation :** Tests complets, monitoring erreurs, rollback rapide

---

## 📝 Ordre d'Exécution Recommandé

1. **CRITIQUE** : Paiements + Flux booking (Semaine 1)
2. **HAUTE** : Performance + UX + Fonctionnalités critiques (Semaine 2)
3. **MOYENNE** : SEO + Monitoring + Tests (Semaine 3)

---

**Dernière mise à jour :** Session actuelle

