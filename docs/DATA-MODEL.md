# Modèle de données — Overglow Trip

Schémas Mongoose (`backend/models`), relations et index clés.

## ERD textuel (cœur métier)

```
User 1──1 Operator 1──* Product 1──* Schedule 1──* Booking *──1 User
                │            │
                │            └──* Review *──1 User
                │
                ├──* Withdrawal
                ├──* Inquiry *──1 Product *──1 User
                ├──1 OperatorOnboarding
                └──* BadgeRequest *──1 Badge *──1 Product

User 1──* Notification
User *──* Chat (participants) 1──* Message
User 1──* Favorite *──1 Product
User 1──* Order
Settings (clé/valeur plateforme)
BlogPost *──? Product (lié)
FAQ, CategoryGroup, ViewHistory, ApprovalRequest
```

---

## Modèles

### User
- Champs typiques : `name`, `email`, `password`, `role` (User / Opérateur / Admin), `isApproved`, tokens refresh, préférences langue.
- Relie : Operator (si partenaire), Bookings, Reviews, Favorites, Notifications, Chats.

### Operator
- `user` → User (unique), `companyName`, `publicName`, `status` (Pending | Under Review | Active | Suspended | Rejected), métriques, badges.
- Index : `user` unique ; filtres status.

### Product
- `operator` → Operator, `title`, `description`, `category`, `city`, `address`, `duration`, `price`, `images[]`, `status` (Draft | Pending Review | Published), badges, GPS, i18n.
- Index : status, city/category pour search.

### Schedule
- `product` → Product, `date`, `time`, `price`, capacité / places restantes.
- Relie Bookings.

### Booking
- `user`, `schedule`, `operator`, `numberOfTickets`, `totalAmount` / `totalPrice`
- `status` : Pending | PENDING_PAYMENT | Confirmed | Cancelled
- `paymentStatus` : pending | paid | refunded | failed
- `paymentMethod` : stripe | paypal | cmi | cash_pickup | cash_delivery | bank_transfer
- `paymentIntentId`, `paidAt`, `payoutStatus`, notes opérateur, annulation
- **Index** : `{ status, user }`, `{ status, operator }`, `{ status, paymentStatus }`, `{ user, createdAt }`, `{ operator, createdAt }`, `paymentIntentId`

### Review
- `product`, `user`, `rating` (1–5), `comment`, `status` (Pending | Approved | Rejected), `isVerified`, photos, `operatorResponse`
- Une review / user / product (contrainte applicative)

### Withdrawal
- `user`, `operator?`, `type` (operator_payout | client_refund | refund)
- `amount`, `currency`, `status` (Pending | Approved | Rejected | Processed)
- `paymentMethod`, `paymentDetails`, `rejectionReason`, `relatedBookings[]`
- **Index** : `{ user, createdAt }`, `{ operator, status }`, `{ status, createdAt }`

### Notification
- `user`, `type` (booking_*, product_*, withdrawal_*, new_review, low_rating, …)
- `title`, `message`, `relatedEntity { type, id }`, `isRead`, `readAt`
- **Index** : `{ user, isRead, createdAt }`, `{ user, createdAt }`

### Inquiry
- `product`, `user`, `operator`, `type` (manual | automatic)
- `question` / `answer`, `status` (pending | approved | rejected), `booking?`
- **Index** : user/operator + status + createdAt

### Chat / Message
- Chat : `participants[]` → User, `type` (support | inquiry | …), `unreadCount` (Map userId→n), `lastMessage`
- Message : `chat`, `sender`, `content`, pièces jointes, `readBy[]`

### Badge / BadgeRequest
- Badge : règles métriques (`minRating`, `minBookings`, flags authenticité), `type`
- BadgeRequest : operator, product, badge, preuves, status workflow admin
- Index unique `{ product, badge }`

### OperatorOnboarding
- `operator`, `user`, étapes (provider type, public info, photos, address, experiences, private docs), `onboardingStatus`
- Index : user, onboardingStatus

### ApprovalRequest
- `user`, `entityType`, `entityId`, status pending/approved/rejected
- Unique `{ user, entityType, entityId }`

### Favorite
- `user`, `product`, `listName`, notes, price alert fields
- Index user/product

### Order
- Checkout agrégé (guest possible) ; lignes liées produits/bookings selon implémentation controller

### Settings
- `key` unique, `value` Mixed, `description`
- Ex. `platformCommissionPercent`, flags paiements, autoApprove*

### Blog / FAQ / CategoryGroup / ViewHistory
- Contenu éditorial, FAQ feedback, groupes catégories homepage, historique vues produit (user ou session)

---

## Index stratégiques (perf)

| Domaine | Index | Usage |
|---------|-------|--------|
| Bookings | status + operator/user/payment | dashboards, admin finance |
| Notifications | user + isRead + createdAt | cloche / polling |
| Withdrawals | status + createdAt | file admin |
| Products | status + city/category | search/catalogue |
| Blog | text index title/content/tags | recherche articles |
| Inquiries | operator + status | inbox opérateur |

---

## Notes d’intégrité

- Soft règles métier : review seulement si booking Confirmed ; retrait ≤ solde calculé.
- Webhooks paiement : idempotence via `lastWebhookEventId` / `paymentIntentId`.
- Devise affichage : MAD par défaut côté settings ; withdrawals peuvent porter `currency`.

Voir aussi [`API-REFERENCE.md`](./API-REFERENCE.md) pour les endpoints qui manipulent ces collections.
