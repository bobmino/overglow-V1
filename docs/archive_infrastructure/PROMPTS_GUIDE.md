# Overglow V1 — Guide de Prompts IA (Reconstruction Complète)

> **But :** Reproduire le projet Overglow de A à Z via une IA medium/open-source.
> **Pré-requis :** Node.js 18+, MongoDB Atlas, compte Stripe, compte Cloudinary.
> Chaque prompt est une étape autonome. Exécutez-les dans l'ordre.

---

## Phase 1 — Initialisation du Projet

### Prompt 1.1 — Scaffold Backend
```
Crée un projet Node.js backend avec Express.js en mode ESM (type: module dans package.json).
Installe ces dépendances : express, mongoose, cors, helmet, dotenv, bcryptjs, jsonwebtoken, express-validator, express-rate-limit, multer, nodemailer, stripe, cloudinary, sharp, node-cache, @sentry/node.
Crée la structure :
- server.js (entry point)
- config/db.js (connexion MongoDB avec mongoose, reconnexion auto)
- backend/middleware/ (dossier vide)
- backend/models/ (dossier vide)
- backend/controllers/ (dossier vide)
- backend/routes/ (dossier vide)
- backend/services/ (dossier vide)
- backend/utils/ (dossier vide)
Dans server.js : configure express, cors (origin dynamique), helmet avec CSP,
express.json(), trust proxy, et un endpoint GET / qui retourne {message: "API running"}.
Ajoute les scripts npm : "dev" avec nodemon, "start" avec node.
```

### Prompt 1.2 — Scaffold Frontend
```
Dans le même projet, crée un frontend React avec Vite dans le dossier frontend/.
Installe : react-router-dom, @tanstack/react-query, react-helmet-async, lucide-react,
i18next react-i18next, axios, @stripe/stripe-js @stripe/react-stripe-js.
Configure Tailwind CSS v3.
Crée la structure :
- src/main.jsx avec StrictMode, QueryClientProvider, HelmetProvider
- src/App.jsx avec BrowserRouter et Routes vide
- src/components/ src/pages/ src/context/ src/hooks/ src/utils/ src/config/
- src/config/axios.js : instance axios avec baseURL depuis env, interceptors pour
  ajouter le token JWT depuis localStorage, interceptor pour refresh token auto,
  logging des requêtes en dev.
- src/context/AuthContext.jsx : provider avec login/logout/updateUser, stockage
  localStorage, état loading.
```

---

## Phase 2 — Authentification & Sécurité

### Prompt 2.1 — Modèle User + Auth Controller
```
Crée backend/models/userModel.js avec mongoose :
- name (String, required), email (String, required, unique), password (String, required)
- role (enum: Client/Opérateur/Admin, default Client)
- isApproved (Boolean), approvedAt (Date)
- Champs profil : phone, bio, location, dateOfBirth, website, socialLinks (facebook/instagram/twitter/linkedin)
- Loyalty : loyaltyPoints (Number 0), loyaltyLevel (enum Bronze/Silver/Gold/Platinum),
  totalSpent, totalBookings, loyaltyPointsHistory (array d'objets {points, reason, bookingId, createdAt})
- Sécurité : refreshTokens (array {token, createdAt, expiresAt, ipAddress, userAgent}),
  lastLoginAt, lastLoginIp, failedLoginAttempts, lockedUntil
- Pre-save hook : hash password avec bcryptjs (salt 10)
- Méthode matchPassword : compare avec bcrypt

Crée backend/controllers/authController.js :
- register : validation email unique (case-insensitive avec toLowerCase().trim()),
  création user, génère access token JWT (15min) + refresh token (7j), stocke refresh en BDD
- login : cherche user par email (case-insensitive), vérifie lock, compare password,
  reset failedLoginAttempts si succès, incrémente si échec, lock après 5 échecs (15min)
- refreshToken : vérifie refresh token en BDD, génère nouveau access + refresh, rotation
- logout : supprime refresh token de la BDD
- getProfile / updateProfile

Crée backend/middleware/authMiddleware.js :
- protect : extrait JWT du header Authorization Bearer, vérifie, charge user, normalise le rôle
  (admin→Admin, opérateur/operator→Opérateur, client→Client) pour gérer les accents
- authorize(...roles) : vérifie que le rôle normalisé est dans la liste

Crée backend/middleware/rateLimiter.js :
- apiLimiter : 100 requêtes/15min
- strictLimiter : 10 requêtes/15min (pour auth)

Crée les routes backend/routes/authRoutes.js et monte-les dans server.js sur /api/auth.
```

### Prompt 2.2 — Frontend Auth
```
Crée les pages frontend :
- LoginPage.jsx : formulaire email/password, validation, appel POST /api/auth/login,
  stockage token dans localStorage via AuthContext.login(), redirection vers /
- RegisterPage.jsx : formulaire name/email/password/confirmPassword, appel POST /api/auth/register

Crée les composants de routing protégé :
- PrivateRoute.jsx : vérifie isAuthenticated depuis AuthContext, redirige vers /login sinon
- OperatorRoute.jsx : vérifie rôle Opérateur, redirige sinon

Crée ErrorBoundary.jsx (class component) :
- getDerivedStateFromError + componentDidCatch
- Fallback UI avec bouton "Recharger" (window.location.reload) et lien <a href="/"> (PAS <Link>
  car ce composant est monté HORS du Router dans main.jsx)

Monte ErrorBoundary dans main.jsx AUTOUR de QueryClientProvider et App.
```

---

## Phase 3 — Produits & Catalogue

### Prompt 3.1 — Modèle Product + CRUD
```
Crée backend/models/productModel.js :
- operator (ref Operator, required), title, slug (indexé), description, category, city, address
- duration (String), price (Number, required, default 0)
- location (GeoJSON Point avec index 2dsphere)
- images ([String]), seo ({metaTitle, metaDescription, ogTitle, ogDescription, ogImage})
- highlights, included, requirements ([String])
- requiresInquiry (Boolean), inquiryType (enum manual/automatic/none)
- timeSlots ([{startTime, endTime}])
- status (enum Draft/Pending Review/Published, default Draft)
- skipTheLine : {enabled, type (Fast Track/VIP/Early Access), additionalPrice, description, availability, maxCapacity}
- authenticity : {isArtisan, isAuthenticLocal, isEcoFriendly, isTraditional, isLocal100}
- badges : [{badgeId (ref Badge), earnedAt}]
- metrics : {viewCount, bookingCount, averageRating, reviewCount, isPopular, isBestValue, isNew, isLastMinute}
- cancellationPolicy : {type (free/moderate/strict/non_refundable), freeCancellationHours (24), refundPercentage (100), description}
- timestamps: true, strict: false

Crée backend/models/scheduleModel.js :
- product (ref Product), date (Date), time (String), endDate, endTime
- availableSpots (Number), price (Number)

Crée backend/controllers/productController.js :
- getProducts : liste publique, filtres (city, category, status=Published), pagination
  IMPORTANT : retourne un objet {products: [...], pagination: {page, limit, total, totalPages}}
- getProductById : par ID ou slug, incrémente viewCount
- createProduct : opérateur only, vérifie si auto-approve activé + opérateur Active → Published sinon Draft
- updateProduct : opérateur propriétaire only
- deleteProduct : opérateur propriétaire only
- uploadImages : Multer + Sharp compression + Cloudinary upload

Crée les routes et monte sur /api/products.
```

### Prompt 3.2 — Frontend Catalogue
```
Crée les composants et pages :
- ProductCard.jsx : carte avec image, titre, ville, prix, badge, favoris button,
  protection .toFixed() contre undefined
- SearchPage.jsx : barre de recherche, filtres sidebar (catégorie, ville, prix, tri),
  AdvancedFilters (prix, note, durée, date, géo, skip-the-line),
  SearchSuggestions, pagination, sauvegarde recherches (localStorage).
  IMPORTANT : extraire productsArray avec Array.isArray(data) ? data : (data?.products || [])
  car l'API retourne un objet paginé
- ProductDetailPage.jsx : galerie images, détails, highlights, included, reviews,
  DatePicker, TimeSlotPicker, BookingWidget, CancellationPolicy, ShareButtons,
  FAQSection, OthersAlsoBooked
- DestinationPage.jsx : guide de destination avec produits par ville
- CategoryPage.jsx : produits filtrés par catégorie
```

---

## Phase 4 — Réservation & Paiement

### Prompt 4.1 — Booking System
```
Crée backend/models/bookingModel.js :
- user (ref User), schedule (ref Schedule), operator (ref Operator)
- numberOfTickets, totalAmount, totalPrice (default = totalAmount)
- status (Pending/Confirmed/Cancelled), paymentIntentId, paymentStatus (pending/paid/refunded/failed)
- payoutStatus (pending/scheduled/completed), payoutDate, payoutEligibleDate
- internalNote, isHandled (Boolean), handledAt
- cancelledAt, cancellationReason, refundAmount, refundStatus

Crée backend/controllers/bookingController.js :
- createBooking : valide schedule, calcule totalAmount, crée booking Confirmed
- getMyBookings : réservations de l'utilisateur connecté avec populate schedule.product
- getOperatorBookings : réservations de l'opérateur avec filtres
- cancelBooking : calcule remboursement selon cancellationPolicy du produit

Crée backend/utils/cancellationService.js :
- calculateRefund(booking) : calcule heures restantes avant début, applique le
  pourcentage selon la politique (free: 100% si > freeCancellationHours, moderate: 50%, strict: 0%)

Crée backend/controllers/paymentController.js :
- createPaymentIntent : Stripe intent avec montant
- handleWebhook : Stripe webhook pour confirmer paiement

Crée les routes /api/bookings et /api/payments.
```

### Prompt 4.2 — Frontend Booking Flow
```
Crée les pages :
- BookingPage.jsx : récap produit, date sélectionnée, nombre tickets, total
- CheckoutPage.jsx : formulaire paiement avec PaymentSelector
  (Stripe Elements + PayPal), gestion erreurs Stripe dans try/catch
- BookingSuccessPage.jsx : confirmation avec détails, protection .toFixed() sur prix

Crée PaymentSelector.jsx : charge Stripe avec loadStripe dans try/catch (graceful fallback
si indisponible), CardElement, bouton payer, intégration PayPal placeholder.
```

---

## Phase 5 — Dashboards

### Prompt 5.1 — Dashboard Opérateur
```
Crée backend/models/operatorModel.js :
- user (ref User), companyName, description, status (Pending/Active/Suspended/Rejected)
- autoApproveProducts (Boolean default false)
- Champs étendus : phone, address, documents, etc.

Crée backend/controllers/analyticsController.js :
- getOperatorStats : revenus totaux, nombre réservations, produits, taux d'occupation
- getRevenueChart : revenus par mois (agrégation MongoDB)
- getBookingsByProduct : réservations groupées par produit

Pages frontend :
- OperatorDashboardPage.jsx : cards stats, liens rapides
- OperatorProductsPage.jsx : liste mes produits, boutons créer/éditer/supprimer/publier
- OperatorProductFormPage.jsx : formulaire complet création/édition produit
- OperatorBookingsPage.jsx : liste réservations, filtres, notes internes, marquage géré
- AnalyticsPage.jsx : graphiques revenus et réservations

Crée DashboardNavBar.jsx : navigation contextuelle (Retour, Dashboard, Produits, Réservations, Analytics)
```

### Prompt 5.2 — Dashboard Admin
```
Crée backend/controllers/adminController.js :
- getAdminStats : totalUsers, totalOperators, totalProducts, totalBookings, pendingProducts, publishedProducts, totalRevenue
- getAdminProducts : liste TOUS les produits avec pagination (retourne {products, pagination})
- updateProductStatus : approve (Published), reject (Draft), depublish
- getOperators, updateOperatorStatus : activation/suspension avec autoApproveProducts toggle
- getUsers, deleteUser : gestion utilisateurs (admins protégés)

Pages frontend :
- AdminDashboardPage.jsx : stats cards, liens vers toutes les sections admin
- AdminProductsPage.jsx : IMPORTANT : extraire les produits avec
  setProducts(Array.isArray(data) ? data : (data?.products || []))
  car l'API retourne un objet paginé, pas un array direct
- AdminOperatorsPage.jsx : liste opérateurs, filtres par status, modal détail avec
  onboarding info, boutons approuver/rejeter/suspendre, toggle auto-approve
- AdminUsersPage.jsx : liste users, filtres par rôle, suppression
- AdminSettingsPage.jsx : toggles auto-approbation produits et reviews
```

---

## Phase 6 — Fonctionnalités Sociales

### Prompt 6.1 — Reviews & Inquiries
```
Crée backend/models/reviewModel.js :
- user (ref User), product (ref Product), rating (1-5), comment, status (Pending/Approved/Rejected)
- Unique compound index : 1 review par user par produit

Crée backend/models/inquiryModel.js :
- user, product, operator, type (manual/automatic), question, answer, status

Contrôleurs :
- reviewController : createReview (auto-approve si setting + user approved), getProductReviews
  (only Approved), admin approve/reject
- inquiryController : createInquiry, respond (opérateur), approve/reject (automatic type)

Frontend : ReviewModal, ReviewsList, InquiryModal, InquiriesPage (opérateur), MyInquiriesPage (client)
```

### Prompt 6.2 — Notifications, Favoris, Fidélité
```
Crée les modèles : notificationModel, favoriteModel, viewHistoryModel.

Contrôleurs :
- notificationController : getNotifications, markAsRead, markAllAsRead, getUnreadCount
- notificationService : createNotification auto (nouvelle réservation, review, inquiry, etc.)
- favoriteController : toggle favori, listes, alertes prix, partage
- loyaltyController : getMyLoyalty, points history
- viewHistoryController : trackView, getHistory
- recommendationController : recommandations personnalisées basées sur historique

Frontend :
- NotificationBadge.jsx dans Header (compteur non-lu)
- NotificationsPage.jsx
- FavoritesPage.jsx avec listes et alertes prix
- FavoriteButton.jsx intégré sur ProductCard
- LoyaltyPage.jsx avec niveaux et historique points
- ViewHistoryPage.jsx
- RecommendationsSection.jsx et RecommendedProducts.jsx
```

---

## Phase 7 — Onboarding & Badges

### Prompt 7.1 — Onboarding Opérateur
```
Crée backend/models/operatorOnboardingModel.js :
- user (ref User), onboardingStatus (in_progress/completed/pending_approval/approved/rejected)
- progress (Number 0-100)
- Étapes : publicName, providerType (company/individual_with_status/individual_without_status),
  companyInfo, individualWithStatusInfo, experienceDescription, experienceLocation, rejectionReason

Crée onboardingController (6 étapes) + onboardingMiddleware (validation par étape)
Crée operatorWizardController (wizard simplifié 4 étapes) + middleware

Frontend :
- OperatorOnboardingPage.jsx : formulaire multi-étapes avec progression
- OperatorWizardPage.jsx : wizard simplifié
- PartnerSignupPage.jsx : landing page inscription partenaire
```

### Prompt 7.2 — Badges & Approval Requests
```
Crée badgeModel, badgeRequestModel, approvalRequestModel.
Crée badgeService.js : attribution auto basée sur métriques (viewCount, bookingCount, rating)
Contrôleurs : badgeController, badgeRequestController, approvalRequestController
Crée backend/controllers/withdrawalController.js + withdrawalModel

Frontend :
- AdminBadgeManagementPage, AdminBadgeRequestsPage
- BadgeDisplay.jsx, BadgeRequestModal.jsx
- ApprovalRequestsPage.jsx
- WithdrawalsPage.jsx (opérateur), AdminWithdrawalsPage.jsx
```

---

## Phase 8 — Blog, Chat, FAQ, SEO

### Prompt 8.1 — Contenu & SEO
```
Crée blogModel (title, slug, content, excerpt, category, tags, author, status, seo, featuredImage)
Crée blogController : CRUD complet avec slugs auto, filtres catégorie/tag, pagination
Crée faqModel + faqController : CRUD FAQ
Crée chatModel + chatController : conversations chatbot

Frontend :
- BlogPage.jsx, BlogPostPage.jsx, BlogCard.jsx, TagHubPage.jsx
- AdminBlogPage.jsx, AdminBlogFormPage.jsx
- ChatWidget.jsx : widget flottant
- FAQSection.jsx : accordion sur pages produits

SEO :
- Crée backend/routes/sitemapRoutes.js : génère /api/sitemap.xml dynamique avec tous les produits/articles
- Ajoute react-helmet-async sur CHAQUE page avec title, meta description, og tags
```

---

## Phase 9 — UI/UX Premium

### Prompt 9.1 — Layout & Navigation
```
Crée les composants de layout :
- Header.jsx : logo, navigation, recherche, menu utilisateur adaptatif selon rôle
  (liens Admin Dashboard pour admins, Operator Dashboard pour opérateurs),
  NotificationBadge, CurrencySelector, LanguageSelector, menu mobile hamburger
- Footer.jsx : liens, réseaux sociaux, newsletter
- Layout.jsx : Header + Outlet + Footer
- MobileBottomNav.jsx : navigation bottom bar mobile
- ScrollToTopButton.jsx : bouton flottant scroll to top

Page d'accueil (route /) :
- Hero.jsx : section héro avec recherche
- Features.jsx : icônes de confiance
- TopDestinations.jsx : grille destinations avec cartes
- FlexibilityBanner.jsx : bannière réassurance
- RecommendedProducts.jsx : carrousel recommandations
- AuthCTA.jsx : call-to-action inscription
- TrustBar.jsx : barre de confiance
```

---

## Phase 10 — Déploiement Vercel

### Prompt 10.1 — Configuration Vercel
```
Configure le déploiement Vercel :

1. Crée api/index.js : importe server.js et exporte default app pour serverless

2. Crée vercel.json :
   - buildCommand: "cd frontend && npm install && npm run build"
   - outputDirectory: "frontend/dist"
   - rewrites: /api/(.*) → /api/index.js, tout le reste → /index.html (SPA)
   - headers: Content-Type correct pour .js et .css, CSP pour Stripe

3. Dans server.js :
   - app.set('trust proxy', 1) pour rate limiting
   - Servir frontend/dist en production avec express.static
   - SPA fallback: servir index.html pour routes non-API
   - Export default app (pour Vercel) + listen conditionnel (local seulement)
   - Auto-seed admin + opérateur au démarrage si absents de la BDD

4. Crée frontend/public/sw.js : Service Worker basique avec cache strategy

5. Variables d'environnement Vercel : MONGO_URI, JWT_SECRET, JWT_REFRESH_SECRET,
   STRIPE_SECRET_KEY, CLOUDINARY_*, NODE_ENV=production
```

---

## Phase 11 — Scripts & Outils

### Prompt 11.1 — Scripts Utilitaires
```
Crée ces scripts dans scripts/ :
- createAdmin.js : crée un user Admin depuis ADMIN_EMAIL/ADMIN_PASSWORD env vars
- massImporter.js : lit un JSON de produits et les insère en BDD avec schedules auto
- publishAll.js : met tous les produits en status Published
- initializeBadges.js : seed les badges par défaut en BDD
- resetAndSeed.js : drop collections + re-seed données de test
- testLogin.js : teste la connexion avec des credentials
- test-security.js : tests basiques de sécurité (rate limiting, auth, injection)
```

---

## Phase 12 — Hardening & Polish

### Prompt 12.1 — Robustesse Production
```
Passe en revue et applique ces corrections critiques :

1. Tous les composants frontend qui appellent .map() sur des données API doivent
   vérifier Array.isArray() d'abord. Si l'API retourne un objet paginé {products, pagination},
   extraire le tableau avec : Array.isArray(data) ? data : (data?.products || [])

2. Tous les .toFixed() doivent être protégés : (value || 0).toFixed(2)

3. ErrorBoundary utilise <a href="/"> au lieu de <Link to="/"> car il est monté
   HORS du BrowserRouter dans main.jsx

4. PaymentSelector charge Stripe dans un try/catch pour éviter les crashs si le script
   est bloqué par un ad-blocker

5. authController normalise les emails avec .toLowerCase().trim() pour login ET register

6. authMiddleware normalise les rôles (accents français) pour éviter les 403 erronés

7. server.js : trust proxy activé, auto-seed non-bloquant des comptes par défaut

8. Tous les imports dans DashboardPage.jsx doivent inclure Award (lucide-react) et
   RecommendationsSection pour éviter ReferenceError en production
```

---

## Ordre d'Exécution Résumé

| # | Phase | Prompts | Résultat |
|---|-------|---------|----------|
| 1 | Init | 1.1, 1.2 | Projet scaffold |
| 2 | Auth | 2.1, 2.2 | Login/Register fonctionnel |
| 3 | Produits | 3.1, 3.2 | Catalogue et recherche |
| 4 | Booking | 4.1, 4.2 | Réservation + paiement |
| 5 | Dashboards | 5.1, 5.2 | Opérateur + Admin |
| 6 | Social | 6.1, 6.2 | Reviews, notifs, favoris, fidélité |
| 7 | Onboarding | 7.1, 7.2 | Badges, withdrawals, approval |
| 8 | Contenu | 8.1 | Blog, FAQ, chat, SEO |
| 9 | UI/UX | 9.1 | Layout premium, navigation |
| 10 | Deploy | 10.1 | Vercel production |
| 11 | Scripts | 11.1 | Outils CLI |
| 12 | Hardening | 12.1 | Corrections production |

---

**Total : 19 prompts pour reconstruire l'intégralité d'Overglow V1.**
