# 04 — Paiements (V1 réel)

## Modèle

Marketplace : voyageur paie la plateforme ; opérateurs sont payés via **retraits** admin (`withdrawals`) après validation.  
Devise métier : **MAD** (vérifier affichages — éviter € inventés dans le BO).

## Providers (code + env)

| Provider | Env clés | Notes soft-launch |
|----------|----------|-------------------|
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VITE_STRIPE_PUBLIC_KEY` | Booking différé possible si live pas prêt |
| PayPal | `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE`, `PAYPAL_WEBHOOK_ID` | Sandbox puis live |
| CMI | `CMI_STORE_KEY`, `CMI_URL` | Maroc |
| Virement | `BANK_IBAN`, `BANK_SWIFT`, `BANK_NAME`, … | Validation manuelle admin (`pending-payments`) |

Si env manquantes : l’API peut logger un warn et renvoyer **503** sur init paiement — normal.

## Flux à connaître

1. Checkout → création booking / intent selon méthode.  
2. Webhooks Stripe/PayPal → maj statut booking (signature obligatoire).  
3. Admin : confirmer/rejeter paiements hors-ligne ; annuler booking.  
4. Opérateur : demande retrait → admin approve / process.

## Go-live paiements (ops)

- [ ] Comptes Stripe/PayPal/CMI live  
- [ ] Webhooks pointant vers URL prod  
- [ ] Tester montant MAD + commission  
- [ ] `ENABLE_PAYMENT_SIM=false` en prod  
- [ ] Ne jamais committer de clés

Référence code : `backend/controllers/paymentController.js`, routes `/api/payments`, admin bookings / pending-payments / withdrawals.

**Attention :** d’anciens docs « Stripe Connect Application Fee 15 % T+7 » peuvent être **aspirations**. Vérifier l’implémentation avant de promettre Connect Express aux partenaires.
