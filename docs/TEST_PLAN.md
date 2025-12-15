# Plan de Test - Overglow V1

**Version :** 1.0  
**Date :** 2025-02-XX  
**Responsable :** Équipe QA

---

## 1. Tests d'Authentification et Autorisation

### 1.1 Inscription Utilisateur
**Page :** `/register`  
**Scénarios :**
- ✅ Inscription client avec email valide
- ✅ Inscription opérateur avec email valide
- ✅ Validation : email déjà existant → erreur
- ✅ Validation : mot de passe trop court → erreur
- ✅ Validation : confirmation mot de passe différente → erreur
- ✅ Création automatique profil opérateur si rôle "Opérateur"
- ✅ Redirection après inscription réussie
- ✅ Accessibilité : labels, aria, autocomplete

**Données de test :**
- Email valide : `test@example.com`
- Email invalide : `test@`, `test.com`
- Mot de passe valide : `Password123!`
- Mot de passe invalide : `123` (trop court)

### 1.2 Connexion
**Page :** `/login`  
**Scénarios :**
- ✅ Connexion avec identifiants valides
- ✅ Connexion avec email inexistant → erreur
- ✅ Connexion avec mot de passe incorrect → erreur
- ✅ Mémorisation de session (localStorage)
- ✅ Redirection selon rôle (Client → Dashboard, Opérateur → Operator Dashboard)
- ✅ Gestion erreur 500 (JWT_SECRET manquant)
- ✅ Accessibilité : labels, aria, autocomplete

### 1.3 Autorisation
**Scénarios :**
- ✅ Client ne peut pas accéder aux pages opérateur
- ✅ Opérateur ne peut pas accéder aux pages admin
- ✅ Admin peut accéder à toutes les pages
- ✅ Routes protégées redirigent vers login si non authentifié
- ✅ Token JWT expiré → redirection login

---

## 2. Tests Produits et Recherche

### 2.1 Recherche de Produits
**Page :** `/search`  
**Scénarios :**
- ✅ Recherche par mot-clé (titre, description)
- ✅ Filtres : prix min/max
- ✅ Filtres : durée
- ✅ Filtres : note minimale
- ✅ Filtres : catégorie
- ✅ Filtres : ville
- ✅ Filtres : date
- ✅ Tri : pertinence, prix croissant/décroissant, note, popularité
- ✅ Recherche géolocalisée (rayon en km)
- ✅ Pagination des résultats
- ✅ Affichage badges sur résultats
- ✅ Affichage prix multi-devise (MAD/€/USD)

### 2.2 Page Détail Produit
**Page :** `/products/:id`  
**Scénarios :**
- ✅ Affichage informations produit complètes
- ✅ Galerie d'images (lazy loading)
- ✅ Badges produit et opérateur affichés
- ✅ Prix converti selon devise sélectionnée
- ✅ Calendrier de disponibilité
- ✅ Sélection créneaux horaires
- ✅ Bouton "Réserver" fonctionnel
- ✅ Bouton "Ajouter aux favoris"
- ✅ Section avis avec filtres
- ✅ Bouton "Poser une question" (Inquiry)
- ✅ Accessibilité : labels, aria, focus

### 2.3 Création/Édition Produit (Opérateur)
**Page :** `/operator/products/new`, `/operator/products/:id/edit`  
**Scénarios :**
- ✅ Création produit avec tous les champs requis
- ✅ Upload images multiples
- ✅ Validation : prix requis pour publication
- ✅ Validation : durée requise
- ✅ Gestion highlights, included, requirements (listes dynamiques)
- ✅ Sélection type inquiry (manual, automatic, none)
- ✅ Sauvegarde brouillon
- ✅ Soumission pour approbation
- ✅ Édition produit existant
- ✅ Accessibilité : tous les champs avec labels/id/htmlFor

---

## 3. Tests Réservation et Paiement

### 3.1 Processus de Réservation
**Pages :** `/products/:id` → `/booking` → `/checkout` → `/booking-success`  
**Scénarios :**
- ✅ Sélection date disponible
- ✅ Sélection créneau horaire
- ✅ Sélection nombre de tickets
- ✅ Calcul prix total correct
- ✅ Vérification disponibilité avant réservation
- ✅ Création réservation avec statut "Pending"
- ✅ Confirmation réservation après paiement
- ✅ Email de confirmation envoyé
- ✅ Notification opérateur de nouvelle réservation

### 3.2 Paiement
**Page :** `/checkout`  
**Scénarios :**
- ✅ Sélection méthode paiement (Stripe, PayPal, CMI, Cash Pickup, Cash Delivery)
- ✅ Paiement Stripe avec carte valide
- ✅ Paiement PayPal (mock/test)
- ✅ Paiement CMI (redirection gateway)
- ✅ Paiement espèces sur place
- ✅ Paiement à la livraison
- ✅ Conversion prix MAD/€/USD affichée
- ✅ Gestion erreur paiement
- ✅ Redirection après paiement réussi
- ✅ Accessibilité : PaymentSelector avec aria

### 3.3 Annulation
**Scénarios :**
- ✅ Annulation réservation selon politique
- ✅ Calcul remboursement automatique
- ✅ Annulation gratuite si < 24h avant
- ✅ Remboursement partiel selon politique
- ✅ Notification utilisateur et opérateur

---

## 4. Tests Opérateur

### 4.1 Dashboard Opérateur
**Page :** `/operator/dashboard`  
**Scénarios :**
- ✅ Affichage statistiques (revenus, réservations, produits)
- ✅ Graphiques revenus mensuels
- ✅ Liste réservations récentes
- ✅ Navigation vers produits, réservations, analytics
- ✅ Accès rapide aux actions

### 4.2 Gestion Produits
**Page :** `/operator/products`  
**Scénarios :**
- ✅ Liste tous les produits opérateur
- ✅ Filtres par statut (Draft, Pending, Published)
- ✅ Création nouveau produit
- ✅ Édition produit existant
- ✅ Suppression produit (avec confirmation)
- ✅ Demande badge pour produit

### 4.3 Gestion Réservations
**Page :** `/operator/bookings`  
**Scénarios :**
- ✅ Liste toutes les réservations
- ✅ Filtres par statut (Pending, Confirmed, Cancelled)
- ✅ Détails réservation (client, produit, date, prix)
- ✅ Ajout note interne
- ✅ Marquage comme géré
- ✅ Export données

### 4.4 Analytics Avancés
**Page :** `/operator/analytics`  
**Scénarios :**
- ✅ Affichage conversion funnel (vues → inquiries → bookings)
- ✅ Analyse concurrence par catégorie
- ✅ Performance par produit
- ✅ Recommandations d'optimisation
- ✅ Filtres date personnalisables
- ✅ Export CSV fonctionnel
- ✅ Graphiques interactifs

### 4.5 Onboarding Opérateur
**Page :** `/operator/onboarding`  
**Scénarios :**
- ✅ Étape 1 : Sélection type prestataire
- ✅ Étape 2 : Informations publiques
- ✅ Étape 3 : Upload photos
- ✅ Étape 4 : Adresse société
- ✅ Étape 5 : Types d'expériences
- ✅ Étape 6 : Informations privées (selon type)
- ✅ Sauvegarde étape par étape
- ✅ Validation champs requis
- ✅ Soumission pour approbation admin
- ✅ Accessibilité complète (tous les champs)

### 4.6 Retraits
**Page :** `/operator/withdrawals`  
**Scénarios :**
- ✅ Affichage solde disponible
- ✅ Création demande retrait
- ✅ Sélection méthode paiement (virement, PayPal)
- ✅ Validation montant (max = solde disponible)
- ✅ Historique retraits
- ✅ Statuts retraits (Pending, Approved, Processed, Rejected)

---

## 5. Tests Admin

### 5.1 Dashboard Admin
**Page :** `/admin/dashboard`  
**Scénarios :**
- ✅ Statistiques globales (utilisateurs, opérateurs, produits, revenus)
- ✅ Opérateurs en attente d'approbation
- ✅ Produits en attente de validation
- ✅ Accès rapide aux actions

### 5.2 Gestion Opérateurs
**Page :** `/admin/operators`  
**Scénarios :**
- ✅ Liste tous les opérateurs
- ✅ Filtres par statut
- ✅ Approbation opérateur
- ✅ Suspension/Activation opérateur
- ✅ Rejet opérateur avec raison
- ✅ Voir détails opérateur

### 5.3 Gestion Produits
**Page :** `/admin/products`  
**Scénarios :**
- ✅ Liste tous les produits
- ✅ Filtres par statut
- ✅ Approbation produit → Published
- ✅ Rejet produit avec raison
- ✅ Dépublier produit
- ✅ Voir détails produit

### 5.4 Gestion Badges
**Page :** `/admin/badges`  
**Scénarios :**
- ✅ Liste tous les badges
- ✅ Création nouveau badge
- ✅ Modification badge (nom, couleur, icône, critères)
- ✅ Attribution badge à produits (liste multiple)
- ✅ Attribution badge à opérateurs (liste multiple)
- ✅ Voir produits/opérateurs avec badge spécifique
- ✅ Désactiver badge
- ✅ Initialisation badges par défaut

### 5.5 Gestion Demandes Badges
**Page :** `/admin/badge-requests`  
**Scénarios :**
- ✅ Liste demandes badges en attente
- ✅ Voir justification et preuves
- ✅ Approbation demande → attribution badge
- ✅ Rejet demande avec raison
- ✅ Notification opérateur du résultat

### 5.6 Paramètres Admin
**Page :** `/admin/settings`  
**Scénarios :**
- ✅ Activation/Désactivation auto-approbation produits
- ✅ Activation/Désactivation auto-approbation reviews
- ✅ Sauvegarde paramètres

---

## 6. Tests Client

### 6.1 Dashboard Client
**Page :** `/dashboard`  
**Scénarios :**
- ✅ Affichage réservations actives
- ✅ Historique réservations
- ✅ Accès rapide aux actions

### 6.2 Profil Utilisateur
**Page :** `/profile`  
**Scénarios :**
- ✅ Affichage informations profil
- ✅ Édition nom, email, téléphone
- ✅ Changement mot de passe
- ✅ Accessibilité complète

### 6.3 Favoris
**Page :** `/favorites`  
**Scénarios :**
- ✅ Ajout produit aux favoris
- ✅ Retrait produit des favoris
- ✅ Liste produits favoris
- ✅ Notifications prix réduit (si implémenté)

### 6.4 Programme Fidélité
**Page :** `/loyalty`  
**Scénarios :**
- ✅ Affichage points actuels
- ✅ Affichage niveau (Bronze, Argent, Or, Platine)
- ✅ Historique gains points
- ✅ Avantages niveau affichés

### 6.5 Historique Navigation
**Page :** `/view-history`  
**Scénarios :**
- ✅ Liste produits récemment consultés
- ✅ Tri par date
- ✅ Suppression historique

### 6.6 Inquiries
**Page :** `/dashboard/inquiries`  
**Scénarios :**
- ✅ Création inquiry manuelle (question)
- ✅ Création inquiry automatique (demande validation)
- ✅ Voir réponse opérateur
- ✅ Voir statut approbation
- ✅ Chat intégré pour inquiry

---

## 7. Tests Avis et Reviews

### 7.1 Création Avis
**Scénarios :**
- ✅ Création avis après réservation confirmée
- ✅ Upload photos (max 5)
- ✅ Note de 1 à 5 étoiles
- ✅ Commentaire texte
- ✅ Auto-approbation si paramètres activés
- ✅ Modération admin si nécessaire

### 7.2 Affichage Avis
**Scénarios :**
- ✅ Affichage seulement avis approuvés
- ✅ Filtres : Toutes, Avec photos, Vérifiées, Récentes
- ✅ Tri : Pertinence, Date, Note, Utiles
- ✅ Votes "Utile" / "Pas utile"
- ✅ Réponses opérateurs aux avis
- ✅ Badge "Vérifié" pour réservations confirmées

---

## 8. Tests Notifications

### 8.1 Notifications Utilisateur
**Page :** `/notifications`  
**Scénarios :**
- ✅ Affichage toutes les notifications
- ✅ Filtre notifications non lues
- ✅ Marquer comme lu
- ✅ Marquer toutes comme lues
- ✅ Supprimer notification
- ✅ Badge compteur dans header
- ✅ Notifications temps réel (si WebSocket)

### 8.2 Types de Notifications
**Scénarios :**
- ✅ Nouvelle réservation → opérateur
- ✅ Produit approuvé/rejeté → opérateur
- ✅ Review approuvée → client
- ✅ Inquiry répondue → client
- ✅ Badge approuvé/rejeté → opérateur
- ✅ Retrait approuvé/processé → opérateur

---

## 9. Tests Chat et Support

### 9.1 Chat Inquiry
**Scénarios :**
- ✅ Ouverture chat depuis inquiry
- ✅ Envoi messages texte
- ✅ Réception messages en temps réel (polling)
- ✅ Marquage messages comme lus
- ✅ Historique conversation
- ✅ Affichage participants

### 9.2 FAQ et Support
**Page :** `/help`  
**Scénarios :**
- ✅ Recherche FAQ par mot-clé
- ✅ Filtres par catégorie
- ✅ Affichage questions/réponses
- ✅ Feedback utile/pas utile
- ✅ Chat support général
- ✅ Guides rapides accessibles

---

## 10. Tests Multi-Devise

### 10.1 Sélecteur Devise
**Scénarios :**
- ✅ Sélection MAD (Dirham marocain)
- ✅ Sélection EUR (Euro)
- ✅ Sélection USD (Dollar US)
- ✅ Conversion prix affichée correctement
- ✅ Persistance sélection (localStorage)
- ✅ Affichage prix sur cartes produits
- ✅ Affichage prix page détail
- ✅ Affichage prix checkout

### 10.2 Conversion Paiement
**Scénarios :**
- ✅ Paiement en MAD via CMI
- ✅ Paiement en EUR via Stripe
- ✅ Paiement en USD via PayPal
- ✅ Conversion montant selon devise sélectionnée

---

## 11. Tests Badges et Authenticité

### 11.1 Badges Produits
**Scénarios :**
- ✅ Affichage badges automatiques (Populaire, Meilleure Valeur, Nouveau)
- ✅ Affichage badges manuels (Artisan, Éco-responsable, Traditionnel)
- ✅ Badges sur cartes produits
- ✅ Badges sur page détail produit
- ✅ Demande badge manuel par opérateur

### 11.2 Badges Opérateurs
**Scénarios :**
- ✅ Affichage badges opérateur (Vérifié, Local Authentique)
- ✅ Badges sur page détail opérateur
- ✅ Attribution badge par admin

### 11.3 Segments Authenticité
**Scénarios :**
- ✅ Filtre "Expériences Authentiques"
- ✅ Tags : Artisan, Traditionnel, Éco-responsable, 100% Marocain
- ✅ Affichage segments dans recherche

---

## 12. Tests Performance et Accessibilité

### 12.1 Performance
**Scénarios :**
- ✅ Temps chargement page < 3s
- ✅ Lazy loading images
- ✅ Pagination résultats recherche
- ✅ Optimisation bundle JavaScript
- ✅ Service Worker PWA fonctionnel

### 12.2 Accessibilité
**Scénarios :**
- ✅ Navigation au clavier (Tab, Enter, Escape)
- ✅ Screen reader compatible (ARIA labels)
- ✅ Contraste couleurs suffisant
- ✅ Focus visible sur éléments interactifs
- ✅ Labels associés aux champs (htmlFor/id)
- ✅ Autocomplete sur champs appropriés
- ✅ Messages d'erreur accessibles (role="alert")

---

## 13. Tests Sécurité

### 13.1 Authentification
**Scénarios :**
- ✅ Protection routes avec middleware `protect`
- ✅ Vérification rôle avec middleware `authorize`
- ✅ Token JWT valide requis
- ✅ Token expiré → redirection login
- ✅ Hashage mots de passe (bcrypt)

### 13.2 Validation Données
**Scénarios :**
- ✅ Validation backend avec express-validator
- ✅ Sanitization inputs
- ✅ Protection injection SQL (Mongoose)
- ✅ Validation fichiers upload (type, taille)
- ✅ Rate limiting sur endpoints sensibles

### 13.3 CORS et Headers
**Scénarios :**
- ✅ CORS configuré correctement
- ✅ Headers sécurité (X-Frame-Options, etc.)
- ✅ OPTIONS preflight géré

---

## 14. Tests Responsive et Mobile

### 14.1 Mobile
**Scénarios :**
- ✅ Navigation mobile (hamburger menu)
- ✅ Bottom navigation bar mobile
- ✅ Cartes produits adaptées mobile
- ✅ Formulaires utilisables sur mobile
- ✅ Touch gestures galerie images
- ✅ PWA installable

### 14.2 Tablette
**Scénarios :**
- ✅ Layout adapté tablette
- ✅ Navigation optimisée
- ✅ Grilles produits responsive

---

## 15. Tests Intégration

### 15.1 Flux Complet Réservation
**Scénarios :**
- ✅ Recherche produit → Détail → Réservation → Paiement → Confirmation
- ✅ Vérification données cohérentes tout au long du flux
- ✅ Notifications envoyées à chaque étape

### 15.2 Flux Opérateur
**Scénarios :**
- ✅ Inscription → Onboarding → Création produit → Approbation → Réservations → Analytics

### 15.3 Flux Admin
**Scénarios :**
- ✅ Approbation opérateur → Approbation produit → Gestion badges → Analytics

---

## 16. Tests Régression

### 16.1 Fonctionnalités Existantes
**Scénarios :**
- ✅ Vérifier qu'aucune régression après nouvelles fonctionnalités
- ✅ Tests automatisés sur routes critiques
- ✅ Vérification compatibilité navigateurs (Chrome, Firefox, Safari, Edge)

---

## 17. Critères d'Acceptation

### 17.1 Critères Généraux
- ✅ Toutes les fonctionnalités principales fonctionnent
- ✅ Pas d'erreurs console critiques
- ✅ Accessibilité WCAG 2.1 niveau AA minimum
- ✅ Performance Lighthouse > 80
- ✅ Sécurité : pas de vulnérabilités critiques
- ✅ Responsive sur mobile/tablette/desktop

### 17.2 Critères Spécifiques
- ✅ Taux de conversion vues → réservations tracé
- ✅ Analytics opérateur fonctionnels
- ✅ Multi-devise opérationnel
- ✅ Badges visibles et fonctionnels
- ✅ Chat et FAQ opérationnels

---

## 18. Outils de Test

### 18.1 Tests Manuels
- Navigateurs : Chrome, Firefox, Safari, Edge
- Devices : Desktop, Mobile (iOS/Android), Tablette
- Outils : Chrome DevTools, Lighthouse, WAVE (accessibilité)

### 18.2 Tests Automatisés (À implémenter)
- Jest + React Testing Library (frontend)
- Supertest (backend API)
- Cypress (E2E)
- Playwright (E2E cross-browser)

---

## 19. Plan d'Exécution

### Phase 1 : Tests Critiques (Semaine 1)
- Authentification
- Réservation et paiement
- Gestion produits opérateur
- Dashboard admin

### Phase 2 : Tests Fonctionnels (Semaine 2)
- Recherche et filtres
- Reviews et avis
- Notifications
- Chat et FAQ

### Phase 3 : Tests Intégration (Semaine 3)
- Flux complets utilisateur
- Performance et accessibilité
- Sécurité
- Responsive

### Phase 4 : Tests Régression (Semaine 4)
- Vérification régressions
- Tests cross-browser
- Tests de charge (optionnel)

---

## 20. Bugs et Suivi

### 20.1 Priorités
- **P0 (Critique)** : Bloque utilisation, sécurité
- **P1 (Haute)** : Fonctionnalité majeure cassée
- **P2 (Moyenne)** : Fonctionnalité mineure cassée
- **P3 (Basse)** : Amélioration, cosmétique

### 20.2 Template Bug Report
```
**Titre :** [Court et descriptif]
**Priorité :** P0/P1/P2/P3
**Page/Composant :** [URL ou nom composant]
**Navigateur :** [Chrome/Firefox/Safari/Edge]
**Device :** [Desktop/Mobile/Tablette]
**Étapes pour reproduire :**
1. ...
2. ...
**Résultat attendu :**
...
**Résultat actuel :**
...
**Screenshots :** [Si applicable]
```

---

**Fin du Plan de Test**

