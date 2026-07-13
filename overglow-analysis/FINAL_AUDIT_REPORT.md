# Overglow Trip — Audit final pré-lancement [TASK-21]

**Date:** 2026-07-13  
**Branche:** `main`  
**Décision:** **GO CONDITIONNEL** (lancer en soft-launch / staging ; corriger ESLint + E2E auth avant go-live marketing large)

---

## Résumé

| Domaine | Verdict | Notes |
|--------|---------|--------|
| Sécurité dépendances (prod) | **PASS** | Root + frontend `--omit=dev` : **0 vulnérabilités** après bumps |
| Secrets dans Git | **PASS** | Seul `.env.example` tracké ; aucun pattern sk_live / clé privée détecté |
| CORS | **PASS** | Allowlist centralisée (`backend/config/cors.js`) |
| Uploads | **PASS** | Routes protégées (`protect`) + MIME images (TASK-1/9) |
| AuthZ UI | **PASS** (revue code) | `PrivateRoute` + `AdminRoute` sur App.jsx |
| AuthZ / auth flows E2E | **SKIP** | Serveurs / comptes non exécutés dans cet audit automatisé |
| Sanitization UGC | **PASS** | DOMPurify FE+BE (TASK-19) |
| Payment simulator | **PASS** | Guard `ENABLE_PAYMENT_SIM` (TASK-20) |
| `console.*` prod | **PASS** | Uniquement dans `utils/logger.js` |
| ESLint frontend | **FAIL** | ~91 erreurs / 22 warnings (dette qualité) |
| Bundle / Lighthouse | **SKIP** | Pas de `dist` frais ; disque plein (`ENOSPC`) a bloqué Cypress/audit fix FE |
| robots / sitemap | **PASS** | Rewrites Vercel `/robots.txt` + `/sitemap.xml` → API |

---

## 1. Security audit

### 1.1 `npm audit` (HIGH/CRITICAL)

| Scope | Avant | Après | Action |
|-------|-------|-------|--------|
| Root (prod) | 9 high (nodemailer, express/path-to-regexp, …) | **0** | `npm audit fix` + `nodemailer@9.0.3` |
| Frontend (prod `--omit=dev`) | 4–6 high (react-router, form-data, …) | **0** | `react-router(-dom)@7.18.1`, `axios@latest`, etc. |
| Frontend (all deps) | 21 issues | Dev-only (Cypress, etc.) | Acceptable pré-prod ; ne bloque pas le runtime |

### 1.2 Secrets

- **PASS** — fichiers `.env` non trackés (hors `.env.example`)
- Historique : aucun commit d’ajout `.env` détecté via `git log --diff-filter=A`
- Grep secrets : aucun match `sk_live_`, `AKIA…`, `PRIVATE KEY`

### 1.3 Auth / authorization (revue code)

| Check | Statut | Preuve |
|-------|--------|--------|
| Routes admin UI | PASS | `AdminRoute` dans `App.jsx` |
| Routes privées | PASS | `PrivateRoute` → redirect `/login` |
| Backend admin | PASS (TASK-1+) | `protect` + `authorize('Admin')` sur routes sensibles |
| Login / register / refresh | SKIP E2E | À valider manuellement ou Cypress |
| Password reset | SKIP E2E | Idem |
| Upload auth + MIME | PASS | `uploadRoutes.js` |

### 1.4 CORS

- **PASS** — `DEFAULT_ALLOWED_ORIGINS` + `FRONTEND_URL` / `CORS_ALLOWED_ORIGINS` ; pas de wildcard `*.vercel.app`.

### 1.5 Paiements

- **PASS** — simulateur désactivé par défaut ; prod force OFF même si flag true (WARNING au boot).

---

## 2. Code quality audit

| Check | Statut | Détail |
|-------|--------|--------|
| ESLint zero errors | **FAIL** | Ex. `OperatorWizardPage`, `PartnerSignupPage`, `ViewHistoryPage`, hooks deps, unused vars |
| Parsing cassé logger replace | **FIXED** | `ProductDetailPage.jsx` import lucide cassé → corrigé dans cet audit |
| TypeScript strict | N/A | Projet JS |
| `console.log` prod | **PASS** | Logger structuré TASK-18 |
| Async error handling | PARTIEL | `asyncHandler` + middleware ; spots encore silents (ex. booking payment catch 202) |

### ESLint — top dettes (sévérité Medium)

1. Variables non utilisées / hooks immutability (`ViewHistoryPage`)
2. `no-undef` ponctuels (handlers manquants)
3. Warnings `react-hooks/exhaustive-deps` (Search, Wizard)

**Recommandation:** sprint dette ESLint avant go-live public (bloquant qualité, pas sécurité runtime immédiate).

---

## 3. Performance audit

| Check | Statut | Détail |
|-------|--------|--------|
| Lighthouse > 90 | **SKIP** | Non exécuté (environnement + ENOSPC) |
| Bundle first-load JS < 200KB | **SKIP** | Pas de build `dist` analysé ici |
| Fonts non bloquantes | **PASS** | TASK-20 : fonts via `index.html` + `display=swap` |
| Images WebP / lazy | PARTIEL | `setupLazyImages` présent ; audit contenu images = TASK-24 |
| API < 200ms | **SKIP** | Mesure runtime non faite |

**Recommandation:** lancer Lighthouse CI sur Vercel Preview après libération disque.

---

## 4. Issues restantes (par sévérité)

| Sévérité | Issue | Action |
|----------|-------|--------|
| **High** (qualité) | ESLint 91 errors | Sprint fix ciblé |
| **Medium** | Dev deps Cypress vulns / install ENOSPC | Nettoyer disque ; `npm ci` FE |
| **Medium** | Auth E2E non rejoués | Cypress critical-flow ou checklists manuelles |
| **Low** | Lighthouse / bundle non mesurés | Mesurer sur Preview |
| **Info** | AI message attribution (SEC-08) | TASK-22 suivante |

---

## 5. Go / No-Go

**GO CONDITIONNEL** pour déploiement staging / soft-launch technique.

**Bloquants avant go-live marketing :**

1. Corriger les erreurs ESLint critiques (parsing / undef)
2. Rejouer les flows auth + paiement (Stripe réel ou sim flag en staging seulement)
3. Lighthouse Preview ≥ 90 SEO / Best Practices (Performance cible ≥ 80 si images lourdes)

**Non-bloquants immédiats :** TASK-22 (flag AI messages), TASK-24 (images villes).

---

## Correctifs appliqués pendant l’audit

- Bump `nodemailer@9.0.3` (root) → 0 vuln prod
- Bump frontend prod : `react-router(-dom)@7.18.1`, `axios` latest → 0 vuln prod
- Fix import cassé `ProductDetailPage.jsx`
- Rapport livré dans `overglow-analysis/`
