# Guide Administrateur — Overglow Trip

Guide opérationnel pour gérer la plateforme depuis le panneau admin.

## Accès

1. Ouvrir le site (ex. `https://www.overglowtrip.com`).
2. Se connecter avec un compte **rôle Admin**.
3. Accéder à `/admin/dashboard` (redirection automatique selon le rôle).

> **Screenshot :** page de login + premier écran du tableau de bord admin (sidebar + KPIs).

---

## Navigation (sidebar)

La sidebar persistante (PROMPT 1 / 9) regroupe :

| Section | Liens |
|---------|--------|
| Vue d’ensemble | Tableau de bord, Analytics |
| Catalogue | Utilisateurs, Opérateurs, Produits, Réservations |
| Finance | Paiements en attente, Retraits, Finances |
| Contenu & demandes | Blog, Messages (chat), Badges, Demandes opérateurs / badges |
| Système | Paramètres |

- Desktop : sidebar fixe, repliable (icônes seules).
- Mobile : tiroir + barre haute (fil d’Ariane + cloche notifications).

> **Screenshot :** sidebar déployée et mode collapsed ; fil d’Ariane sur une sous-page.

---

## Approuver / refuser des opérateurs

1. Menu **Demandes opérateurs** → `/admin/approval-requests`  
   ou **Opérateurs** → `/admin/operators`.
2. Examiner le dossier (onboarding, documents, statut).
3. Actions typiques :
   - **Approuver** → statut Active / Under Review → Active ; email + notification.
   - **Refuser** → statut Rejected + motif (recommandé).
4. Les notifications in-app informent l’opérateur.

> **Screenshot :** liste opérateurs filtrée « Pending / Under Review » + modal de rejet avec motif.

---

## Gérer les produits

1. `/admin/products` — filtres Draft / Pending Review / Published.
2. **Approuver** (Pending Review → Published) : le produit devient public.
3. **Refuser** (Pending Review → Draft) : l’opérateur est notifié (`product_rejected`).
4. **Assigner** un produit à un opérateur (clone optionnel).

API : `PUT /api/admin/products/:id/status` (`status`, optionnel `reason`).

> **Screenshot :** carte produit en Pending Review avec boutons Approuver / Refuser.

---

## Traiter les retraits

1. `/admin/withdrawals` — demandes `operator_payout` / remboursements.
2. Vérifier le solde et les coordonnées de paiement.
3. Enchaînement :
   - **Approuver** → `PUT /api/withdrawals/:id/approve`
   - **Refuser** (+ motif) → `PUT /api/withdrawals/:id/reject`
   - **Marquer traité** après virement → `PUT /api/withdrawals/:id/process`
4. Vue consolidée : `/admin/finance` (KPIs, graphiques, ledger).

> **Screenshot :** liste retraits + page Finances (période 30j).

---

## Paiements en attente

- `/admin/pending-payments` : réservations `PENDING_PAYMENT` (virement, cash, etc.).
- **Confirmer** ou **Rejeter** le paiement manuellement.
- API : `PUT /api/admin/bookings/:id/confirm-payment` / `reject-payment`.

> **Screenshot :** tableau paiements en attente avec actions.

---

## Paramètres plateforme

`/admin/settings` — onglets :

- **Général** : langues, maintenance, auto-approbation produits/avis
- **Finances** : `platformCommissionPercent`, seuils de retrait
- **Paiements** : activation Stripe / PayPal / CMI / modes test
- **Notifications** : options e-mail / in-app

Sauvegarde **instantanée** par clé (`PUT /api/settings/:key`).  
Lien direct commission : `/admin/settings?tab=finance`.

> **Screenshot :** onglet Finances avec commission %.

---

## Support : chat & notifications

### Chat admin
- `/admin/chat` — inbox conversations support / opérateurs.
- Compteur non lus via `GET /api/chat/unread-count` (badge sidebar).

### Notifications
- Cloche header : aperçu + polling 30s (`GET /api/notifications/unread-count`).
- Page `/notifications` : historique complet.
- Tout marquer lu : `POST /api/notifications/mark-all-read`.

> **Screenshot :** cloche ouverte + inbox chat admin.

---

## Réservations

- `/admin/bookings` : filtres statut, opérateur, dates ; annulation admin.
- Badge sidebar = réservations Pending / PENDING_PAYMENT.

---

## Checklist quotidienne recommandée

1. Actions en attente (dashboard).
2. Produits Pending Review.
3. Paiements en attente.
4. Retraits Pending.
5. Messages chat non lus.
6. Avis / demandes badges si volume élevé.

---

## Liens utiles

- API : [`API-REFERENCE.md`](./API-REFERENCE.md)
- Modèle de données : [`DATA-MODEL.md`](./DATA-MODEL.md)
- Ops (Cloudinary, Sentry, e-mail) : [`OPS_MEDIA_EMAIL_SENTRY.md`](./OPS_MEDIA_EMAIL_SENTRY.md)
