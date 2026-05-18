# Contexte Projet Overglow V1

## Description
Marketplace d'expériences touristiques authentiques au Maroc.
3 rôles : Client (réserve), Opérateur (crée des expériences), Admin (supervise).

## Stack
- Backend : Express.js ESM + MongoDB (Mongoose) + JWT
- Frontend : React 18 + Vite + Tailwind CSS + React Router v6 + TanStack React Query
- Paiement : Stripe
- Deploy : Vercel (monorepo backend+frontend)

## URLs Production
- Frontend : https://overglow-v1-3jqp.vercel.app
- Backend API : https://overglow-backend.vercel.app

## Structure Clé
- server.js → entry point backend (exporte app pour Vercel)
- api/index.js → handler serverless Vercel
- config/db.js → connexion MongoDB
- backend/{models,controllers,routes,middleware,services,utils}/
- frontend/src/{pages,components,context,hooks,utils,config}/

## Comptes Test
- Admin : admin@overglow.com / admin123
- Opérateur : operator@overglow.com / password123

## Pièges Connus (LIRE OBLIGATOIREMENT)
1. L'API /api/admin/products retourne {products:[], pagination:{}} PAS un array direct
   → Toujours : Array.isArray(data) ? data : (data?.products || [])
2. ErrorBoundary est monté HORS du Router → utiliser <a href> pas <Link>
3. Les emails doivent être .toLowerCase().trim() dans authController
4. Stripe peut crasher si bloqué par adblock → try/catch dans PaymentSelector
5. Vercel : trust proxy obligatoire pour rate limiting
6. Icônes lucide-react : CHAQUE icône utilisée dans le JSX doit être importée

## Métriques du Projet
- 19 modèles de données
- 27 contrôleurs backend
- 28 routes API
- 45 pages frontend
- 53 composants frontend

## Fichiers de Référence
- PROJECT_STATUS.md → inventaire exhaustif complet
- PROMPTS_GUIDE.md → guide de reconstruction étape par étape
- ROO_CODE_SETUP.md → documentation de cette configuration
