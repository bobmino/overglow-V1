# 04 — Paiements (différé → live Wave 3)

## Décision

**Aucun compte Stripe/PayPal/CMI pour l’instant.**  
Le checkout crée un booking avec paiement différé / hors-ligne (`PENDING_PAYMENT`) ; l’admin valide via `/admin/pending-payments`.

Ne pas bloquer le soft-launch sur les PSP.

## Quand les comptes existent (Wave 3)

1. Remplir `STRIPE_*`, `PAYPAL_*`, `CMI_*`, `BANK_*`  
2. Webhooks → `https://www.overglow.online/api/payments/...`  
3. `ENABLE_PAYMENT_SIM=false`  
4. Smoke montant MAD + commission  
5. Documenter parcours live vs différé dans Help/FAQ

## Code de référence

- `backend/controllers/paymentController.js`  
- `backend/config/paymentEnv.js` (503 si env absente)  
- `frontend/src/pages/CheckoutPage.jsx` (`deferPayment`)  
