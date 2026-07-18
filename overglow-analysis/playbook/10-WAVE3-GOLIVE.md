# 10 — Wave 3 Go-Live (ops en bloc)

À exécuter quand VPS + DNS + (optionnel) comptes paiement sont prêts.  
**Pas de secrets dans git.**

## 1. DNS

- [ ] `A` / `AAAA` : `overglow.online` → IP VPS  
- [ ] `A` / `AAAA` : `www.overglow.online` → IP VPS  
- [ ] Redirect HTTP→HTTPS, apex→www  
- [ ] (Option) `api.overglow.online` si split static/API  
- [ ] Ancien domaine : 301 → `https://www.overglow.online`  

## 2. Secrets prod (bloc unique)

```
JWT_SECRET=
MONGO_URI=mongodb://mongo:27017/overglow
SITE_URL=https://www.overglow.online
FRONTEND_URL=https://www.overglow.online
CORS_ALLOWED_ORIGINS=https://www.overglow.online,https://overglow.online
STORAGE_DRIVER=local
UPLOAD_DIR=/app/uploads
EMAIL_*
SENTRY_DSN=
# Paiements seulement si comptes OK :
STRIPE_* PAYPAL_* CMI_* BANK_*
ENABLE_PAYMENT_SIM=false
```

Frontend build :

```
VITE_API_URL=https://www.overglow.online
VITE_SITE_URL=https://www.overglow.online
```

## 3. Données

- [ ] Admin + seed CMS + badges  
- [ ] Catalogue réel 5–10 produits  
- [ ] Mentions légales / CGU email `@overglow.online`  

## 4. Paiements

- [ ] Comptes OK → activer clés + webhooks  
- [ ] Sinon → rester différé + FAQ à jour (état non ambigu)  

## 5. Smoke

- [ ] HTTPS home  
- [ ] Upload image → `/uploads/{uuid}.webp`  
- [ ] Booking différé end-to-end  
- [ ] BO login + edit produit  
- [ ] Mail test  
- [ ] AR RTL smoke  
- [ ] Optionnel : audit Fable UX vs Booking sur staging live  

## 6. Critère Done

Site HTTPS sur **overglow.online**, app+DB+médias sur **votre** VPS, CI deploy, charte/nav/BO/onboarding/Help OK, paiements live **ou** différé documenté.
