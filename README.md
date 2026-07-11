# Overglow Trip V1

Marketplace de réservation d’expériences touristiques authentiques au Maroc (voyageurs, opérateurs, admin).

## Stack

| Couche | Techno |
|--------|--------|
| Frontend | React 19 + Vite 7 + Tailwind + React Router 7 |
| Backend | Express (ESM) + Mongoose / MongoDB Atlas |
| Paiements | Stripe PaymentIntents, PayPal, virement / espèces (validation admin) |
| Hosting | Vercel (SPA + API serverless) |

## Démarrage local

```bash
# Backend (racine)
cp .env.example .env
# renseigner MONGO_URI, JWT_SECRET, etc.
npm install
npm run dev

# Frontend
cd frontend
cp .env.example .env
npm install
npm run dev
```

- API : http://127.0.0.1:5001  
- App : http://127.0.0.1:5173  

Créer un admin : `npm run create-admin` (variables `ADMIN_*`).

## Paiements & webhooks

| Endpoint | Rôle |
|----------|------|
| `POST /api/payments/create-stripe-intent` | Créer un PaymentIntent |
| `POST /api/payments/webhook/stripe` | Confirme booking (`Confirmed` + `paymentStatus: paid`) |
| `POST /api/payments/create-paypal-order` | Créer commande PayPal |
| `POST /api/payments/capture-paypal-order` | Capture client-side |
| `POST /api/payments/webhook/paypal` | Confirmation webhook PayPal |
| `POST /api/payments/bank-transfer` | Offline → `PENDING_PAYMENT` |
| `PUT /api/admin/bookings/:id/confirm-payment` | Validation admin offline |

Variables : voir [`.env.example`](.env.example) et [`docs/OPS_MEDIA_EMAIL_SENTRY.md`](docs/OPS_MEDIA_EMAIL_SENTRY.md).

Stripe CLI (dev) :
```bash
stripe listen --forward-to localhost:5001/api/payments/webhook/stripe
```

## Tests E2E

```bash
cd frontend
npm run cypress:run -- --spec cypress/e2e/critical-flow.cy.js
```

Voir [`docs/E2E_CRITICAL_FLOW.md`](docs/E2E_CRITICAL_FLOW.md).

## Documentation

- Index : [`docs/README.md`](docs/README.md)
- Checklist go-live : [`docs/GO_LIVE_CHECKLIST.md`](docs/GO_LIVE_CHECKLIST.md)
- Roadmap : [`docs/ROADMAP_STATUS.md`](docs/ROADMAP_STATUS.md)

## Licence

Propriétaire — Overglow / Overcom.
