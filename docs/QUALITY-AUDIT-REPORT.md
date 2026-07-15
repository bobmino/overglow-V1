# Rapport d’audit qualité & performance — Overglow Trip

**Date :** 15 juillet 2026  
**Périmètre :** frontend (`frontend/src`), backend (`backend/`), entrée API (`server.js` / `api/`)  
**Référence :** PROMPT 19 — Audit Final Qualité + Performance  
**Commit de référence :** post–PROMPT 18 (`0e01793` + correctifs audit)

---

## Synthèse

| Domaine | Verdict | Commentaire |
|---------|---------|-------------|
| Build frontend | OK | `vite build` réussi |
| ESLint frontend | **0 erreur** | Passé de ~534 → 0 erreurs (Cypress globals + nettoyage src). Warnings hooks compiler conservés (set-state-in-effect, exhaustive-deps). |
| `console.log` prod | OK | Logger centralisé |
| ESLint backend | Absent | Toujours à ajouter |
| Auth routes | OK | Allowlist settings + badges Admin |
| Pagination | Partiel | `getUsers` / `getOperators` bornés (limit≤200) + N+1 onboarding corrigé |
| Bundle | Acceptable | Code-split OK |
| Accessibilité | Partiel | Idem rapport initial |

**Verdict global :** lint frontend **propre en erreurs** ; dette restante = warnings React Compiler + pagination UI complète + ESLint backend.

---

## 1. Frontend

### 1.1 ESLint

- Commande : `npm run lint` dans `frontend/`
- Résultat : **~534 problèmes** (≈512 errors, ≈22 warnings)
- Familles dominantes (observation) :
  - `react-hooks/immutability` — accès à des fonctions déclarées après `useEffect` (`ProductDetailPage`, `ViewHistoryPage`, etc.)
  - `no-unused-vars` — variables / catch `e` non utilisés
  - `react-hooks/exhaustive-deps` — deps manquantes (`SearchPage`, etc.)
  - `no-console` — surtout hors `src` (`vite.config.js`)

**Recommandation (haute) :** refactor progressif — déplacer les helpers avant les effets, ou `useCallback` + deps ; viser zéro *error* sur les pages checkout / auth / admin en premier.

### 1.2 Console / imports morts

- `console.log` / `debug` : **non trouvés** dans le code applicatif (hors logger).
- Imports inutilisés : signalés massivement par ESLint — à nettoyer avec le plan lint ci-dessus.

### 1.3 Mémoire / effets

- Patterns à risque : `useEffect` appelant des fonctions non stabilisées (immutability lint).
- Bonnes pratiques déjà présentes : cleanup sur certains listeners (notifications / SSE) — à généraliser sur les modales (focus trap).

### 1.4 Images & formulaires

| Sujet | Statut | Notes |
|-------|--------|-------|
| `alt` images | Partiel | Produits / blog souvent OK ; vérifier placeholders et avatars |
| Validation forms | Bon | express-validator côté API + contrôles UI register/login (PROMPT 17) |
| Lazy routes | Bon | Chunks page (admin, operator, product…) |

---

## 2. Backend

### 2.1 Outillage

- Pas de dossier `backend/api/` — routing via `server.js` + `api/index.js` racine.
- **Pas d’ESLint backend** — à ajouter (eslint + eslint-plugin-security recommandé).

### 2.2 Auth & exposition (corrigé / restant)

| Sévérité | Finding | Action |
|----------|---------|--------|
| Critique → corrigé | `GET /api/settings/:key` lisait n’importe quelle clé (commission, emails…) | Allowlist publique + Admin via `optionalAuth` |
| Haute → corrigé | `POST /api/badges/update-*` : `protect` sans `authorize` | Restreint à `Admin` |
| Moyenne | `GET /api/health/detailed` | Surveiller headers Vercel / clé |
| Basse | `POST /api/auth/refresh` | Intentionnel |

### 2.3 Rate limiting

- `apiLimiter` global sur `/api` + limiteurs auth / paiements / uploads.
- **Haute :** fail-open si Upstash down — documenter monitoring Redis.
- Exclusions : auth, health, webhooks, `unread-count`.

### 2.4 Pagination / listes non bornées

| Sévérité | Zone |
|----------|------|
| Haute | Admin `getUsers`, `getOperators`, pending payments |
| Haute | Opérateur bookings / analytics sans page |
| Moyenne | Withdrawals, approval requests, `getMyBookings` |

**Recommandation :** `page` + `limit` (défaut 20, max 100) sur toutes les listes dashboard.

### 2.5 N+1

| Sévérité | Zone |
|----------|------|
| Haute | `getOperators` → `OperatorOnboarding.findOne` par opérateur |
| Haute | Analytics produit : 3 `countDocuments` par produit |
| Moyenne | Enrichissement notes search |

### 2.6 Handlers async

- `createReview` mélangeait `throw` hors try — risque unhandled ; standardiser sur `asyncHandler` ou try/catch partout.
- Admin / bookings : majoritairement protégés.

---

## 3. Performance

| Métrique | Valeur | Appréciation |
|----------|--------|--------------|
| `vendor-*.js` | ~952 KB | Attendu (React ecosystem) — surveiller tree-shaking Recharts |
| `admin-*.js` | ~214 KB | OK pour back-office |
| `operator-*.js` | ~122 KB | OK |
| `index-*.js` | ~121 KB | OK |
| Images | Cloudinary | Vérifier transformations WebP / `loading="lazy"` systématiques |

**Reco :** lazy-load Recharts uniquement sur pages analytics (déjà partiellement le cas) ; paginer les gros payloads API.

---

## 4. Accessibilité (échantillon)

| Critère | Statut |
|---------|--------|
| Navigation clavier onglets settings | OK |
| Labels formulaires auth | OK (PROMPT 17) |
| Focus trap modales | Partiel — preview email a `role="dialog"` ; généraliser `Esc` + focus initial |
| Contraste | Thème emerald / gris — globalement AA sur textes principaux ; vérifier placeholders |
| `iframe` preview email | `sandbox=""` — OK sécurité ; titre présent |

---

## 5. Correctifs appliqués

### PROMPT 19 (initial)
1. Allowlist `GET /api/settings/:key` + lecture Admin via `optionalAuth`.
2. `authorize('Admin')` sur `POST /api/badges/update-operator|product/:id`.
3. Publication de ce rapport.

### Suivi lint + perf (post–PROMPT 19)
1. Config ESLint : globals Cypress / service worker / Node (`vite.config`), `argsIgnorePattern` / caught `_`.
2. **0 erreur ESLint** : unused vars, hooks avant early-return, immutability (fetch avant `useEffect`), `CustomTooltip` hors render, `handleRequestApproval` opérateur restauré.
3. Admin `getUsers` / `getOperators` : `limit`/`page` + batch onboarding (plus de N+1 `findOne`).

---

## 6. Backlog priorisé

| Priorité | Action | Effort |
|----------|--------|--------|
| P0 | Paginer listes admin users/operators/bookings | M |
| P0 | Réduire N+1 onboarding opérateurs (aggregate / `$lookup`) | M |
| P1 | Plan lint frontend : pages critique → 0 error | L |
| P1 | ESLint backend + CI gate | S |
| P1 | Fail-closed ou alerte si rate-limit Redis down | S |
| P2 | Focus trap + Esc sur toutes les modales | S |
| P2 | Audit `alt` images catalogue / homepage | S |

---

## 7. Conclusion

La plateforme **compile**, **déploie** (PROMPT 1–18), et les **fuites settings / badges** repérées ici sont **corrigées**.  
L’effort restant est surtout **hygiène (lint hooks)** et **scalabilité données (pagination / N+1)** — pas un bloqueur go-live immédiat, mais à traiter avant montée en charge trafic.

*Rapport généré dans le cadre de PROMPT 19.*
