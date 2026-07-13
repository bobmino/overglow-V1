# Overglow Trip — Référence API

> Généré le 2026-07-13 à partir de `backend/routes/*.js`.
> Base URL prod : `https://overglow-backend.vercel.app` (ou `VITE_API_URL`).
> Auth : header `Authorization: Bearer <accessToken>` sauf endpoints publics / webhooks.

## Conventions

| Élément | Détail |
|--------|--------|
| Format | JSON (`Content-Type: application/json`) |
| Erreurs | `{ message }` ou `{ success: false, error, statusCode }` |
| Pagination | Souvent `page`, `limit` en query ; réponse `pagination` ou `total`/`page`/`totalPages` |
| Devise | Montants souvent en MAD (paramètres plateforme) |


## Admin

- **Fichier** : `backend/routes/adminRoutes.js`
- **Préfixe** : `/api/admin`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `GET` | `/api/admin/stats` | Private / Admin | Lecture / listing |
| `GET` | `/api/admin/finance/stats` | Private / Admin | KPIs financiers admin (période) |
| `GET` | `/api/admin/finance/transactions` | Private / Admin | Ledger transactions paginé + filtres |
| `GET` | `/api/admin/analytics` | Private / Admin | Lecture / listing |
| `GET` | `/api/admin/operators` | Private / Admin | Lecture / listing |
| `PUT` | `/api/admin/operators/:id/status` | Private / Admin | Mise à jour |
| `GET` | `/api/admin/products` | Private / Admin | Lecture / listing |
| `PUT` | `/api/admin/products/:id/status` | Private / Admin | Mise à jour |
| `POST` | `/api/admin/products/:id/assign` | Private / Admin | Création / action |
| `GET` | `/api/admin/users` | Private / Admin | Lecture / listing |
| `DELETE` | `/api/admin/users/:id` | Private / Admin | Suppression de la ressource |
| `POST` | `/api/admin/initialize-badges` | Private / Admin | Création / action |
| `POST` | `/api/admin/badges` | Private / Admin | Création / action |
| `GET` | `/api/admin/badges` | Private / Admin | Lecture / listing |
| `GET` | `/api/admin/badges/requestable` | Private / Admin | Lecture / listing |
| `POST` | `/api/admin/badges/assign-products` | Private / Admin | Création / action |
| `POST` | `/api/admin/badges/assign-operators` | Private / Admin | Création / action |
| `PUT` | `/api/admin/badges/:id` | Private / Admin | Mise à jour |
| `DELETE` | `/api/admin/badges/:id` | Private / Admin | Suppression de la ressource |
| `GET` | `/api/admin/badges/:id/products` | Private / Admin | Lecture / listing |
| `GET` | `/api/admin/badges/:id/operators` | Private / Admin | Lecture / listing |
| `GET` | `/api/admin/bookings` | Private / Admin | Lecture / listing |
| `GET` | `/api/admin/bookings/pending-payments` | Private / Admin | Lecture / listing |
| `PUT` | `/api/admin/bookings/:id/confirm-payment` | Private / Admin | Mise à jour |
| `PUT` | `/api/admin/bookings/:id/reject-payment` | Private / Admin | Mise à jour |
| `PUT` | `/api/admin/bookings/:id/cancel` | Private / Admin | Mise à jour |

## Approval Requests

- **Fichier** : `backend/routes/approvalRequestRoutes.js`
- **Préfixe** : `/api/approval-requests`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `POST` | `/api/approval-requests/` | Public | Création / action |
| `GET` | `/api/approval-requests/my-requests` | Public | Lecture / listing |
| `GET` | `/api/approval-requests/` | Private / Admin | Lecture / listing |
| `PUT` | `/api/approval-requests/:id/approve` | Private / Admin | Mise à jour |
| `PUT` | `/api/approval-requests/:id/reject` | Private / Admin | Mise à jour |

## Auth

- **Fichier** : `backend/routes/authRoutes.js`
- **Préfixe** : `/api/auth`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `POST` | `/api/auth/register` | Public | Authentification |
| `POST` | `/api/auth/login` | Public | Authentification |
| `GET` | `/api/auth/me` | Private (JWT) | Utilisateur courant |
| `PUT` | `/api/auth/profile` | Private (JWT) | Mise à jour |
| `POST` | `/api/auth/refresh` | Public | Création / action |
| `POST` | `/api/auth/logout` | Private (JWT) | Création / action |
| `POST` | `/api/auth/upgrade-to-operator` | Private (JWT) | Création / action |
| `POST` | `/api/auth/partner-signup` | Public | Création / action |

## Badge Requests

- **Fichier** : `backend/routes/badgeRequestRoutes.js`
- **Préfixe** : `/api/badge-requests`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `POST` | `/api/badge-requests/` | Private / Opérateur | Création / action |
| `GET` | `/api/badge-requests/my-requests` | Private / Opérateur | Lecture / listing |
| `GET` | `/api/badge-requests/pending` | Private / Admin | Lecture / listing |
| `PUT` | `/api/badge-requests/:id/approve` | Private / Admin | Mise à jour |
| `PUT` | `/api/badge-requests/:id/reject` | Private / Admin | Mise à jour |

## Badges

- **Fichier** : `backend/routes/badgeRoutes.js`
- **Préfixe** : `/api/badges`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `GET` | `/api/badges/` | Public | Lecture / listing |
| `GET` | `/api/badges/requestable` | Public | Lecture / listing |
| `GET` | `/api/badges/operator/:operatorId` | Public | Lecture / listing |
| `GET` | `/api/badges/product/:productId` | Public | Lecture / listing |
| `POST` | `/api/badges/update-operator/:operatorId` | Private (JWT) | Création / action |
| `POST` | `/api/badges/update-product/:productId` | Private (JWT) | Création / action |
| `POST` | `/api/badges/initialize` | Private / Admin | Création / action |

## Blog

- **Fichier** : `backend/routes/blogRoutes.js`
- **Préfixe** : `/api/blog`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `GET` | `/api/blog/categories` | Public | Lecture / listing |
| `GET` | `/api/blog/tags` | Public | Lecture / listing |
| `GET` | `/api/blog/` | Public | Lecture / listing |
| `GET` | `/api/blog/admin/all` | Private / Admin | Lecture / listing |
| `POST` | `/api/blog/admin/initialize` | Private / Admin | Création / action |
| `POST` | `/api/blog/` | Private / Admin | Création / action |
| `PUT` | `/api/blog/:id` | Private / Admin | Mise à jour |
| `DELETE` | `/api/blog/:id` | Private / Admin | Suppression de la ressource |
| `GET` | `/api/blog/:slug` | Public | Lecture / listing |

## Bookings

- **Fichier** : `backend/routes/bookingRoutes.js`
- **Préfixe** : `/api/bookings`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `POST` | `/api/bookings/create-payment-intent` | Private (JWT) | Création / action |
| `POST` | `/api/bookings/bulk-manual-checkout` | Private (JWT) | Création / action |
| `POST` | `/api/bookings/` | Private (JWT) | Création / action |
| `GET` | `/api/bookings/my-bookings` | Private (JWT) | Lecture / listing |
| `GET` | `/api/bookings/:id/refund-calculation` | Private (JWT) | Lecture / listing |
| `POST` | `/api/bookings/:id/cancel` | Private (JWT) | Création / action |
| `POST` | `/api/bookings/:id/process-refund` | Private / Admin | Création / action |
| `PUT` | `/api/bookings/:id/note` | Private / Opérateur | Mise à jour |
| `PUT` | `/api/bookings/:id/handle` | Private / Opérateur | Mise à jour |
| `PUT` | `/api/bookings/:id/status` | Private / Admin | Mise à jour |

## Chat

- **Fichier** : `backend/routes/chatRoutes.js`
- **Préfixe** : `/api/chat`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `GET` | `/api/chat/conversations` | Public | Lecture / listing |
| `GET` | `/api/chat/unread-count` | Public | Compteur non lus (léger) |
| `GET` | `/api/chat/` | Public | Lecture / listing |
| `GET` | `/api/chat/support` | Public | Lecture / listing |
| `GET` | `/api/chat/inquiry/:inquiryId` | Public | Lecture / listing |
| `GET` | `/api/chat/:id/typing` | Public | Lecture / listing |
| `POST` | `/api/chat/:id/typing` | Public | Création / action |
| `GET` | `/api/chat/:id` | Public | Lecture / listing |
| `POST` | `/api/chat/:id/messages` | Public | Création / action |
| `PUT` | `/api/chat/:id/read` | Public | Marquer comme lu |

## Content

- **Fichier** : `backend/routes/contentRoutes.js`
- **Préfixe** : `/api/content`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `GET` | `/api/content/langs` | Public | Lecture / listing |
| `GET` | `/api/content/about` | Public | Lecture / listing |
| `GET` | `/api/content/culture` | Public | Lecture / listing |

## FAQ

- **Fichier** : `backend/routes/faqRoutes.js`
- **Préfixe** : `/api/faq`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `GET` | `/api/faq/` | Public | Lecture / listing |
| `GET` | `/api/faq/categories` | Public | Lecture / listing |
| `GET` | `/api/faq/:id` | Public | Lecture / listing |
| `POST` | `/api/faq/:id/feedback` | Public | Création / action |
| `POST` | `/api/faq/` | Private / Admin | Création / action |
| `PUT` | `/api/faq/:id` | Private / Admin | Mise à jour |
| `DELETE` | `/api/faq/:id` | Private / Admin | Suppression de la ressource |

## Favorites

- **Fichier** : `backend/routes/favoriteRoutes.js`
- **Préfixe** : `/api/favorites`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `GET` | `/api/favorites/shared/:token` | Public | Lecture / listing |
| `GET` | `/api/favorites/price-alerts` | Private (JWT) | Lecture / listing |
| `POST` | `/api/favorites/lists/:listName/share` | Private (JWT) | Création / action |
| `GET` | `/api/favorites/` | Private (JWT) | Lecture / listing |
| `GET` | `/api/favorites/lists` | Private (JWT) | Lecture / listing |
| `GET` | `/api/favorites/check/:productId` | Public (optional auth) | Lecture / listing |
| `POST` | `/api/favorites/` | Private (JWT) | Création / action |
| `PUT` | `/api/favorites/:id` | Private (JWT) | Mise à jour |
| `DELETE` | `/api/favorites/:id` | Private (JWT) | Suppression de la ressource |

## Health

- **Fichier** : `backend/routes/healthRoutes.js`
- **Préfixe** : `/api/health`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `GET` | `/api/health/` | Public | Santé service / dépendances |
| `GET` | `/api/health/detailed` | Public | Santé service / dépendances |

## Homepage

- **Fichier** : `backend/routes/homepageRoutes.js`
- **Préfixe** : `/api/homepage`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `GET` | `/api/homepage/layout` | Public | Lecture / listing |

## Inquiries

- **Fichier** : `backend/routes/inquiryRoutes.js`
- **Préfixe** : `/api/inquiries`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `POST` | `/api/inquiries/` | Private (JWT) | Création / action |
| `GET` | `/api/inquiries/my-inquiries` | Private (JWT) | Lecture / listing |
| `GET` | `/api/inquiries/operator` | Private / Opérateur | Lecture / listing |
| `PUT` | `/api/inquiries/:id/answer` | Private / Opérateur | Mise à jour |
| `PUT` | `/api/inquiries/:id/approve` | Private / Opérateur | Mise à jour |
| `PUT` | `/api/inquiries/:id/reject` | Private / Opérateur | Mise à jour |

## Loyalty

- **Fichier** : `backend/routes/loyaltyRoutes.js`
- **Préfixe** : `/api/loyalty`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `GET` | `/api/loyalty/status` | Private (JWT) | Lecture / listing |
| `GET` | `/api/loyalty/history` | Private (JWT) | Lecture / listing |
| `POST` | `/api/loyalty/redeem` | Private (JWT) | Création / action |

## Notifications

- **Fichier** : `backend/routes/notificationRoutes.js`
- **Préfixe** : `/api/notifications`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `GET` | `/api/notifications/` | Public | Lecture / listing |
| `GET` | `/api/notifications/unread-count` | Public | Compteur non lus (léger) |
| `PUT` | `/api/notifications/mark-all-read` | Public | Marquer comme lu |
| `POST` | `/api/notifications/mark-all-read` | Public | Marquer comme lu |
| `PUT` | `/api/notifications/:id/read` | Public | Marquer comme lu |
| `DELETE` | `/api/notifications/:id` | Public | Suppression de la ressource |

## Operator

- **Fichier** : `backend/routes/operatorRoutes.js`
- **Préfixe** : `/api/operator`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `GET` | `/api/operator/bookings` | Private / Opérateur | Lecture / listing |
| `GET` | `/api/operator/analytics` | Private / Opérateur | Lecture / listing |
| `GET` | `/api/operator/dashboard-stats` | Private / Opérateur | Lecture / listing |

## Operator Onboarding

- **Fichier** : `backend/routes/onboardingRoutes.js`
- **Préfixe** : `/api/operator/onboarding`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `GET` | `/api/operator/onboarding/` | Public | Lecture / listing |
| `PUT` | `/api/operator/onboarding/provider-type` | Public | Mise à jour |
| `PUT` | `/api/operator/onboarding/public-info` | Public | Mise à jour |
| `PUT` | `/api/operator/onboarding/photos` | Public | Mise à jour |
| `PUT` | `/api/operator/onboarding/address` | Public | Mise à jour |
| `PUT` | `/api/operator/onboarding/experiences` | Public | Mise à jour |
| `PUT` | `/api/operator/onboarding/private-info` | Public | Mise à jour |
| `POST` | `/api/operator/onboarding/submit` | Public | Création / action |

## Operator Wizard

- **Fichier** : `backend/routes/operatorWizardRoutes.js`
- **Préfixe** : `/api/operator/wizard`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `GET` | `/api/operator/wizard/status` | Public | Lecture / listing |
| `GET` | `/api/operator/wizard/data` | Public | Lecture / listing |
| `PUT` | `/api/operator/wizard/provider-type` | Public | Mise à jour |
| `PUT` | `/api/operator/wizard/public-info` | Public | Mise à jour |
| `PUT` | `/api/operator/wizard/photos` | Public | Mise à jour |
| `PUT` | `/api/operator/wizard/address` | Public | Mise à jour |
| `PUT` | `/api/operator/wizard/experiences` | Public | Mise à jour |
| `PUT` | `/api/operator/wizard/private-info` | Public | Mise à jour |
| `POST` | `/api/operator/wizard/submit` | Public | Création / action |

## Orders

- **Fichier** : `backend/routes/orderRoutes.js`
- **Préfixe** : `/api/orders`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `POST` | `/api/orders/checkout` | Public (optional auth) | Création / action |
| `GET` | `/api/orders/my-orders` | Private (JWT) | Lecture / listing |

## Payments

- **Fichier** : `backend/routes/paymentRoutes.js`
- **Préfixe** : `/api/payments`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `GET` | `/api/payments/convert-to-mad` | Public | Lecture / listing |
| `POST` | `/api/payments/webhook/stripe` | Public | Webhook PSP / import (signature ou clé API) |
| `POST` | `/api/payments/webhook/paypal` | Public | Webhook PSP / import (signature ou clé API) |
| `POST` | `/api/payments/create-stripe-intent` | Private (JWT) | Création / action |
| `POST` | `/api/payments/create-paypal-order` | Private (JWT) | Création / action |
| `POST` | `/api/payments/capture-paypal-order` | Private (JWT) | Création / action |
| `POST` | `/api/payments/cmi-init` | Private (JWT) | Création / action |
| `POST` | `/api/payments/cash-pickup` | Private (JWT) | Création / action |
| `POST` | `/api/payments/cash-delivery` | Private (JWT) | Création / action |
| `POST` | `/api/payments/bank-transfer` | Private (JWT) | Création / action |
| `GET` | `/api/payments/bank-details` | Private (JWT) | Lecture / listing |

## Products

- **Fichier** : `backend/routes/productRoutes.js`
- **Préfixe** : `/api/products`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `GET` | `/api/products/my-products` | Private / Opérateur | Lecture / listing |
| `POST` | `/api/products/webhook/import` | Private / Admin | Webhook PSP / import (signature ou clé API) |
| `POST` | `/api/products/webhook/clear-cache` | Public | Webhook PSP / import (signature ou clé API) |
| `GET` | `/api/products/test-sync-notification` | Private / Admin | Lecture / listing |
| `GET` | `/api/products/` | Public | Lecture / listing |
| `POST` | `/api/products/` | Private / Opérateur | Création / action |
| `GET` | `/api/products/:id` | Public | Lecture / listing |
| `PUT` | `/api/products/:id` | Private / Opérateur | Mise à jour |
| `DELETE` | `/api/products/:id` | Private / Opérateur | Suppression de la ressource |
| `POST` | `/api/products/:productId/schedules` | Private / Opérateur | Création / action |
| `GET` | `/api/products/:productId/schedules` | Public | Lecture / listing |
| `POST` | `/api/products/:productId/reviews` | Private (JWT) | Création / action |
| `GET` | `/api/products/:productId/reviews` | Public | Lecture / listing |

## Recommendations

- **Fichier** : `backend/routes/recommendationRoutes.js`
- **Préfixe** : `/api/recommendations`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `GET` | `/api/recommendations/` | Private (JWT) | Lecture / listing |
| `GET` | `/api/recommendations/similar/:productId` | Public | Lecture / listing |
| `GET` | `/api/recommendations/trending` | Public | Lecture / listing |
| `GET` | `/api/recommendations/new-user` | Public | Lecture / listing |

## Reviews

- **Fichier** : `backend/routes/reviewRoutes.js`
- **Préfixe** : `/api/reviews`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `PUT` | `/api/reviews/:id/approve` | Private / Admin | Mise à jour |
| `PUT` | `/api/reviews/:id/reject` | Private / Admin | Mise à jour |
| `POST` | `/api/reviews/:id/vote` | Private (JWT) | Création / action |
| `POST` | `/api/reviews/:id/response` | Private / Opérateur | Création / action |
| `POST` | `/api/reviews/:id/report` | Private (JWT) | Création / action |

## Schedules

- **Fichier** : `backend/routes/scheduleRoutes.js`
- **Préfixe** : `/api/schedules`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `PUT` | `/api/schedules/:id` | Private / Opérateur | Mise à jour |
| `DELETE` | `/api/schedules/:id` | Private / Opérateur | Suppression de la ressource |

## Search

- **Fichier** : `backend/routes/searchRoutes.js`
- **Préfixe** : `/api/search`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `GET` | `/api/search/autocomplete` | Public | Lecture / listing |
| `GET` | `/api/search/suggestions` | Public | Lecture / listing |
| `GET` | `/api/search/categories` | Public | Lecture / listing |
| `GET` | `/api/search/destinations` | Public | Lecture / listing |
| `GET` | `/api/search/facets` | Public | Lecture / listing |
| `GET` | `/api/search/advanced` | Public | Lecture / listing |

## Settings

- **Fichier** : `backend/routes/settingsRoutes.js`
- **Préfixe** : `/api/settings`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `GET` | `/api/settings/` | Private / Admin | Lecture / listing |
| `GET` | `/api/settings/:key` | Public | Lecture / listing |
| `PUT` | `/api/settings/:key` | Private / Admin | Mise à jour |

## Sitemap / SEO

- **Fichier** : `backend/routes/sitemapRoutes.js`
- **Préfixe** : `(root)`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `GET` | `/sitemap.xml` | Public | Lecture / listing |
| `GET` | `/robots.txt` | Public | Lecture / listing |

## Upload

- **Fichier** : `backend/routes/uploadRoutes.js`
- **Préfixe** : `/api/upload`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `POST` | `/api/upload/` | Private / Opérateur | Création / action |
| `POST` | `/api/upload/chat` | Private (JWT) | Création / action |
| `POST` | `/api/upload/images` | Private / Opérateur | Création / action |
| `POST` | `/api/upload/csv` | Private / Admin | Création / action |
| `POST` | `/api/upload/document` | Private / Admin | Création / action |

## View History

- **Fichier** : `backend/routes/viewHistoryRoutes.js`
- **Préfixe** : `/api/view-history`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `POST` | `/api/view-history/` | Public | Création / action |
| `GET` | `/api/view-history/` | Public | Lecture / listing |
| `DELETE` | `/api/view-history/` | Public | Suppression de la ressource |

## Withdrawals

- **Fichier** : `backend/routes/withdrawalRoutes.js`
- **Préfixe** : `/api/withdrawals`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `GET` | `/api/withdrawals/balance` | Private / Opérateur | Lecture / listing |
| `GET` | `/api/withdrawals/my-withdrawals` | Public | Lecture / listing |
| `GET` | `/api/withdrawals/` | Private / Admin | Lecture / listing |
| `POST` | `/api/withdrawals/` | Public | Création / action |
| `PUT` | `/api/withdrawals/:id/approve` | Private / Admin | Mise à jour |
| `PUT` | `/api/withdrawals/:id/reject` | Private / Admin | Mise à jour |
| `PUT` | `/api/withdrawals/:id/process` | Private / Admin | Mise à jour |

---

**Total endpoints documentés :** 200
