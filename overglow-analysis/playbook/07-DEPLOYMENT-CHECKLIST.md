# 07 — Checklist déploiement soft-launch

> Pas TypeScript. Pas de claim « E2E 100 % ». Aligné repo JS + Vercel.

## Avant deploy

- [ ] `main` vert / build frontend OK  
- [ ] `.env` prod : `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL` / `SITE_URL`  
- [ ] `SEO_NOINDEX` / `ALLOW_INDEXING` selon phase  
- [ ] Cloudinary configuré  
- [ ] Sentry DSN si utilisé  
- [ ] Paiements live **ou** parcours différé validé  

## Données

- [ ] `npm run create-admin` (prod) si besoin  
- [ ] `npm run seed:cms` si blog/FAQ vides  
- [ ] Initialiser badges (admin)  
- [ ] 5–10 produits Published + opérateur Active  

## Deploy

- [ ] Frontend Vercel (vars `VITE_*`)  
- [ ] API déployée + health OK  
- [ ] CORS origines prod  
- [ ] Webhooks paiements (si live)  

## Après deploy

- [ ] `/fr` home + search  
- [ ] `/fr/blog` + `/fr/faq` non vides  
- [ ] Login admin + 1 edit produit  
- [ ] Cookie banner  
- [ ] Rollback plan : redeploy previous Vercel + restore Mongo si migration  

## Interdit

- Committer `.env`  
- Activer `ENABLE_PAYMENT_SIM` en prod  
