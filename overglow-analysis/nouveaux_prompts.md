Série Overglow Pro — 20 Prompts Cursor
Règles d'exécution
Exécuter UN prompt à la fois
Attendre que le déploiement Vercel soit "Ready" avant le suivant
Chaque prompt est indépendant et ne modifie que ses fichiers cibles
Ordre = dépendances respectées

## Tracker
- [x] HOTFIX S0 — Shell backoffice hors Layout public
- [x] HOTFIX S1 — Catalogue productType + galerie + villes
- [x] HOTFIX S2 — Loyalty + perf
- [x] PROMPT 1 — Sidebar Admin Persistante
- [x] PROMPT 2 — Page Réservations Admin
- [x] PROMPT 3 — Cloche de Notifications Header
- [x] PROMPT 4 — Dashboard Admin Pro
- [x] PROMPT 5 — Settings Complètes & Organisées
- [x] PROMPT 6 — Chat Pro + Inbox Admin
- [x] PROMPT 7 — Notifications Temps Réel
- [x] PROMPT 8 — Page Finances Admin
- [x] PROMPT 9 — Opérateur Sidebar + Navigation
- [x] PROMPT 10 — Guide Utilisateur + Documentation API
- [x] PROMPT 11 — Reviews & Modération
- [x] PROMPT 12 — Recherche Globale Admin
- [x] PROMPT 13 — Pages Placeholder → Réelles
- [x] PROMPT 16 — Filtres Avancés + DataTable
- [x] PROMPT 17 — Onboarding Utilisateur Amélioré
- [x] PROMPT 18 — Templates Email
- [x] PROMPT 19 — Audit Qualité
- [x] FOLLOW-UP — Empty states unifiés (voyageur / opérateur / admin)
- [x] INT-02 — SEOHead + hreflang + meta multi-langue (fondations)
- [x] INT-01 — i18n Routing préfixe langue `/fr|/en|/es|/ar`
- [x] INT-03 — Contenu éditorial SEO par marché (Wave 1 — blog language + seed FR/EN/ES/AR)

PROMPT 1 — 🔴 Sidebar Admin Persistante

You are a senior frontend architect specializing in admin dashboards (Airbnb Host, Booking.com Extranet level).

TASK: Create a persistent collapsible sidebar for the admin and operator areas.

CONTEXT:
- File: frontend/src/components/DashboardNavBar.jsx — currently a TOP bar with only 1-2 links per route. Admins are STRANDED on sub-pages.
- File: frontend/src/App.jsx — route definitions. Admin routes start with /admin/*, operator routes with /operator/*
- There is NO admin sidebar. The only "menu" is 9 flat buttons on AdminDashboardPage.jsx that disappear when navigating away.

REQUIREMENTS:
1. Create `frontend/src/components/AdminSidebar.jsx`:
   - Persistent left sidebar, 260px wide (collapsed: 64px icon-only)
   - Toggle button (hamburger/chevron) to collapse/expand
   - Smooth transition with framer-motion or CSS transition
   - Active route highlighted with accent color + left border
   - Grouped sections with labels:

   ADMIN MENU:
   📊 Tableau de bord → /admin/dashboard
   📈 Analytics → /admin/analytics
   ────────────────
   👥 Utilisateurs → /admin/users
   🏢 Opérateurs → /admin/operators
   📦 Produits → /admin/products
   📋 Réservations → /admin/bookings (NEW route)
   ────────────────
   💰 Paiements en attente → /admin/pending-payments
   💸 Retraits → /admin/withdrawals
   🏦 Finances → /admin/finance (NEW route, placeholder for now)
   ────────────────
   ✍️ Blog → /admin/blog
   🏅 Badges → /admin/badges
   🤝 Demandes opérateurs → /admin/approval-requests
   🏅 Demandes badges → /admin/badge-requests
   ────────────────
   ⚙️ Paramètres → /admin/settings

   OPERATOR MENU (when on /operator/* routes):
   📊 Mon tableau de bord → /operator/dashboard
   📦 Mes produits → /operator/products
   📅 Mes réservations → /operator/bookings
   💬 Messages → /operator/inquiries
   💰 Mes revenus → /operator/withdrawals
   ⭐ Mes avis → (section in dashboard)
   👤 Mon profil → /profile

2. Integrate in App.jsx:
   - Show AdminSidebar on ALL /admin/* and /operator/* routes
   - Main content area shifts right with margin-left equal to sidebar width
   - On mobile (<768px): sidebar is an overlay drawer, closed by default, opened via hamburger button in top bar
   - Add a mobile top bar with hamburger + page title + notification bell placeholder

3. Remove the flat button menus from AdminDashboardPage.jsx (lines 73-128 and 200-227) — the sidebar replaces them.

4. Style:
   - Dark sidebar (slate-900/bg-neutral-900) with light text
   - Icons from lucide-react (LayoutDashboard, Users, Building2, Package, CalendarDays, CreditCard, Banknote, TrendingUp, FileText, Award, Handshake, Settings, MessageSquare, Star)
   - Hover effect on items
   - Badge count on "Réservations" and "Messages" (use static 0 for now, will be dynamic later)
   - Match the existing Tailwind config and color tokens

5. The old DashboardNavBar.jsx should still work for /dashboard (user dashboard) — do NOT break it.

TESTING: Verify navigation between all admin pages works. Verify sidebar persists across page changes. Verify mobile drawer opens/closes.


PROMPT 2 — 🔴 Page Réservations Admin

You are a full-stack developer building a professional booking management page.

TASK: Create the admin bookings page — currently this page DOES NOT EXIST. Admins cannot see or manage bookings.

CONTEXT:
- Backend model: backend/models/bookingModel.js — Mongoose schema with status, userId, productId, operatorId, amount, dates, etc.
- Backend controller: backend/controllers/bookingController.js — has user-facing booking CRUD
- Backend routes: backend/routes/bookingRoutes.js
- Admin controller: backend/controllers/adminController.js — has getAdminStats and getAnalytics but NO getAdminBookings
- Admin routes: backend/routes/adminRoutes.js

REQUIREMENTS:
1. Backend — Add to adminController.js:
   - `getAdminBookings(req, res)` — paginated, filterable booking list
   - Query params: page, limit (default 20), status (comma-separated), search (user email/name), productId, operatorId, dateFrom, dateTo, sortBy (createdAt, amount), sortOrder (asc/desc)
   - Populate: userId (name, email), productId (title, images), operatorId (businessName)
   - Return: { bookings: [...], total, page, totalPages, filters }
   - Add route GET /api/admin/bookings in adminRoutes.js with auth+admin middleware

2. Frontend — Create `frontend/src/pages/AdminBookingsPage.jsx`:
   - Professional data table with columns:
     * ID (truncated), Utilisateur (name + email), Produit (title), Opérateur, Montant (formatted MAD), Statut (colored badge), Date, Actions
   - Status badges: confirmed=green, pending=yellow, cancelled=red, completed=blue, pending_payment=orange
   - Filter bar at top:
     * Search input (user email/name)
     * Status multi-select dropdown (all statuses)
     * Date range picker (from/to)
     * "Réinitialiser" button
   - Actions per row:
     * Eye icon → modal with full booking details (all fields, user info, product info, payment info)
     * For pending_payment: "Valider paiement" button
     * For confirmed: "Annuler" button (with confirmation dialog)
   - Pagination: Previous/Next + page numbers + "X sur Y résultats"
   - Export CSV button
   - Loading skeleton while fetching
   - Empty state: "Aucune réservation trouvée" with illustration
   - Stats bar at top: Total réservations, Ce mois, Revenu total, Taux d'annulation

3. Add route in App.jsx: /admin/bookings → AdminBookingsPage (wrapped in AdminRoute)

4. All text in French. Use existing i18n keys where available, add new ones where needed.

STYLE: Clean table design, zebra striping subtle, hover rows, sticky header. Match existing admin page styles.

PROMPT 3 — 🔴 Cloche de Notifications Header


You are a frontend UX engineer specializing in notification systems (Facebook, LinkedIn, Airbnb level).

TASK: Add a notification bell to the main header with dropdown, and fix the broken notification page.

CONTEXT:
- Header: frontend/src/components/Header.jsx — main site header, NO notification indicator exists
- Notifications page: frontend/src/pages/NotificationsPage.jsx
  - PROBLEM 1: Auto-marks ALL as read on page load (line 29-37) — user can never see what's new
  - PROBLEM 2: No date grouping
  - PROBLEM 3: No pagination — loads everything
  - PROBLEM 4: Uses raw emoji divs instead of lucide icons
- Backend: backend/controllers/notificationController.js, backend/routes/notificationRoutes.js
- NotificationBadge component exists: frontend/src/components/NotificationBadge.jsx (check if usable)

REQUIREMENTS:
1. NotificationBell component — `frontend/src/components/NotificationBell.jsx`:
   - Bell icon (lucide-react) in the Header, right side, before language selector
   - Red badge with unread count (fetched from GET /api/notifications?countOnly=true)
   - Add backend endpoint: GET /api/notifications/unread-count → { count: number }
   - Poll unread count every 30 seconds (lightweight)
   - On click: toggle dropdown panel (positioned below bell, right-aligned)

2. Dropdown panel:
   - Header: "Notifications" + "Tout marquer comme lu" link
   - List of last 5 unread notifications with:
     * Icon based on type (use lucide: CalendarDays for booking, Package for product, Star for review, MessageSquare for inquiry, Banknote for payment)
     * Title (bold if unread)
     * Relative time ("il y a 2h", "hier")
     * Click → navigate to relevant page + mark as read
   - Footer: "Voir toutes les notifications" → /notifications
   - If no unread: "Aucune nouvelle notification" with checkmark icon
   - Max height 400px, scrollable
   - Close on click outside
   - Animate open/close (framer-motion scale + opacity)

3. Fix NotificationsPage.jsx:
   - REMOVE auto-mark-all-as-read on page load
   - Add date grouping: "Aujourd'hui", "Hier", "Cette semaine", "Plus ancien"
   - Replace emoji divs with lucide icons
   - Add "Tout marquer comme lu" button at top
   - Add pagination (load 20, "Charger plus" button)
   - Add individual "Marquer comme lu" on hover
   - Empty state when no notifications

4. Integrate NotificationBell in Header.jsx between the search bar and language selector.

5. Add unread count badge to the AdminSidebar on "Messages" item (pass as prop).

All text in French

PROMPT 4 — 🟠 Dashboard Admin Pro

You are a data visualization engineer building a professional admin dashboard (Mixpanel/Amplitude level).

TASK: Refactor the admin dashboard to be a real management command center.

CONTEXT:
- File: frontend/src/pages/AdminDashboardPage.jsx
  - PROBLEM: Only lifetime stats, no time filtering, no trends
  - PROBLEM: `operatorsByStatus` fetched (line 33) but NEVER rendered — dead data
  - PROBLEM: 9 flat buttons (lines 73-128) duplicate the 3 Quick Action cards (lines 200-227)
  - PROBLEM: AdminAnalytics component makes a SEPARATE API call, duplicating data
- Backend: backend/controllers/adminController.js
  - `getAdminStats`: returns lifetime totals only
  - `getAnalytics`: returns revenue by month + city, loads ALL bookings into memory

REQUIREMENTS:
1. Backend — Enhance getAdminStats in adminController.js:
   - Accept query param: period (today/7d/30d/90d/thisMonth/lastMonth/custom)
   - Accept dateFrom, dateTo for custom range
   - Return previous period values for trend calculation:
     { current: { revenue, bookings, users }, previous: { revenue, bookings, users } }
   - Add pendingActions count: operators pending approval, products pending review, payments pending, unread notifications
   - Add recentActivity: last 10 actions (new booking, new user, new operator signup, withdrawal request) with timestamp
   - Add topProducts: top 5 by revenue in period

2. Frontend — Refactor AdminDashboardPage.jsx:
   REMOVE: The 9 flat buttons (lines 73-128), the 3 duplicate Quick Action cards (lines 200-227), the dead operatorsByStatus fetch

   NEW LAYOUT:
   Top bar: Period selector (Today | 7j | 30j | 90j | Ce mois) as pill buttons

   Row 1 — KPI Cards (4 cards, grid):
   - Revenus: montant + trend ↑↓% vs période précédente (green if up, red if down)
   - Réservations: nombre + trend
   - Nouveaux utilisateurs: nombre + trend
   - Taux de conversion: bookings/users * 100 + trend

   Row 2 — Actions en attente (1 card, full width):
   - Horizontal pills: "3 opérateurs à approuver" (click → /admin/approval-requests), "5 produits en attente" (→ /admin/products), "2 paiements" (→ /admin/pending-payments)
   - Each pill is a clickable link with icon + count

   Row 3 — Two columns:
   Left (60%): Revenue chart (line chart, current vs previous period) — keep using recharts or existing chart lib
   Right (40%): Top 5 produits table (name, bookings, revenue, trend)

   Row 4 — Recent Activity feed:
   - Timeline style: icon + description + relative time
   - Max 8 items, "Voir tout" link

   All text in French. Numbers formatted with space separator (1 234 €).

3. Remove AdminAnalytics component import if no longer needed (or keep the chart part only).

PROMPT 5 — 🟠 Settings Complètes & Organisées

You are a product engineer building a professional platform settings page (Shopify/Vercel dashboard level).

TASK: Refactor the admin settings page into a comprehensive, organized settings center.

CONTEXT:
- File: frontend/src/pages/AdminSettingsPage.jsx — only 2 toggles (auto-approve products, auto-approve reviews)
- Backend model: backend/models/settingsModel.js — simple key-value store with upsert
- Backend: backend/controllers/settingsController.js, backend/routes/settingsRoutes.js
- Currently 4 keys defined: autoApproveProducts, autoApproveReviews, requireProductApproval, requireReviewApproval
  But only 2 are in the UI!
- A "Badges" link is awkwardly INSIDE the settings card — it's navigation, not a setting

REQUIREMENTS:
1. Create `frontend/src/pages/AdminSettingsPage.jsx` (REFACTOR):
   - Use Tabs component (or vertical tabs on desktop, horizontal on mobile):
   
   Tab 1: "Général"
   - Auto-approbation produits (toggle)
   - Auto-approbation avis (toggle)
   - Mode maintenance (toggle) — add new setting
   - Langue par défaut du site (select: FR/EN/AR/ES)
   - Devise par défaut (select: MAD/EUR/USD/GBP)
   
   Tab 2: "Finances"
   - Commission plateforme (%) — number input, 5-25%
   - Délai minimum de retrait (jours) — number, 1-30
   - Frais de transfert (MAD) — number
   - Seuil minimum de retrait (MAD) — number
   
   Tab 3: "Paiements"
   - Stripe: Activer (toggle), Mode test (toggle)
   - PayPal: Activer (toggle), Mode test (toggle)  
   - CMI: Activer (toggle)
   - Bancaire: Activer (toggle), IBAN affiché (toggle)
   - Each gateway shows: statut (actif/inactif) + mode
   
   Tab 4: "Notifications"
   - Email de support (text input)
   - Notification nouvel utilisateur (toggle)
   - Notification nouvelle réservation (toggle)
   - Notification paiement reçu (toggle)
   - Notification retrait demandé (toggle)
   - Fréquence d'envoi des emails récapitulatifs (select: quotidien/hebdomadaire/aucun)

2. Each toggle/change:
   - Saves immediately via PUT /api/settings/:key
   - Shows toast "Paramètre sauvegardé" on success
   - Shows error toast on failure
   - Loading state on save button/toggle

3. REMOVE the "Badges" link from settings — it belongs in the sidebar (already added in Prompt 1).

4. Style: Clean card-based layout per tab, consistent with existing design. Section headers within each tab. Help text under each setting (gray, small text explaining what it does).

5. All text in French. Add new i18n keys for any new text.

Backend: The existing settings controller supports any key-value pair via upsert, so NO backend changes needed — just use new keys.

PROMPT 6 — 🟠 Chat Pro + Inbox Admin


You are a real-time communication engineer (WhatsApp Web / Intercom level).

TASK: Upgrade the chat system and create an admin chat inbox.

CONTEXT:
- Chat widget: frontend/src/components/ChatWidget.jsx
  - PROBLEM: Paperclip and Image icons IMPORTED but NEVER RENDERED (dead code, lines 3)
  - PROBLEM: No chat list/inbox — you can only open a chat if you have the ID
  - PROBLEM: No typing indicator, no read receipts
  - PROBLEM: Polling every 5 seconds — no WebSocket
  - PROBLEM: Text-only messages
- Backend: backend/controllers/chatController.js, backend/routes/chatRoutes.js
- Backend model: backend/models/chatModel.js

REQUIREMENTS:
1. Fix ChatWidget.jsx:
   - WIRE the attachment buttons (Paperclip for files, Image for photos)
   - When clicked: open file picker, upload via existing /api/upload endpoint, send message with type: 'image' or 'file'
   - Display image messages inline (clickable to full-screen)
   - Display file messages with filename + download link
   - Add typing indicator: when user types, emit typing event; show "en train d'écrire..." with animated dots
   - Add read receipts: single check (sent), double check (delivered), blue double check (read)
   - Add message timestamp display (heure seule, pas date)

2. Create `frontend/src/pages/AdminChatInbox.jsx`:
   - Split layout: LEFT = conversation list (300px), RIGHT = active chat
   - Conversation list:
     * Search bar to filter conversations
     * Each item: avatar (first letter of name), name, last message preview (truncated), timestamp, unread badge
     * Sorted by last message time (most recent first)
     * Click → open conversation in right panel
   - Right panel: reuse ChatWidget logic but embedded (not floating)
   - Header: user/operator name + email + "Voir le profil" link
   - Empty state: "Aucune conversation" with icon
   - Backend: GET /api/chats/conversations → list of conversations with last message + unread count

3. Add route in App.jsx: /admin/chat → AdminChatInbox (wrapped in AdminRoute)
4. Add "💬 Messages" link in AdminSidebar (already added in Prompt 1, just verify icon/badge)

5. Backend additions in chatController.js:
   - `getConversations`: return list of unique chats with participant info, last message, unread count
   - `markConversationRead`: mark all messages in a chat as read
   - `getUnreadChatCount`: for badge count

All text in French. Keep the polling approach for now (WebSocket is a separate prompt).

PROMPT 7 — 🟠 Notifications Temps Réel (Polling Intelligent)

You are a backend systems engineer.

TASK: Implement intelligent notification polling and real-time updates for critical events.

CONTEXT:
- Current: Notifications are only fetched when user visits /notifications page
- No notification bell, no real-time updates
- Backend: backend/controllers/notificationController.js

REQUIREMENTS:
1. Backend — Add to notificationController.js:
   - GET /api/notifications/unread-count → { count: number } (lightweight, no populate)
   - POST /api/notifications/mark-all-read → { success: true }
   - Enhance createNotification to support these NEW types:
     * withdrawal_requested → "Nouveau retrait demandé par {operatorName}"
     * withdrawal_approved → "Votre retrait de {amount} MAD a été approuvé"
     * withdrawal_rejected → "Votre retrait a été refusé: {reason}"
     * product_rejected → "Votre produit '{title}' a été refusé: {reason}"
     * new_review → "Nouvel avis sur '{productTitle}'"
     * low_rating → "Avis négatif ({rating}/5) sur '{productTitle}'"

2. Backend — Trigger notifications at the right places:
   - In withdrawalController.js: when withdrawal is created → notify admin
   - In withdrawalController.js: when approved/rejected → notify operator
   - In adminController.js or productController.js: when product rejected → notify operator
   - In reviewController.js: when new review created → notify operator

3. Frontend — Create notification polling hook:
   - `frontend/src/hooks/useNotificationPolling.js`
   - Poll GET /api/notifications/unread-count every 30 seconds
   - Only poll when user is authenticated
   - Expose: unreadCount, refetch
   - Use in NotificationBell component (from Prompt 3)

4. Do NOT break existing notification functionality. This is additive only.

All notification messages in French.

PROMPT 8 — 🟡 Page Finances Admin

You are a financial dashboard engineer (Stripe Dashboard level).

TASK: Create a comprehensive finance management page for admins.

CONTEXT:
- No /admin/finance page exists (route placeholder from Prompt 1)
- Withdrawal page exists: frontend/src/pages/AdminWithdrawalsPage.jsx
- Pending payments page: frontend/src/pages/AdminPendingPaymentsPage.jsx
- Backend: backend/controllers/withdrawalController.js, paymentController.js
- Backend model: backend/models/withdrawalModel.js, orderModel.js (or bookingModel.js)

REQUIREMENTS:
1. Create `frontend/src/pages/AdminFinancePage.jsx`:
   
   Top: Period selector (same as dashboard — reuse component if possible)

   Row 1 — Financial KPIs (4 cards):
   - Revenu total (period)
   - Commissions gagnées (revenue × commission rate from settings)
   - Retraits traités (amount)
   - Retraits en attente (count + amount)

   Row 2 — Two columns:
   Left: Revenue chart (bar chart, daily or weekly depending on period)
   Right: Breakdown by payment method (Stripe/PayPal/CMI/Bank — pie chart)

   Row 3 — Recent transactions table:
   - Type (Réservation/Retrait/Remboursement), Montant, Méthode, Statut, Date, Opérateur
   - Filters: type, status, payment method, date range
   - Pagination

   Row 4 — Quick links:
   - "Gérer les retraits" → /admin/withdrawals
   - "Paiements en attente" → /admin/pending-payments
   - "Paramètres de commission" → /admin/settings (open Finances tab)

2. Backend — Add to adminController.js:
   - `getFinanceStats(req, res)`: revenue, commissions, withdrawals processed/pending by period
   - `getTransactions(req, res)`: paginated transaction list with filters

3. Add route: GET /api/admin/finance/stats, GET /api/admin/finance/transactions

4. Add route in App.jsx: /admin/finance → AdminFinancePage

All text in French. Amounts in all currencies.

PROMPT 9 — 🟡 Opérateur Sidebar + Navigation Propre

You are a frontend architect.

TASK: Create a proper operator sidebar and clean up operator navigation.

CONTEXT:
- OperatorDashboardPage.jsx has flat button groups (lines 81-100 and 156-199) — same problem as admin
- Operator routes: /operator/dashboard, /operator/products, /operator/bookings, /operator/inquiries, /operator/withdrawals, /operator/onboarding
- AdminSidebar from Prompt 1 should already handle operator routes with a different menu

REQUIREMENTS:
1. If AdminSidebar (Prompt 1) already differentiates admin vs operator menus, verify and fix:
   - Operator menu shows correct links
   - Badge counts on "Messages" and "Réservations" (use unread counts from APIs)

2. OperatorDashboardPage.jsx cleanup:
   - REMOVE the flat button groups (lines 81-100 and 156-199) — sidebar replaces them
   - Keep the stats cards and recent activity
   - Add link to "Créer un produit" button → /operator/products/new
   - Show pending bookings count if any

3. Create breadcrumbs component `frontend/src/components/Breadcrumbs.jsx`:
   - Props: items array of { label, href? }
   - Render: Home > Admin > Produits > Modifier
   - Last item not clickable (current page)
   - Use chevron separator
   - Show on ALL admin and operator pages
   - Integrate in the top bar (left of page title)

4. All text in French.

PROMPT 10 — 🟡 Guide Utilisateur + Documentation API
You are a technical writer.

TASK: Create comprehensive documentation for the platform.

REQUIREMENTS:
1. Create `docs/API-REFERENCE.md`:
   - List ALL API endpoints grouped by route file
   - For each: method, path, auth required, description, query params, request body, response format
   - Group: Auth, Users, Products, Bookings, Payments, Admin, Operator, Notifications, Chat, Blog, Reviews, etc.
   - Run `rg 'router\.(get|post|put|patch|delete)\(' backend/routes/*.js` to discover all endpoints

2. Create `docs/GUIDE-ADMIN.md`:
   - How to access the admin panel
   - Navigation structure explanation
   - How to approve/reject operators
   - How to manage products
   - How to process withdrawals
   - How to configure settings
   - How to handle support (chat, notifications)
   - Screenshots placeholders (describe what to screenshot)

3. Create `docs/GUIDE-OPERATOR.md`:
   - How to register as operator
   - How to create/edit products
   - How to manage bookings
   - How to configure payment (Stripe/PayPal/CMI)
   - How to handle reviews
   - How to withdraw earnings

4. Create `docs/GUIDE-TRAVELER.md`:
   - How to search and book
   - Payment methods
   - Cancellation policy
   - Favorites and reviews
   - Loyalty program

5. Create `docs/DATA-MODEL.md`:
   - List all Mongoose models with fields, types, and relationships
   - ERD description (text-based)
   - Key indexes

6. Clean up: Delete session-specific docs that are noise (COMPLETED_TODAY.md, FINAL_CORRECTIONS_SUMMARY.md, SESSION_PROMPT.md, etc.) — keep only reference documentation.

PROMPT 11 — 🟡 Reviews & Modération
You are a community engineer (Airbnb Reviews / Google Reviews level).

TASK: Build a complete review management system for operators and admins.

CONTEXT:
- Review model: backend/models/reviewModel.js
- Review controller: backend/controllers/reviewController.js
- Review routes: backend/routes/reviewRoutes.js
- ReviewsList component: frontend/src/components/ReviewsList.jsx

REQUIREMENTS:
1. Backend enhancements:
   - Add rating breakdown to review responses: average rating, count per star (5★, 4★, 3★, 2★, 1★)
   - Admin endpoint: GET /api/admin/reviews — paginated, filterable by rating, product, operator, status
   - Admin endpoint: PUT /api/admin/reviews/:id/status — approve or reject a review
   - Operator endpoint: POST /api/reviews/:id/reply — operator can reply to a review

2. Create `frontend/src/pages/AdminReviewsPage.jsx`:
   - Table: User, Produit, Note (stars), Commentaire (truncated), Date, Statut, Actions
   - Filter: rating (1-5 stars), status (pending/approved/rejected), search by product
   - Actions: Approuver, Refuser (with reason), Répondre (opens inline reply form)
   - Stats bar: Average rating, total reviews, pending moderation count

3. Add route in App.jsx: /admin/reviews → AdminReviewsPage
4. Add "⭐ Avis" link in AdminSidebar

5. On ProductDetailPage: show rating breakdown (bar chart: 5★ ████████ 45%, 4★ ████ 30%, etc.)
6. Operator reply shown under the review with "Réponse de l'opérateur" label

All text in French.

PROMPT 12 — 🟡 Recherche Globale Admin

You are a search engineer.

TASK: Add global search functionality to the admin area.

CONTEXT:
- No search exists in admin area
- Backend has basic search in some controllers (productController, searchController for public)

REQUIREMENTS:
1. Backend — Add to adminController.js:
   - GET /api/admin/search?q=term&type=all|users|products|bookings|operators
   - Search across: users (name, email), products (title, description), bookings (ID, user email), operators (businessName, email)
   - Return: { results: [{ type, id, title, subtitle, url }], total }
   - Limit: 10 results per type

2. Frontend — Add search in AdminSidebar top area or admin top bar:
   - Search input with magnifying glass icon
   - Debounced (300ms)
   - Dropdown results grouped by type:
     👤 Utilisateurs (3)
     📦 Produits (5)
     📋 Réservations (2)
   - Each result: title + subtitle, click → navigate to the relevant page
   - Keyboard: Escape to close, Enter to select first result
   - CMD+K shortcut to focus search (like the audit dashboard)

3. Style: Consistent with existing search components. Clean dropdown with hover states.

All text in French.

PROMPT 13 — 🟡 Pages Placeholder → Réelles

You are a content developer.

TASK: Replace all PlaceholderPage instances with real content pages.

CONTEXT:
- Several routes still use <PlaceholderPage /> in App.jsx
- Missing pages: /safety, /careers, /press, /operator/help, /operator/resources, /operator/community, /cookies, /accessibility

REQUIREMENTS:
1. /safety — Page Sécurité:
   - Travel safety tips for Morocco
   - Emergency numbers
   - Insurance information
   - Contact support section

2. /careers — Page Carrières:
   - Company mission
   - Open positions (2-3 sample: Développeur Full-Stack, Chef de Produit, Community Manager)
   - "Postuler" button → mailto link
   - Company culture section

3. /press — Page Presse:
   - Press kit download link
   - Logo download
   - Recent press mentions
   - Media contact

4. /cookies — Page Cookies:
   - Explain what cookies are used
   - Categories: essential, analytics, marketing
   - Cookie consent management (link to settings)

5. /accessibility — Page Accessibilité:
   - Accessibility statement
   - Supported features (keyboard nav, screen reader, contrast)
   - Contact for accessibility issues

6. /operator/help — Centre d'aide opérateur:
   - FAQ accordion
   - Link to documentation
   - Contact support

7. /operator/resources — Ressources opérateur:
   - Photography tips
   - Pricing strategy guide
   - How to write good descriptions

8. /operator/community — Communauté:
   - Forum link or coming soon
   - Social media links
   - Operator success stories

All pages must:
- Be wrapped in Layout (Header + Footer)
- Be in French (with i18n keys)
- Have proper meta tags
- Match existing page styles (use the design tokens from Prompt 10 of previous series)
- Have a hero section with title
- Be responsive

[x] PROMPT 14 — 🟡 Nettoyage FR/EN + Dead Code
You are a code quality engineer.

TASK: Clean up language mixing and dead code across the admin/operator area.

CONTEXT:
- Language mixing: DashboardNavBar.jsx mixes FR/EN, AdminDashboardPage mixes FR/EN, OperatorDashboardPage is fully EN
- Dead code: operatorsByStatus fetched but never rendered, attachment icons imported but unused, duplicate button groups

REQUIREMENTS:
1. Standardize ALL admin/operator text to FRENCH:
   - "Dashboard" → "Tableau de bord"
   - "Analytics" → "Statistiques"
   - "Create Product" → "Créer un produit"
   - "View Analytics" → "Voir les statistiques"
   - "My Products" → "Mes produits"
   - "My Bookings" → "Mes réservations"
   - etc.
   - Use existing i18n keys from locales/fr/translation.json where possible
   - For new text, add keys to all 4 locale files (fr, en, ar, es)

2. Remove dead code:
   - operatorsByStatus fetch in AdminDashboardPage (if not yet removed by Prompt 4)
   - Unused imports across all admin pages
   - Duplicate button groups (if not yet removed by Prompts 1/4/9)

3. Fix data inconsistencies:
   - Normalize operator status values in database (backend/controllers/adminController.js normalizeOperatorStatus)
   - Add a migration note or script if needed

4. Run lint and fix all warnings.

Do NOT change any logic. This is purely text cleanup and dead code removal.

[x] PROMPT 15 — 🟢 Mobile Admin Responsive
You are a mobile-first UI engineer.

TASK: Make the entire admin area fully responsive and mobile-friendly.

CONTEXT:
- AdminSidebar (Prompt 1) should already have mobile drawer mode
- But all admin PAGES need mobile optimization
- Tables are not responsive on mobile
- Forms overflow on small screens

REQUIREMENTS:
1. All admin tables → responsive:
   - On mobile (<768px): switch to card layout instead of table
   - Each row becomes a card: title, key info, status badge, action button
   - Or use horizontal scroll with sticky first column

2. All admin forms → responsive:
   - Single column on mobile, multi-column on desktop
   - Proper input sizing (min 44px touch targets)
   - File inputs full width on mobile

3. Filter bars → responsive:
   - Stack vertically on mobile
   - Collapsible "Filtres" section with toggle

4. Charts → responsive:
   - Hide on mobile or show simplified version
   - Or make scrollable horizontally

5. Modal dialogs → full-screen on mobile, centered on desktop

6. Test at 375px (iPhone), 768px (tablet), 1440px (desktop)

Pages to check: AdminBookingsPage, AdminUsersPage, AdminProductsPage, AdminOperatorsPage, AdminSettingsPage, AdminFinancePage, AdminChatInbox, AdminReviewsPage.



[x] PROMPT 16 — 🟢 Système de Filtres Avancés (Réutilisable)


You are a component library engineer.

TASK: Create a reusable advanced filter system for all admin tables.

CONTEXT:
- Each admin page needs filters (bookings, users, products, etc.)
- Currently no shared filter component — each page would build its own

REQUIREMENTS:
1. Create `frontend/src/components/AdvancedFilters.jsx`:
   - Props: filters config array, active filters, onChange callback
   - Filter types: search (text), select (dropdown), multi-select, date-range, toggle
   - Config-driven:
     ```
     filters={[
       { key: 'search', type: 'search', label: 'Rechercher', placeholder: 'Email ou nom...' },
       { key: 'status', type: 'multi-select', label: 'Statut', options: [{value:'confirmed',label:'Confirmé'},...] },
       { key: 'date', type: 'date-range', label: 'Période' },
       { key: 'active', type: 'toggle', label: 'Actifs uniquement' },
     ]}
     ```
   - "Active filters" chips with × to remove
   - "Réinitialiser" button to clear all
   - Collapsible on mobile
   - Persist active filters to URL query params (so refreshing keeps filters)

2. Create `frontend/src/components/DataTable.jsx`:
   - Reusable table component
   - Props: columns, data, loading, pagination, onSort, onRowClick, emptyState
   - Built-in sorting (click column header)
   - Built-in pagination (Previous/1/2/3/Next)
   - Built-in loading skeleton
   - Built-in empty state
   - Responsive: card mode on mobile

3. Refactor existing admin pages to use these components:
   - AdminBookingsPage: use DataTable + AdvancedFilters
   - AdminUsersPage: use DataTable + AdvancedFilters
   - AdminProductsPage: use DataTable + AdvancedFilters

This reduces code duplication significantly across all admin pages.

[x] PROMPT 17 — 🟢 Onboarding Utilisateur Amélioré

You are a UX onboarding engineer.

TASK: Improve the user and operator onboarding experience.

CONTEXT:
- Register page: frontend/src/pages/RegisterPage.jsx
- Operator onboarding: frontend/src/pages/OperatorOnboardingPage.jsx
- Login: frontend/src/pages/LoginPage.jsx

REQUIREMENTS:
1. Registration page enhancements:
   - Add "Type de compte" selector: Voyageur / Opérateur
   - If Opérateur selected: show additional fields (nom entreprise, type d'activité, ville)
   - Password strength indicator (weak/medium/strong with color)
   - Terms & conditions checkbox with link
   - Success → redirect to appropriate dashboard or onboarding

2. Login page enhancements:
   - "Mot de passe oublié?" flow (email input → send reset link)
   - "Se souvenir de moi" toggle
   - Social login placeholders (Google, Facebook — visual only for now)

3. Operator onboarding:
   - Step indicator (Étape 1/4, 2/4, etc.) at top
   - Progress bar
   - Each step has "Précédent" and "Suivant" buttons
   - Final step: success animation + "Accéder à mon tableau de bord" button

4. All text in French. All 4 languages for i18n.

[x] PROMPT 18 — 🟢 Modèles d'Email & Templates

You are a communications engineer (Mailchimp level).

TASK: Create professional email templates and an email preview system.

CONTEXT:
- Email service: backend/services/emailService.js (or backend/utils/emailService.js)
- Existing template: backend/templates/emails/confirmation.hbs
- Email sending uses Nodemailer with SMTP

REQUIREMENTS:
1. Create Handlebars templates for each email type:
   - `confirmation.hbs` — Booking confirmation (user)
   - `operator-booking.hbs` — New booking notification (operator)
   - `welcome.hbs` — Welcome email (new user)
   - `operator-approved.hbs` — Operator account approved
   - `operator-rejected.hbs` — Operator account rejected (with reason)
   - `review-notification.hbs` — New review on your product
   - `withdrawal-processed.hbs` — Withdrawal approved/paid
   - `password-reset.hbs` — Password reset link

2. Each template:
   - Professional HTML design (inline CSS for email compatibility)
   - Header with Overglow Trip logo (use public logo or gradient text)
   - Main content area with clear typography
   - CTA button (colored, centered)
   - Footer with: Unsubscribe link, social links, company address
   - Responsive (max-width 600px, stacked on mobile)
   - FR + EN versions (use locale parameter)

3. In Admin Settings (Finances tab or new "Emails" tab):
   - List of email templates with "Prévisualiser" button
   - Preview modal: render template HTML in iframe
   - "Envoyer un test" button → sends to admin email

All text in French (primary) with EN support.


[x] PROMPT 19 — 🟢 Audit Final Qualité + Performance
You are a quality assurance engineer.

TASK: Perform a comprehensive quality and performance audit of the entire platform.

CONTEXT:
- 24 security prompts were executed but 5 had build errors (fixed)
- Need to verify everything still works after all previous prompts

REQUIREMENTS:
1. Frontend audit:
   - Run ESLint on all files in frontend/src/ — fix all errors and warnings
   - Check for console.log left in production code
   - Verify all imports are used
   - Check for memory leaks (cleanup useEffect, remove event listeners)
   - Verify all images have alt text
   - Check all forms have proper validation

2. Backend audit:
   - Run ESLint on all files in backend/ and api/
   - Check all async handlers have try/catch
   - Verify all routes have auth middleware where needed
   - Check for N+1 queries
   - Verify rate limiting is applied to public endpoints

3. Performance:
   - Check bundle size (any unexpectedly large imports?)
   - Verify images are optimized (WebP, lazy loading)
   - Check for unnecessary re-renders (React DevTools profiler hints)
   - Verify API responses are paginated (no endpoint returns unbounded arrays)

4. Accessibility:
   - All interactive elements keyboard accessible
   - All form inputs have labels
   - Color contrast ratios meet WCAG AA
   - Focus management in modals/drawers

5. Generate a report: `docs/QUALITY-AUDIT-REPORT.md` with findings, severity, and recommendations.


📋 Ordre d'Exécution Résumé
#
Prompt                  Priorité     Dépend de                   
1	Sidebar Admin	        🔴	        Rien
2	RéservationsAdmin       🔴	        Rien
3	ClocheNotifications     🔴	        Rien
4	Dashboard Pro	        🟠	    1 (sidebar)
5	Settings Complètes      🟠   	1 (sidebar)
6	Chat Pro + Inbox        🟠   	1 (sidebar)
7	Notifications Temps Réel🟠	    3 (bell)
8	Page Finances	        🟡  	1, 4 (dashboard)
9	Opérateur Sidebar	    🟡  	1
10	Documentation	        🟡	    Rien
11	Reviews & Modération	🟡	    1
12	Recherche Globale	    🟡	    1
13	Pages Placeholder	    🟡	    Rien
14	Nettoyage FR/EN	        🟡	    Après 4-9
15	Mobile Responsive	    🟢	    Après 1-8
16	Filtres Réutilisables	🟢	    2
17	Onboarding Amélioré	    🟢	    Rien
18	Templates Email	        🟢	    5 (settings)
19	Audit Qualité	        🟢	    Tout

---

## Série Internationale (STRATEGIC-PLAN §7)

Ordre : INT-02 (livré partiel) → INT-01 → INT-03…

[x] INT-01 — 🔴 i18n Routing préfixe langue `/fr|/en|/es|/ar`
- Routes publiques sous `/:lang` (LanguageRoot + Layout)
- Admin / operator / auth / checkout / dashboard sans préfixe
- Redirect legacy `/explore` → `/{lang}/explore`
- LanguageSelector swap URL ; LocalizedLink ; sitemap `/fr/...`

[x] INT-02 — 🟢 SEOHead + hreflang + meta multi-langue
- `frontend/src/utils/seo.js` — canonical, hreflang (?lang= → /{lang}/), OG
- `frontend/src/components/SEOHead.jsx`
- Branché : Home, Search/stores, Product, Blog, Destination, Category
- i18n : détection path index 0
- Sitemap : + /explore, /stays, /extras + préfixe langue

[x] INT-03 — 🟡 Contenu éditorial SEO par marché (Wave 1 — blog language + seed)
Voir STRATEGIC-PLAN.md § PROMPT INT-03.
