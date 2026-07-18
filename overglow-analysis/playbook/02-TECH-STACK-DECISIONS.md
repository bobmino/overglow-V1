# 02 — Décisions stack (souveraineté V1)

## Retenu

| Couche | Choix |
|--------|--------|
| Domaine | `www.overglow.online` |
| Host | **VPS** (Docker Compose) |
| Frontend | React 19 + Vite → static nginx |
| Backend | Express + Mongoose |
| DB | **MongoDB Docker sur VPS** (pas Atlas long terme) |
| Médias | **`STORAGE_DRIVER=local`** → volume `/uploads` — **pas Cloudinary** |
| i18n | FR/EN/ES/AR |
| Paiements | Stripe/PayPal/CMI **quand comptes** ; sinon booking différé |
| Mail | SMTP (`EMAIL_*`) — voir 09-MAIL-DNS |
| CI/CD | GitHub Actions → SSH / compose sur VPS |
| Cache | Upstash optionnel |

## Abandonné / reporté

- Cloudinary en prod  
- Dépendance exclusive Vercel serverless  
- Activation live paiements sans comptes  
- Deux domaines SEO actifs (trip.com + online)

## Dette

- Migration images base64 → fichiers locaux  
- Envelope API uniforme  
- Pages admin encore denses  
