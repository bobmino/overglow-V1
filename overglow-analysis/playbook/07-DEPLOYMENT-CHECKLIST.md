# 07 — Déploiement VPS (overglow.online)

## Prérequis serveur

- [ ] Ubuntu LTS, Docker, Compose  
- [ ] Firewall 22/80/443  
- [ ] User `deploy` + clé SSH  
- [ ] Clone `overglow-V1`  

## App

- [ ] `.env` prod (`STORAGE_DRIVER=local`, `MONGO_URI`, `JWT_SECRET`, `SITE_URL=https://www.overglow.online`)  
- [ ] `frontend/.env` build (`VITE_API_URL`, `VITE_SITE_URL`)  
- [ ] `docker compose up -d --build`  
- [ ] Volume `uploads` persistant + backup cron  
- [ ] TLS (certbot)  

## CI

- [ ] Secrets GitHub : `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`  
- [ ] Workflow `.github/workflows/ci.yml` + `deploy.yml` verts  

## Données

- [ ] `create-admin` / `seed:cms` / badges  
- [ ] 5–10 produits réels  

## DNS (Wave 3)

- [ ] A/AAAA `overglow.online` + `www` → VPS  
- [ ] Redirect apex → www  
- [ ] Ancien `overglowtrip.com` → 301 vers `.online` si conservé  

## Paiements

- [ ] Soit clés live configurées  
- [ ] Soit différé assumé + FAQ à jour  

## Smoke

- [ ] Home + search + blog + FAQ  
- [ ] Upload image → URL `/uploads/...`  
- [ ] Login admin + edit produit  
- [ ] `node scripts/smokeAdminBo.js` (contre API prod avec tunnel ou IP)  
