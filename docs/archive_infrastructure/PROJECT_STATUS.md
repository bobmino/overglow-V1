# Overglow V1 — État Complet du Projet

**Date de mise à jour :** 18 Mai 2026  
**Version :** V1.0 (Production — Déployé sur Vercel)  
**Dépôt :** `bobmino/overglow-V1`  
**Frontend :** `https://overglow-v1-3jqp.vercel.app`  
**Backend :** `https://overglow-backend.vercel.app`

---

## 🏗️ Architecture Technique

### Stack Technologique
| Couche | Technologie | Version |
|--------|------------|---------|
| **Runtime** | Node.js (ESM) | 18+ |
| **Backend** | Express.js | 4.18 |
| **Base de données** | MongoDB Atlas (Mongoose) | 8.0 |
| **Frontend** | React + Vite | React 18 / Vite 5 |
| **Routage SPA** | React Router DOM | v6 |
| **State/Cache** | TanStack React Query | v5 |
| **Styling** | Tailwind CSS | v3 |
| **Icônes** | Lucide React | — |
| **Auth** | JWT (access + refresh tokens) | — |
| **Paiement** | Stripe SDK | 20.0 |
| **Email** | Nodemailer | 7.0 |
| **Upload** | Multer + Cloudinary + Sharp | — |
| **Monitoring** | Sentry (frontend + backend) | 10.30 |
| **SEO** | react-helmet-async | 2.0 |
| **i18n** | i18next | — |
| **Sécurité** | Helmet, express-rate-limit, bcryptjs | — |
| **Déploiement** | Vercel (serverless functions) | — |
| **PWA** | Service Worker (sw.js) | — |

### Architecture de Déploiement
- **Monorepo** : Backend Express (`server.js`) + Frontend React (`frontend/`)
- **Vercel** : Le frontend est buildé (`npm run build`) et servi statiquement ; les routes `/api/*` sont réécrites vers `api/index.js` (serverless)
- **vercel.json** : Rewrites SPA, headers Content-Type JS/CSS, CSP pour Stripe
- **CORS** : Origines dynamiques autorisées (Vercel + localhost)
- **Trust Proxy** : `app.set('trust proxy', 1)` pour rate limiting correct sur Vercel

---

## 📁 Structure Complète du Projet

### Backend — 19 Modèles
| Modèle | Fichier | Description |
|--------|---------|-------------|
| User | `userModel.js` | Utilisateurs (Client/Opérateur/Admin), loyalty, refresh tokens, security |
| Product | `productModel.js` | Expériences/activités, SEO, skip-the-line, authenticity, badges, cancellation policy |
| Operator | `operatorModel.js` | Profil opérateur, status, autoApproveProducts |
| OperatorOnboarding | `operatorOnboardingModel.js` | Parcours d'inscription opérateur multi-étapes |
| Booking | `bookingModel.js` | Réservations, paiement, annulation, remboursement |
| Schedule | `scheduleModel.js` | Créneaux horaires par produit |
| Review | `reviewModel.js` | Avis clients avec modération (Pending/Approved/Rejected) |
| Inquiry | `inquiryModel.js` | Demandes clients (manual Q&A / automatic validation) |
| Notification | `notificationModel.js` | Notifications utilisateur multitype |
| Withdrawal | `withdrawalModel.js` | Demandes de retrait opérateurs |
| ApprovalRequest | `approvalRequestModel.js` | Demandes d'approbation admin |
| Settings | `settingsModel.js` | Config globale (auto-approbation produits/reviews) |
| Badge | `badgeModel.js` | Badges produits/opérateurs |
| BadgeRequest | `badgeRequestModel.js` | Demandes de badges par opérateurs |
| Blog | `blogModel.js` | Articles de blog avec SEO |
| Chat | `chatModel.js` | Conversations chatbot |
| FAQ | `faqModel.js` | Questions fréquentes |
| Favorite | `favoriteModel.js` | Favoris utilisateur avec listes |
| ViewHistory | `viewHistoryModel.js` | Historique de consultation |

### Backend — 27 Contrôleurs
| Contrôleur | Endpoints principaux |
|-----------|---------------------|
| `authController` | Login, register, logout, refresh token, profil, sécurité (lock/unlock) |
| `productController` | CRUD produits, slug, status, images Cloudinary, schedules auto |
| `adminController` | Stats globales, gestion opérateurs/produits/users, approve/reject/depublish |
| `bookingController` | Créer/annuler réservations, mes réservations, réservations opérateur |
| `cancellationController` | Calcul de remboursement, politique d'annulation |
| `searchController` | Recherche avancée (texte, géo, prix, durée, date, catégorie, skip-the-line) |
| `reviewController` | CRUD reviews, modération admin, auto-approbation |
| `inquiryController` | CRUD inquiries, réponses opérateur, approbation |
| `notificationController` | Liste, marquer lu, compteur non-lu |
| `withdrawalController` | Créer/lister/approuver/rejeter/traiter retraits |
| `approvalRequestController` | Créer/lister/approuver/rejeter demandes |
| `paymentController` | Stripe intent, webhook, PayPal |
| `scheduleController` | CRUD créneaux horaires |
| `onboardingController` | Parcours onboarding opérateur (6 étapes) |
| `operatorWizardController` | Wizard simplifié de création opérateur |
| `operatorController` | Profil opérateur, dashboard data |
| `analyticsController` | Revenus, réservations, conversions, graphiques |
| `blogController` | CRUD articles, catégories, tags, SEO, slugs |
| `badgeController` | CRUD badges, attribution |
| `badgeRequestController` | Demandes de badges, validation admin |
| `favoriteController` | Favoris, listes, alertes prix, partage |
| `recommendationController` | Recommandations personnalisées |
| `loyaltyController` | Programme fidélité, points, niveaux |
| `viewHistoryController` | Historique de vues |
| `chatController` | Chatbot conversations |
| `faqController` | FAQ CRUD |
| `settingsController` | Paramètres globaux admin |

### Backend — 28 Routes API
`/api/auth` · `/api/products` · `/api/schedules` · `/api/bookings` · `/api/admin` · `/api/operator` · `/api/operator/onboarding` · `/api/operator/wizard` · `/api/payments` · `/api/upload` · `/api/search` · `/api/inquiries` · `/api/settings` · `/api/reviews` · `/api/notifications` · `/api/withdrawals` · `/api/approval-requests` · `/api/badges` · `/api/badge-requests` · `/api/favorites` · `/api/recommendations` · `/api/loyalty` · `/api/view-history` · `/api/faq` · `/api/chat` · `/api/blog` · `/api/health` · `/api/sitemap.xml`

### Backend — 7 Middlewares
| Middleware | Rôle |
|-----------|------|
| `authMiddleware` | JWT protect + authorize par rôle (normalisation accents) |
| `rateLimiter` | Rate limiting global + strict (auth routes) |
| `errorMiddleware` | notFound + errorHandler centralisés |
| `cacheMiddleware` | Cache en mémoire (node-cache) |
| `uploadMiddleware` | Multer + Cloudinary + Sharp compression |
| `onboardingMiddleware` | Validation étapes onboarding |
| `operatorWizardMiddleware` | Validation wizard opérateur |

### Backend — 14 Utils/Services
`emailService` · `emailTemplates` · `paymentService` · `notificationService` · `badgeService` · `loyaltyService` · `recommendationService` · `cancellationService` · `availabilityService` · `cloudinaryService` · `imageCompression` · `sanitizer` · `logger` · `sentry` · `dbIndexes`

### Frontend — 45 Pages
| Page | Route | Rôle |
|------|-------|------|
| **Accueil** | `/` | Hero, Features, TopDestinations, Recommandations |
| SearchPage | `/search` | Recherche avancée, filtres, tri, pagination, suggestions |
| ProductDetailPage | `/products/:id` | Détail produit, galerie, reviews, calendrier, booking |
| DestinationPage | `/destinations/:city` | Guide destination, produits par ville |
| CategoryPage | `/categories/:category` | Produits par catégorie |
| BlogPage | `/blog` | Liste articles |
| BlogPostPage | `/blog/:slug` | Article détaillé |
| TagHubPage | `/tags/:tag` | Hub par tag |
| BookingPage | `/booking` | Formulaire de réservation |
| CheckoutPage | `/checkout` | Paiement Stripe/PayPal |
| BookingSuccessPage | `/booking-success` | Confirmation |
| LoginPage | `/login` | Connexion |
| RegisterPage | `/register` | Inscription |
| DashboardPage | `/dashboard` | Réservations client, reviews, fidélité |
| ProfilePage | `/profile` | Profil utilisateur éditable |
| FavoritesPage | `/favorites` | Favoris avec listes et alertes prix |
| LoyaltyPage | `/loyalty` | Programme de fidélité |
| ViewHistoryPage | `/view-history` | Historique de consultation |
| MyInquiriesPage | `/dashboard/inquiries` | Mes demandes client |
| NotificationsPage | `/notifications` | Centre de notifications |
| OperatorWizardPage | `/operator/wizard` | Wizard inscription opérateur |
| OperatorOnboardingPage | `/operator/onboarding` | Onboarding 6 étapes |
| OperatorDashboardPage | `/operator/dashboard` | Dashboard opérateur |
| OperatorProductsPage | `/operator/products` | Gestion produits opérateur |
| OperatorProductFormPage | `/operator/products/new` | Création/édition produit |
| OperatorBookingsPage | `/operator/bookings` | Réservations opérateur |
| AnalyticsPage | `/operator/analytics` | Analytics opérateur (graphiques) |
| InquiriesPage | `/operator/inquiries` | Inquiries opérateur |
| WithdrawalsPage | `/operator/withdrawals` | Retraits opérateur |
| AdminDashboardPage | `/admin/dashboard` | Dashboard admin global |
| AdminOperatorsPage | `/admin/operators` | Gestion opérateurs |
| AdminProductsPage | `/admin/products` | Validation produits |
| AdminUsersPage | `/admin/users` | Gestion utilisateurs |
| AdminSettingsPage | `/admin/settings` | Paramètres globaux |
| AdminWithdrawalsPage | `/admin/withdrawals` | Gestion retraits |
| ApprovalRequestsPage | `/admin/approval-requests` | Demandes d'approbation |
| AdminBadgeManagementPage | `/admin/badges` | Gestion badges |
| AdminBadgeRequestsPage | `/admin/badge-requests` | Demandes de badges |
| AdminBlogPage | `/admin/blog` | Gestion blog |
| AdminBlogFormPage | `/admin/blog/new` | Création/édition article |
| AffiliatePage | `/affiliate` | Programme affiliation |
| PartnerSignupPage | `/partners/signup` | Inscription partenaire |
| AboutPage | `/about` | À propos |
| HelpPage | `/help` | Aide/contact |
| PrivacyPage | `/privacy` | Politique de confidentialité |

### Frontend — 53 Composants
**Navigation & Layout :** Header, Footer, Layout, MobileBottomNav, DashboardNavBar, ScrollToTopButton  
**Produits :** ProductCard, ImageGallery, BookingWidget, ScheduleSelector, DatePicker, DateRangePicker, TimeSlotPicker, ShareButtons, FavoriteButton, BadgeDisplay, CancellationPolicy  
**Recherche :** AdvancedFilters, SearchAutocomplete, SearchSuggestions, DiscoverMenu  
**Reviews :** ReviewModal, ReviewsList  
**Sections Home :** Hero, Features, TopDestinations, TopAttractions, TopTours, WarmDestinations, FlexibilityBanner, TrustBar, AuthCTA, RecommendedProducts, RecommendationsSection, DestinationCard, DestinationGuide, TourCard, OthersAlsoBooked  
**Paiement :** PaymentSelector (Stripe Elements + PayPal)  
**Chat :** ChatWidget  
**Blog :** BlogCard  
**FAQ :** FAQSection  
**Badges :** BadgeRequestModal  
**Notifications :** NotificationBadge  
**Formulaires :** FormField, InquiryModal, InternalNoteModal, CurrencySelector, LanguageSelector  
**Auth & Routing :** PrivateRoute, OperatorRoute, ErrorBoundary, ToastContainer

### Frontend — Contextes, Hooks, Utils
**Contextes :** AuthContext, CurrencyContext, ToastContext  
**Hooks :** useFormValidation, useAnalytics  
**Utils :** analytics (GA4), categoryMapping, formatImage, performance (lazy images), sentry  
**Config :** axios (interceptors, refresh token, logging), destinations

### Scripts Utilitaires
| Script | Commande | Rôle |
|--------|---------|------|
| `createAdmin.js` | `npm run create-admin` | Créer admin via env vars |
| `massImporter.js` | `npm run mass-import` | Import massif de produits |
| `publishAll.js` | `npm run publish-all` | Publier tous les produits |
| `initializeBadges.js` | — | Initialiser les badges en BDD |
| `resetAndSeed.js` | — | Reset et seed de la BDD |
| `testLogin.js` | `npm run test-login` | Test de connexion |
| `test-security.js` | — | Tests de sécurité |

---

## ✅ Inventaire Complet des Fonctionnalités Implémentées

### 1. Authentification & Sécurité
- Inscription/Connexion avec JWT (access token 15min + refresh token 7j)
- Refresh token rotation avec stockage en BDD
- Logout avec révocation du refresh token
- Normalisation des rôles (accents français/anglais)
- Email case-insensitive + trim automatique
- Protection brute force : verrouillage après tentatives échouées
- Rate limiting global (100 req/15min) + strict sur auth (10 req/15min)
- Helmet (CSP, XSS, X-Frame, Referrer-Policy, Permissions-Policy)
- Auto-seed des comptes admin/opérateur au démarrage

### 2. Gestion des Produits
- CRUD complet avec validation express-validator
- Statuts : Draft → Pending Review → Published
- Auto-approbation si setting activé ET opérateur Active
- Champs étendus : duration, highlights, included, requirements, timeSlots
- Skip-the-Line : Fast Track / VIP / Early Access avec prix additionnel
- Badges produits : attribution automatique basée sur métriques
- Tags authenticité : Artisan, Local, Eco-Friendly, Traditional
- Politique d'annulation configurable : free/moderate/strict/non_refundable
- SEO intégré : metaTitle, metaDescription, ogTitle, ogDescription, ogImage
- Slug auto-généré pour URLs propres
- Géolocalisation : coordonnées GPS avec index 2dsphere
- Upload images : Multer → Sharp (compression) → Cloudinary
- Métriques auto : viewCount, bookingCount, averageRating, reviewCount

### 3. Système de Réservation
- Création avec validation de prix et disponibilité
- Sélection de date + créneau horaire
- Calcul automatique totalAmount
- Statuts : Pending → Confirmed → Cancelled
- Notes internes opérateur (internalNote)
- Marquage comme géré (isHandled/handledAt)
- Payout tracking : payoutStatus, payoutDate, payoutEligibleDate

### 4. Annulation & Remboursement
- Calcul de remboursement selon politique d'annulation
- Heures restantes avant début → pourcentage de remboursement
- Raison d'annulation optionnelle
- Statuts de remboursement : Not Applicable/Pending/Processed/Rejected
- Service dédié `cancellationService.js`

### 5. Paiement
- Stripe : Payment Intent, Elements, webhook
- PayPal : SDK serveur (placeholder configuré)
- PaymentSelector frontend avec fallback gracieux si Stripe indisponible
- Gestion des erreurs de chargement Stripe

### 6. Recherche Avancée
- Recherche textuelle full-text
- Filtres : catégorie, ville, prix min/max, note min, durée, date
- Géolocalisation : recherche par rayon autour d'un point
- Filtre skip-the-line
- Tri : recommandé, prix croissant/décroissant, note, popularité
- Pagination
- Suggestions de recherche en temps réel
- Sauvegarde de recherches favorites (localStorage)
- Catégories dynamiques depuis l'API

### 7. Dashboard Opérateur
- Statistiques : revenus, réservations, produits, taux d'occupation
- Gestion produits : liste, création, édition, suppression
- Gestion réservations : liste, filtres, notes internes, marquage géré
- Analytics avec graphiques : revenus mensuels, réservations par produit
- Gestion inquiries : réponses Q&A, approbation/rejet automatiques

### 8. Dashboard Admin
- Statistiques globales : users, opérateurs, produits, bookings, revenus
- Gestion opérateurs : activation, suspension, rejet, auto-approve toggle, onboarding review
- Validation produits : approuver, rejeter, dépublier avec filtres par statut
- Gestion utilisateurs : liste, filtres par rôle, suppression (admins protégés)
- Gestion retraits : approuver, rejeter, traiter
- Demandes d'approbation : approuver, rejeter
- Gestion badges : CRUD, attribution, demandes
- Gestion blog : CRUD articles, catégories, tags, SEO
- Paramètres globaux : auto-approbation produits/reviews

### 9. Système de Reviews
- Création par clients ayant réservé (1 review par user par produit)
- Modération : Pending → Approved/Rejected
- Auto-approbation selon settings admin
- Affichage public : uniquement les reviews approuvées
- Rating 1-5 étoiles + commentaire

### 10. Système d'Inquiries
- Types : manual (Q&A libre) et automatic (validation avant booking)
- Création par clients, réponses par opérateurs
- Approbation/rejet pour inquiries automatiques
- Pages dédiées : opérateur et client

### 11. Notifications
- Types multiples : booking, review, inquiry, approval, badge, system
- Compteur non-lu dans le header (NotificationBadge)
- Page dédiée avec marquage lu/tous-lus
- Service auto-création `notificationService.js`

### 12. Programme de Fidélité
- Points gagnés par réservation
- Niveaux : Bronze → Silver → Gold → Platinum
- Historique des points avec raisons
- Tracking totalSpent et totalBookings
- Page dédiée LoyaltyPage

### 13. Favoris & Listes
- Ajout/suppression de favoris
- Listes personnalisées (création, partage)
- Alertes de prix
- Bouton FavoriteButton intégré sur ProductCard

### 14. Système de Badges
- Badges produits et opérateurs
- Attribution automatique basée sur métriques (badgeService)
- Demandes de badges par opérateurs (BadgeRequestModal)
- Gestion admin des demandes
- Affichage BadgeDisplay sur les cards

### 15. Système de Retraits (Withdrawals)
- Opérateurs : demande de retrait avec montant
- Admin : approuver, rejeter, marquer comme traité
- Historique des retraits
- Pages dédiées opérateur et admin

### 16. Onboarding Opérateur
- Wizard simplifié 4 étapes (OperatorWizardPage)
- Onboarding complet 6 étapes (OperatorOnboardingPage) :
  - Informations personnelles
  - Type de prestataire (société/individuel avec/sans statut)
  - Informations légales
  - Description de l'expérience
  - Localisation
  - Soumission
- Middleware de validation par étape
- Review par admin avec approbation/rejet

### 17. Blog & Contenu
- CRUD articles avec éditeur riche
- Catégories et tags
- SEO complet par article (slug, meta, og)
- Page publique avec pagination
- Gestion admin complète

### 18. Chat & FAQ
- Chatbot avec historique de conversation
- FAQ dynamique avec CRUD admin
- FAQSection intégrée sur les pages produits

### 19. SEO & Performance
- react-helmet-async sur toutes les pages
- Sitemap XML dynamique (`/api/sitemap.xml`)
- Lazy loading des pages (React.lazy + Suspense)
- Prefetch des routes critiques (requestIdleCallback)
- Lazy loading des images (IntersectionObserver)
- React Query avec staleTime/gcTime optimisés
- PWA avec Service Worker

### 20. Monitoring & Observabilité
- Sentry frontend + backend (captureException, user context)
- Logger structuré (backend)
- Console logging détaillé des requêtes API (development)
- GA4 Analytics (configurable via env)
- Error Boundary React avec fallback UI gracieux

### 21. Email
- Templates HTML riches (`emailTemplates.js`)
- Confirmation de réservation, annulation, bienvenue
- Configuration flexible (EMAIL_ENABLED=false pour désactiver)
- Support Gmail avec App Passwords
- Gestion d'erreurs non-bloquante

### 22. Internationalisation
- i18next configuré
- Support multi-langue (FR/EN/AR)
- LanguageSelector dans le header
- CurrencyContext pour conversion de devises

### 23. UX/UI
- Design responsive mobile-first
- MobileBottomNav pour navigation mobile
- Animations pulse pour loading states
- Modales avec backdrop blur
- Toast notifications (ToastContext)
- Scroll-to-top automatique
- Header adaptatif selon rôle utilisateur

---

## 🔧 Problèmes Résolus (Historique Complet)

1. ✅ `TypeError: Cannot read properties of undefined (reading 'toFixed')` — Protection prix partout
2. ✅ Calendrier tronqué — `max-h-[400px] overflow-y-auto`
3. ✅ Emails bloquants — Gestion d'erreurs + option désactivation
4. ✅ Perte de données update produits — Validation flexible
5. ✅ Syntax errors ProductCard/SearchPage — Ternaires corrigés
6. ✅ Caching 304 Axios — ETag désactivé
7. ✅ ErrorBoundary crash (Link hors Router) — Remplacé par `<a href="/">`
8. ✅ `t.map is not a function` AdminProductsPage — Extraction défensive array paginé
9. ✅ Stripe loader crash — try/catch dans PaymentSelector
10. ✅ Rate limiting Vercel (IP proxy) — `trust proxy` activé
11. ✅ Login case-sensitive — `.toLowerCase().trim()` sur emails
12. ✅ `ReferenceError: Award is not defined` DashboardPage — Import manquant ajouté
13. ✅ `RecommendationsSection` non importé — Import ajouté
14. ✅ Vercel 405 Method Not Allowed — Configuration rewrites corrigée
15. ✅ MIME types JS/CSS sur Vercel — Headers dans vercel.json
16. ✅ CORS doubles headers Stripe — Configuration helmet/CORS harmonisée
17. ✅ Service Worker cache agressif — Prompt de rechargement implémenté
18. ✅ Auto-seed users en production — Seeder non-bloquant au startup

---

## 📝 Configuration Requise

### Variables d'Environnement (.env)
```env
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
STRIPE_SECRET_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=...
EMAIL_PASS=...
EMAIL_ENABLED=true
SENTRY_DSN=...
VITE_GA4_MEASUREMENT_ID=...
ADMIN_EMAIL=admin@overglow.com
ADMIN_PASSWORD=admin123
```

### Commandes
```bash
# Backend
npm run dev              # Dev avec nodemon
npm start                # Production
npm run create-admin     # Créer admin
npm run mass-import      # Import massif produits
npm run publish-all      # Publier tous les produits

# Frontend
cd frontend && npm run dev    # Dev Vite
cd frontend && npm run build  # Build production
```

### Comptes par Défaut (Auto-seeded)
| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | `admin@overglow.com` | `admin123` |
| Opérateur | `operator@overglow.com` | `password123` |

---

## 📊 Métriques du Projet

| Métrique | Valeur |
|----------|--------|
| Modèles de données | 19 |
| Contrôleurs | 27 |
| Routes API | 28 |
| Middlewares | 7 |
| Services/Utils backend | 14 |
| Pages frontend | 45 |
| Composants frontend | 53 |
| Contextes React | 3 |
| Hooks custom | 2 |
| Scripts utilitaires | 7 |
| Documents de documentation | 48+ |

---

**Fin du document** — Dernière mise à jour : 18 Mai 2026