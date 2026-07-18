# 02 — Décisions stack (réel vs dette)

## Choix retenus (V1)

| Couche | Choix | Pourquoi |
|--------|--------|----------|
| Frontend | React 19 + Vite SPA | Déjà en place ; API Express séparée |
| Styles | Tailwind + `primary` brand | Tokens existants ; éviter emerald générique |
| i18n | react-i18next, 4 locales FR/EN/ES/AR | `frontend/public/locales/…` |
| HTTP client | axios + interceptors | Standard actuel du repo |
| State serveur | Mix axios/context (+ React Query dispo) | Ne pas migrer en masse sans besoin |
| Backend | Express + Mongoose ESM | MVC `backend/` |
| DB | MongoDB Atlas | `MONGO_URI` |
| Images | Cloudinary | Uploads auth |
| Paiements | Stripe + PayPal + CMI + virement | Marketplace MAD ; live = ops |
| Email | Resend et/ou SMTP | `.env.example` |
| Cache | Upstash Redis optionnel | Rate limit / cache |
| Hosting | Vercel (front) + API Node | Soft-launch |

## Explicitement NON (pour l’instant)

- Next.js App Router obligatoire  
- TypeScript obligatoire  
- Envelope API uniforme `{status,data,meta}` partout (dette possible plus tard)  
- Stripe Connect « Express multi-comptes » comme déjà livré — vérifier le code `paymentController` avant d’écrire de la doc Connect avancée  
- Redux Toolkit  

## Dette technique documentée (cible, pas « done »)

- Harmoniser réponses API  
- Réduire pages admin monolithiques (>1000 lignes)  
- Brancher React Query sur listes publiques si perf le demande  
- Rôles admin granulaires  
