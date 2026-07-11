# E2E Critical Flow — notes d'exécution

## Prérequis
1. Backend : `npm run dev` (port 5001) avec `MONGO_URI` + `JWT_SECRET`
2. Frontend : `cd frontend && npm run dev` (port 5173)
3. User seed : `admin@overglow.com` / `admin123` (ou `npm run create-admin`)
4. Au moins un produit publié à Agadir avec créneaux futurs

## Lancer
```bash
cd frontend
npm run cypress:run -- --spec cypress/e2e/critical-flow.cy.js
```

## Couverture
- Login API + session
- Search → product → booking → checkout cash → booking-success
- Offline payment laisse le booking en `PENDING_PAYMENT` (validation admin)

## Paiements carte (manuel)
Configurer Stripe test + webhook CLI :
```bash
stripe listen --forward-to localhost:5001/api/payments/webhook/stripe
```
