# Fix Stripe/PayPal initialization crash

## Problème
`backend/controllers/paymentController.js` initialise Stripe et PayPal au chargement du module (lignes 5 et 8-12), même si les clés API ne sont pas définies. Cela fait planter le serveur sur Vercel avec l'erreur :
```
Error: Neither apiKey nor config.authenticator provided at Stripe._setAuthenticator
```

## Solution
Implémenter une initialisation paresseuse (lazy initialization) :
- Créer des fonctions `getStripe()` et `getPayPalClient()` qui retournent `null` si les clés ne sont pas définies
- Vérifier la disponibilité avant d'utiliser ces services
- Retourner des erreurs appropriées si les services ne sont pas configurés

## Fichiers modifiés
- `backend/controllers/paymentController.js`

## Date
2025-01-27

