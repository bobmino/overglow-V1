# Document de Définition Technique (DDT) - Overglow V1

**Version :** 1.0  
**Date :** 2025-02-XX  
**Statut :** En Production

---

## 1. Vue d'Ensemble

### 1.1 Présentation
Overglow est une plateforme de réservation d'expériences et d'activités touristiques au Maroc. La plateforme connecte les voyageurs avec des opérateurs locaux authentiques, offrant des expériences culturelles uniques.

### 1.2 Objectifs
- Promouvoir le tourisme authentique marocain
- Soutenir les opérateurs locaux
- Offrir une expérience de réservation fluide et sécurisée
- Différenciation par l'authenticité et le support local

### 1.3 Architecture Générale
- **Frontend :** React 18 + Vite + Tailwind CSS
- **Backend :** Node.js + Express.js
- **Base de données :** MongoDB + Mongoose
- **Authentification :** JWT (JSON Web Tokens)
- **Déploiement :** Vercel (Frontend + Backend serverless)
- **Paiements :** Stripe, PayPal, CMI (Maroc)

---

## 2. Architecture Technique

### 2.1 Stack Technologique

#### Frontend
```
React 18.3.1
├── React Router DOM 6.x (Routing)
├── Axios (HTTP Client)
├── Tailwind CSS 3.x (Styling)
├── Lucide React (Icons)
├── Recharts (Graphiques)
├── i18next (Internationalisation)
└── Context API (State Management)
```

#### Backend
```
Node.js 18+
├── Express.js 4.x (Framework)
├── MongoDB + Mongoose (Database)
├── JWT (Authentication)
├── bcryptjs (Password Hashing)
├── express-validator (Validation)
├── multer (File Upload)
└── dotenv (Environment Variables)
```

#### Infrastructure
```
Vercel
├── Serverless Functions (Backend)
├── Edge Network (CDN)
├── Automatic SSL
└── Environment Variables Management
```

### 2.2 Structure des Dossiers

```
overglow-v1/
├── backend/
│   ├── controllers/        # Logique métier
│   ├── models/             # Schémas Mongoose
│   ├── routes/             # Routes API
│   ├── middleware/         # Middlewares (auth, error)
│   ├── utils/              # Utilitaires (badges, notifications)
│   └── config/             # Configuration (DB, etc.)
├── frontend/
│   ├── src/
│   │   ├── pages/          # Pages React
│   │   ├── components/     # Composants réutilisables
│   │   ├── context/        # Context API (Auth, Currency)
│   │   ├── config/         # Configuration (axios)
│   │   └── App.jsx         # Routeur principal
│   └── public/             # Assets statiques
├── api/                    # Entry point Vercel serverless
├── scripts/                # Scripts utilitaires
└── docs/                   # Documentation
```

---

## 3. Modèles de Données

### 3.1 User (Utilisateur)
```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique),
  password: String (hashed, required),
  role: Enum ['Client', 'Opérateur', 'Admin'],
  isApproved: Boolean,
  approvedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 3.2 Operator (Opérateur)
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  companyName: String,
  status: Enum ['Pending', 'Under Review', 'Active', 'Suspended', 'Rejected'],
  description: String,
  publicName: String,
  experienceLocation: {
    city: String,
    address: String,
    coordinates: { lat, lng }
  },
  authenticity: {
    isArtisan: Boolean,
    isEcoFriendly: Boolean,
    isAuthenticLocal: Boolean,
    isTraditional: Boolean,
    isLocal100: Boolean
  },
  badges: [{ badgeId, earnedAt }],
  metrics: {
    viewCount, bookingCount, averageRating, reviewCount
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 3.3 Product (Produit)
```javascript
{
  _id: ObjectId,
  operator: ObjectId (ref: Operator),
  title: String (required),
  description: String (required),
  category: String,
  city: String,
  price: Number (required for Published),
  duration: Number,
  images: [String],
  highlights: [String],
  included: [String],
  requirements: [String],
  status: Enum ['Draft', 'Pending Review', 'Published'],
  authenticity: {
    isArtisan, isEcoFriendly, isAuthenticLocal, isTraditional, isLocal100
  },
  badges: [{ badgeId, earnedAt }],
  metrics: {
    viewCount, bookingCount, averageRating, reviewCount,
    isPopular, isBestValue, isNew, isLastMinute
  },
  cancellationPolicy: {
    type: Enum ['free', 'moderate', 'strict', 'non_refundable'],
    freeCancellationHours: Number,
    refundPercentage: Number,
    description: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 3.4 Booking (Réservation)
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  schedule: ObjectId (ref: Schedule),
  operator: ObjectId (ref: Operator),
  numberOfTickets: Number,
  totalAmount: Number,
  totalPrice: Number,
  status: Enum ['Pending', 'Confirmed', 'Cancelled'],
  paymentMethod: String,
  paymentIntentId: String,
  internalNote: String,
  isHandled: Boolean,
  handledAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  refundAmount: Number,
  refundStatus: Enum ['Not Applicable', 'Pending', 'Processed', 'Rejected'],
  createdAt: Date,
  updatedAt: Date
}
```

### 3.5 Badge (Badge)
```javascript
{
  _id: ObjectId,
  name: String (required),
  type: Enum ['product', 'operator'] (required),
  icon: String,
  color: String,
  description: String,
  criteria: Object, // Critères d'attribution
  isAutomatic: Boolean,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 3.6 Chat & Message
```javascript
// Chat
{
  _id: ObjectId,
  participants: [ObjectId (ref: User)],
  type: Enum ['inquiry', 'support', 'operator'],
  relatedEntity: { type: String, id: ObjectId },
  lastMessage: ObjectId (ref: Message),
  lastMessageAt: Date,
  isActive: Boolean,
  unreadCount: Map
}

// Message
{
  _id: ObjectId,
  chat: ObjectId (ref: Chat),
  sender: ObjectId (ref: User),
  content: String,
  type: Enum ['text', 'image', 'file', 'system'],
  attachments: [{ url, type, name }],
  isRead: Boolean,
  readAt: Date,
  createdAt: Date
}
```

### 3.7 FAQ
```javascript
{
  _id: ObjectId,
  question: String (required),
  answer: String (required),
  category: Enum ['general', 'booking', 'payment', ...],
  subcategory: String,
  tags: [String],
  language: Enum ['fr', 'ar', 'en', 'es'],
  order: Number,
  isActive: Boolean,
  views: Number,
  helpful: Number,
  notHelpful: Number,
  createdBy: ObjectId (ref: User),
  updatedBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

---

## 4. API Endpoints

### 4.1 Authentification
```
POST   /api/auth/register          # Inscription
POST   /api/auth/login             # Connexion
GET    /api/auth/profile           # Profil utilisateur
PUT    /api/auth/profile           # Mise à jour profil
```

### 4.2 Produits
```
GET    /api/products               # Liste produits (public)
GET    /api/products/:id           # Détail produit (public)
POST   /api/products               # Créer produit (opérateur)
PUT    /api/products/:id           # Modifier produit (opérateur)
DELETE /api/products/:id           # Supprimer produit (opérateur)
```

### 4.3 Réservations
```
GET    /api/bookings               # Mes réservations (user)
POST   /api/bookings               # Créer réservation (user)
GET    /api/bookings/:id           # Détail réservation
PUT    /api/bookings/:id           # Modifier réservation
DELETE /api/bookings/:id           # Annuler réservation
```

### 4.4 Opérateur
```
GET    /api/operator/dashboard     # Dashboard opérateur
GET    /api/operator/products      # Produits opérateur
GET    /api/operator/bookings       # Réservations opérateur
GET    /api/operator/analytics      # Analytics basiques
GET    /api/operator/analytics/advanced  # Analytics avancés
GET    /api/operator/analytics/export/csv  # Export CSV
GET    /api/operator/onboarding     # Statut onboarding
PUT    /api/operator/onboarding/:step  # Mettre à jour étape
POST   /api/operator/onboarding/submit  # Soumettre onboarding
```

### 4.5 Admin
```
GET    /api/admin/stats            # Statistiques globales
GET    /api/admin/users             # Liste utilisateurs
GET    /api/admin/operators         # Liste opérateurs
PUT    /api/admin/operators/:id/approve  # Approuver opérateur
GET    /api/admin/products           # Liste produits
PUT    /api/admin/products/:id/approve  # Approuver produit
GET    /api/admin/badges            # Liste badges
POST   /api/admin/badges            # Créer badge
PUT    /api/admin/badges/:id       # Modifier badge
POST   /api/admin/badges/assign-products  # Attribuer badges produits
POST   /api/admin/badges/assign-operators  # Attribuer badges opérateurs
GET    /api/admin/badges/:id/products  # Produits avec badge
GET    /api/admin/badges/:id/operators  # Opérateurs avec badge
GET    /api/admin/badge-requests    # Demandes badges
PUT    /api/admin/badge-requests/:id/approve  # Approuver demande
PUT    /api/admin/badge-requests/:id/reject   # Rejeter demande
GET    /api/admin/settings          # Paramètres
PUT    /api/admin/settings          # Mettre à jour paramètres
```

### 4.6 Badges
```
GET    /api/badges                 # Liste badges (public)
GET    /api/badges/:id             # Détail badge
GET    /api/badges/requestable     # Badges demandables
POST   /api/badge-requests         # Demander badge (opérateur)
GET    /api/badge-requests/my-requests  # Mes demandes
```

### 4.7 Chat
```
GET    /api/chat                   # Mes chats
GET    /api/chat/inquiry/:inquiryId  # Chat pour inquiry
GET    /api/chat/:id               # Détail chat
POST   /api/chat/:id/messages      # Envoyer message
PUT    /api/chat/:id/read          # Marquer comme lu
```

### 4.8 FAQ
```
GET    /api/faq                    # Liste FAQ (public)
GET    /api/faq/categories         # Catégories FAQ
GET    /api/faq/:id                # Détail FAQ
POST   /api/faq/:id/feedback       # Feedback FAQ
POST   /api/faq                    # Créer FAQ (admin)
PUT    /api/faq/:id                # Modifier FAQ (admin)
DELETE /api/faq/:id                # Supprimer FAQ (admin)
```

### 4.9 Paiements
```
POST   /api/payments/create-stripe-intent  # Créer intent Stripe
POST   /api/payments/create-paypal-order   # Créer order PayPal
POST   /api/payments/cmi-init              # Initier paiement CMI
POST   /api/payments/cash-pickup           # Paiement espèces
POST   /api/payments/cash-delivery         # Paiement livraison
GET    /api/payments/convert-to-mad        # Convertir en MAD
```

---

## 5. Pages et Composants Frontend

### 5.1 Pages Publiques
- **HomePage** (`/`) : Hero, Features, Top Destinations, Top Tours, Recommandations
- **SearchPage** (`/search`) : Recherche avec filtres avancés
- **ProductDetailPage** (`/products/:id`) : Détail produit, calendrier, réservation
- **AboutPage** (`/about`) : À propos
- **HelpPage** (`/help`) : FAQ dynamique, guides, chat support
- **PrivacyPage** (`/privacy`) : Politique de confidentialité
- **BlogPage** (`/blog`) : Blog (à enrichir)
- **AffiliatePage** (`/affiliate`) : Devenir partenaire

### 5.2 Pages Client
- **LoginPage** (`/login`) : Connexion
- **RegisterPage** (`/register`) : Inscription
- **DashboardPage** (`/dashboard`) : Dashboard client
- **ProfilePage** (`/profile`) : Profil utilisateur
- **FavoritesPage** (`/favorites`) : Produits favoris
- **LoyaltyPage** (`/loyalty`) : Programme fidélité
- **ViewHistoryPage** (`/view-history`) : Historique navigation
- **MyInquiriesPage** (`/dashboard/inquiries`) : Mes inquiries
- **BookingPage** (`/booking`) : Page réservation
- **CheckoutPage** (`/checkout`) : Paiement
- **BookingSuccessPage** (`/booking-success`) : Confirmation réservation
- **NotificationsPage** (`/notifications`) : Notifications

### 5.3 Pages Opérateur
- **OperatorDashboardPage** (`/operator/dashboard`) : Dashboard opérateur
- **OperatorProductsPage** (`/operator/products`) : Gestion produits
- **OperatorProductFormPage** (`/operator/products/new`, `/operator/products/:id/edit`) : Formulaire produit
- **OperatorBookingsPage** (`/operator/bookings`) : Gestion réservations
- **OperatorOnboardingPage** (`/operator/onboarding`) : Onboarding multi-étapes
- **OperatorWizardPage** (`/operator/wizard`) : Assistant création produit
- **AnalyticsPage** (`/operator/analytics`) : Analytics avancés
- **InquiriesPage** (`/operator/inquiries`) : Gestion inquiries
- **WithdrawalsPage** (`/operator/withdrawals`) : Retraits

### 5.4 Pages Admin
- **AdminDashboardPage** (`/admin/dashboard`) : Dashboard admin
- **AdminOperatorsPage** (`/admin/operators`) : Gestion opérateurs
- **AdminProductsPage** (`/admin/products`) : Validation produits
- **AdminUsersPage** (`/admin/users`) : Gestion utilisateurs
- **AdminBadgeManagementPage** (`/admin/badges`) : Gestion badges
- **AdminBadgeRequestsPage** (`/admin/badge-requests`) : Demandes badges
- **AdminSettingsPage** (`/admin/settings`) : Paramètres système
- **AdminWithdrawalsPage** (`/admin/withdrawals`) : Gestion retraits

### 5.5 Composants Principaux
- **Header** : Navigation principale, CurrencySelector, NotificationBadge
- **Footer** : Liens footer, informations légales
- **ProductCard** : Carte produit avec badges, prix multi-devise
- **TourCard** : Carte tour/expérience
- **BadgeDisplay** : Affichage badges avec icônes et couleurs
- **CurrencySelector** : Sélecteur devise (MAD/€/USD)
- **PaymentSelector** : Sélecteur méthode paiement
- **FAQSection** : Section FAQ avec recherche et filtres
- **ChatWidget** : Widget chat en temps réel
- **DashboardNavBar** : Navigation dashboard opérateur/admin
- **AdvancedFilters** : Filtres avancés recherche
- **DatePicker** : Sélecteur date
- **TimeSlotPicker** : Sélecteur créneaux horaires

---

## 6. Fonctionnalités Principales

### 6.1 Recherche et Découverte
- Recherche par mots-clés (titre, description, highlights)
- Filtres avancés : prix, durée, note, catégorie, ville, date
- Tri : pertinence, prix, note, popularité
- Recherche géolocalisée (rayon km)
- Recommandations personnalisées
- Historique de navigation

### 6.2 Réservation
- Sélection date et créneau horaire
- Calcul prix automatique
- Vérification disponibilité
- Multi-méthodes paiement (Stripe, PayPal, CMI, Cash)
- Confirmation email
- Politique annulation flexible

### 6.3 Gestion Opérateur
- Onboarding multi-étapes
- Création/édition produits
- Gestion réservations
- Analytics avancés (funnel, concurrence, recommandations)
- Retraits
- Demandes badges

### 6.4 Gestion Admin
- Validation opérateurs et produits
- Gestion badges (création, attribution, modification)
- Gestion demandes badges
- Paramètres système (auto-approbation)
- Statistiques globales

### 6.5 Badges et Authenticité
- Badges automatiques (Populaire, Meilleure Valeur, Nouveau)
- Badges manuels (Artisan, Éco-responsable, Traditionnel)
- Critères d'attribution configurables
- Demandes badges opérateurs
- Affichage badges produits/opérateurs

### 6.6 Multi-Devise
- Sélection devise (MAD, EUR, USD)
- Conversion prix en temps réel
- API FX externe
- Affichage prix cohérent partout
- Paiement selon devise sélectionnée

### 6.7 Avis et Reviews
- Création avis après réservation
- Upload photos (max 5)
- Votes utile/pas utile
- Réponses opérateurs
- Modération admin
- Badge "Vérifié"

### 6.8 Notifications
- Notifications temps réel
- Badge compteur
- Catégories : réservations, reviews, inquiries, badges
- Marquer comme lu
- Supprimer

### 6.9 Chat et Support
- Chat inquiry client-opérateur
- Chat support général
- FAQ dynamique avec recherche
- Guides rapides
- Feedback FAQ

### 6.10 Programme Fidélité
- Points par réservation (1% montant)
- Niveaux : Bronze, Argent, Or, Platine
- Avantages par niveau
- Badge niveau visible

---

## 7. Charte Graphique

### 7.1 Couleurs Principales
```css
Primary (Vert) : #059669 (emerald-600)
Primary Dark : #047857 (emerald-700)
Primary Light : #10b981 (emerald-500)
Secondary : #15803d (green-600)
Accent : #f59e0b (amber-500)
```

### 7.2 Typographie
- **Font Family** : System fonts (sans-serif)
- **Headings** : Bold, tailles 2xl-5xl
- **Body** : Regular, taille base
- **Small** : text-sm pour métadonnées

### 7.3 Espacements
- **Container** : max-w-7xl mx-auto px-4
- **Sections** : py-12 ou py-20
- **Cards** : p-6 ou p-8
- **Gaps** : gap-4, gap-6, gap-8

### 7.4 Composants UI
- **Buttons** : rounded-lg, px-4/6 py-2/3, font-semibold
- **Cards** : bg-white rounded-xl shadow-lg border border-gray-200
- **Inputs** : border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500
- **Badges** : px-3 py-1 rounded-full text-xs font-bold

### 7.5 Responsive
- **Mobile** : < 768px
- **Tablet** : 768px - 1024px
- **Desktop** : > 1024px
- **Breakpoints Tailwind** : sm, md, lg, xl, 2xl

---

## 8. Sécurité

### 8.1 Authentification
- JWT avec expiration
- Hashage mots de passe (bcrypt, 10 rounds)
- Refresh tokens (à implémenter)
- Protection routes avec middleware

### 8.2 Validation
- Validation backend avec express-validator
- Sanitization inputs
- Validation fichiers upload (type, taille)
- Protection injection (Mongoose)

### 8.3 CORS
- Origines autorisées configurées
- Credentials supportés
- OPTIONS preflight géré

### 8.4 Headers Sécurité
- CORS headers
- Content-Type validation
- Rate limiting (à implémenter)

---

## 9. Performance

### 9.1 Frontend
- Lazy loading images
- Code splitting (React.lazy)
- Service Worker PWA
- Optimisation bundle (Vite)

### 9.2 Backend
- Indexes MongoDB
- Pagination résultats
- Cache (à implémenter)
- Serverless functions (Vercel)

### 9.3 Optimisations
- Images optimisées
- Minification JS/CSS
- CDN Vercel
- Compression gzip

---

## 10. Accessibilité

### 10.1 Standards
- WCAG 2.1 niveau AA
- Navigation clavier
- Screen readers
- Contraste couleurs

### 10.2 Implémentation
- Labels associés (htmlFor/id)
- ARIA labels et roles
- Autocomplete approprié
- Focus visible
- Messages erreur accessibles (role="alert")

---

## 11. Internationalisation

### 11.1 Langues Supportées
- Français (fr) - Par défaut
- Arabe/Darija (ar)
- Anglais (en)
- Espagnol (es)

### 11.2 Implémentation
- i18next pour traduction
- Détection langue navigateur
- Sélecteur langue dans header
- Persistance préférence (localStorage)

---

## 12. Déploiement

### 12.1 Environnements
- **Production** : Vercel (overglow-v1-3jqp.vercel.app)
- **Backend** : Vercel Serverless Functions
- **Database** : MongoDB Atlas

### 12.2 Variables d'Environnement
```
NODE_ENV=production
MONGODB_URI=...
JWT_SECRET=...
STRIPE_SECRET_KEY=...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
CMI_STORE_KEY=...
FX_API_KEY=...
EMAIL_HOST=...
EMAIL_PORT=...
EMAIL_USER=...
EMAIL_PASS=...
```

### 12.3 Build Process
```
Frontend:
npm run build → vite build → dist/

Backend:
Vercel auto-detects api/ directory → Serverless functions
```

---

## 13. Monitoring et Analytics

### 13.1 Métriques
- Vues produits
- Réservations
- Conversions (funnel)
- Revenus
- Performance produits

### 13.2 Logs
- Console logs backend
- Erreurs frontend (console.error)
- Vercel logs (serverless functions)

### 13.3 Analytics Opérateur
- Conversion funnel
- Performance produits
- Analyse concurrence
- Recommandations optimisation

---

## 14. Évolutions Futures

### 14.1 Court Terme
- Tests automatisés (Jest, Cypress)
- Rate limiting
- Cache Redis
- WebSocket pour chat temps réel

### 14.2 Moyen Terme
- Application mobile (React Native)
- Push notifications
- A/B testing
- Recommandations ML

### 14.3 Long Terme
- Marketplace multi-pays
- Programme affiliés avancé
- API publique
- Intégrations tierces

---

**Fin du Document de Définition Technique**

