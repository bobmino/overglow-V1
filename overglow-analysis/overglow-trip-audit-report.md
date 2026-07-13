# Overglow Trip — Audit CTO Report
Generated: 2026-07-12

## Executive Summary
- **Total Issues Found:** 31
  - Security: 12 (11 Critical, 1 High)
  - Runtime Bugs: 5 (3 guaranteed crashes, 2 conditional)
  - UX Issues: 7 (3 catastrophic, 4 major)
  - i18n Gaps: 7
- **Total Roadmap Tasks:** 63
- **Completed Tasks:** 0 / 63 (0%)
- **Go-Live Readiness:** 15%
- **Stack:** React 19 + Vite 7 / Express / MongoDB
- **Target:** Vercel + Atlas + Cloudinary

## Security Issues (12)

### SEC-01: PayPal Webhook — AUCUNE vérification de signature
- **File:** paymentController.js
- **Severity:** CRITICAL
- **Impact:** Un attaquant peut forger des webhooks PayPal pour marquer des commandes comme payées sans aucun paiement réel. Vol de produits/services garanti.
- **Fix:** Implémenter la vérification de signature PayPal avec PayPal SDK (verifyWebhookSignature). Comparer le headers PayPal-Transmission-Sig, PayPal-Transmission-Time et PayPal-Cert-URL.

### SEC-02: Montant payé jamais vérifié côté serveur
- **File:** paymentController.js
- **Severity:** CRITICAL
- **Impact:** Un attaquant peut modifier le montant du formulaire HTML (ex: 0.01€) et le serveur l'accepte. Perte de revenus directe.
- **Fix:** Avant d'enregistrer le paiement, récupérer le prix depuis la DB et comparer avec le montant reçu. Rejeter toute incohérence.

### SEC-03: Clé CMI fallback hardcoded
- **File:** paymentController.js
- **Severity:** CRITICAL
- **Impact:** Si la clé n'est pas configurée, les transactions CMI sont envoyées avec une clé factice, exposant une faille de configuration et potentiellement une fuite de clé si quelqu'un utilise ce placeholder.
- **Fix:** Remplacer le fallback par un throw Error() si la clé n'est pas définie. La clé ne doit jamais avoir de valeur par défaut.

### SEC-04: CORS wildcard *.vercel.app
- **File:** server.js, authMiddleware.js
- **Severity:** CRITICAL
- **Impact:** N'importe quel utilisateur Vercel peut faire des requêtes cross-origin vers l'API Overglow Trip, contournant la politique Same-Origin.
- **Fix:** Restreindre CORS au domaine exact (ex: overglow-trip.com, www.overglow-trip.com, preview.overglow-trip.vercel.app). Centraliser la config.

### SEC-05: Route webhook import SANS authentification
- **File:** productRoutes.js
- **Severity:** CRITICAL
- **Impact:** Un attaquant peut remplacer tout le catalogue produits, injecter du contenu malveillant, ou supprimer des données.
- **Fix:** Ajouter un middleware d'authentification admin sur cette route. Vérifier le rôle de l'utilisateur (admin/superadmin).

### SEC-06: Upload SANS authentification
- **File:** uploadRoutes.js
- **Severity:** CRITICAL
- **Impact:** Upload de fichiers malveillants, consommation de stockage Cloudinary, DoS, hébergement de contenu illégal sur l'infrastructure.
- **Fix:** Protéger toutes les routes d'upload avec authentification. Ajouter une vérification du type MIME et de la taille du fichier.

### SEC-07: AI service credentials hardcoded (localtunnel)
- **File:** aiService.js
- **Severity:** CRITICAL
- **Impact:** Si le dépôt est public, les clés API sont exposées. Tout le monde peut utiliser le service IA aux frais de l'entreprise.
- **Fix:** Déplacer toutes les clés vers des variables d'environnement (.env). Vérifier si les clés ont été compromises et les régénérer.

### SEC-08: Messages IA attribués à de vrais utilisateurs
- **File:** chatController.js
- **Severity:** CRITICAL
- **Impact:** Les messages IA sont indistinguables des messages réels. Cela peut créer des obligations légales (l'utilisateur n'a pas dit ça). Risque juridique majeur.
- **Fix:** Ajouter un champ isAI: true aux messages générés par l'IA. Afficher clairement dans l'UI que le message provient de l'assistant IA.

### SEC-09: IBAN/SWIFT hardcoded en clair
- **File:** paymentController.js
- **Severity:** CRITICAL
- **Impact:** Exposition des données bancaires dans le code source. Si le dépôt est compromis, les données bancaires de l'entreprise sont publiques.
- **Fix:** Déplacer les coordonnées bancaires dans des variables d'environnement ou dans un vault (ex: Vercel Environment Variables).

### SEC-10: Stack trace exposé en production
- **File:** api/index.js
- **Severity:** CRITICAL
- **Impact:** Fuite d'informations sensibles: chemins de fichiers, versions de dépendances, logique métier. Aide les attaquants à cibler les vulnérabilités.
- **Fix:** En production, ne renvoyer qu'un message d'erreur générique. Logger le stack trace côté serveur uniquement.

### SEC-11: Hash CMI sans séparateur — collision probable
- **File:** paymentController.js
- **Severity:** CRITICAL
- **Impact:** Un attaquant peut manipuler les montants pour générer le même hash, permettant des paiements frauduleux non détectés.
- **Fix:** Utiliser un séparateur clair entre chaque paramètre (ex: '|') ou utiliser un HMAC standard au lieu d'une concaténation maison.

### SEC-12: Rate limiting inopérant sur Vercel Serverless
- **File:** rateLimiter.js
- **Severity:** HIGH
- **Impact:** Aucune protection contre le brute force, le spam ou les attaques DDoS au niveau API. Chaque invocation est un processus isolé.
- **Fix:** Migrer vers un store externe (Redis via Upstash, Vercel KV) ou utiliser @upstash/ratelimit qui est compatible serverless.

## Runtime Bugs (5)

### BUG-01: Product jamais importé → ReferenceError
- **File:** operatorController.js
- **Fix:** Ajouter `const Product = require('../models/Product');` en haut du fichier operatorController.js.

### BUG-02: notifyInquiryReceived jamais importé
- **File:** inquiryController.js
- **Fix:** Ajouter l'import correct de notifyInquiryReceived depuis le module de notifications, ou définir la fonction localement.

### BUG-03: Erreur de syntaxe — parenthèse manquante
- **File:** operatorWizardRoutes.js
- **Fix:** Corriger la syntaxe en ajoutant la parenthèse manquante. L'erreur se situe autour des lignes 55-57.

### BUG-04: /slug intercepte /admin/all — blog routes
- **File:** blogRoutes.js
- **Fix:** Déplacer la route /admin/all AVANT la route /:slug, ou utiliser un préfixe distinct pour les routes admin.

### BUG-05: Aucun try/catch → unhandled rejection
- **File:** operatorController.js
- **Fix:** Envelopper chaque handler async dans un try/catch, ou utiliser un wrapper asyncHandler comme middleware.

## UX Issues (7)

### UX-01: 9 pages SANS Layout
- **Severity:** catastrophic
- **Fix:** Envelopper chaque page dans le composant Layout. Créer un Layout public réutilisable pour les pages marketing.

### UX-02: 0 page 404 — URL invalide = page blanche
- **Severity:** catastrophic
- **Fix:** Créer une page 404 avec navigation, recherche, et liens utiles. Configurer le fallback dans le router.

### UX-03: AffiliatePage stats fabriquées
- **Severity:** catastrophic
- **Fix:** Remplacer par des statistiques réelles de la plateforme (nombre de voyages, destinations marocaines, etc.).

### UX-04: Footer Trustpilot fictif "4.4 rating | 292,570 reviews"
- **Severity:** catastrophic
- **Fix:** Supprimer le badge fictif OU créer un compte Trustpilot et obtenir de vrais reviews. Afficher le widget Trustpilot officiel.

### UX-05: 4/6 villes partagent la même image Unsplash
- **Severity:** major
- **Fix:** Commander ou sourcer des photos uniques pour chaque ville. Utiliser des photos libres de droits différentes.

### UX-06: URL canonique pointe vers preview Vercel
- **Severity:** major
- **Fix:** Mettre à jour les canonical URLs pour pointer vers le domaine de production. Utiliser NEXT_PUBLIC_SITE_URL pour la base URL.

### UX-07: Pas de charte graphique cohérente
- **Severity:** major
- **Fix:** Créer un design system avec des tokens Tailwind (colors, spacing, typography). Standardiser sur un seul jeu de couleurs.

## i18n / RTL Gaps (7)

### I18N-01: 41/51 pages (80%) n'ont AUCUNE traduction
- **Impact:** Les utilisateurs non-francophones voient une interface inutilisable.
- **Fix:** Traduire les 41 pages restantes en utilisant le système i18n existant. Prioriser les pages critiques (checkout, booking, login).

### I18N-02: Arabe/RTL = 0% support CSS
- **Impact:** L'arabe est complètement illisible et l'interface est cassée en mode RTL.
- **Fix:** Ajouter des règles CSS RTL conditionnelles. Utiliser logical properties CSS (margin-inline-start, etc.).

### I18N-03: 30+ instances mr-*/ml-* cassées en RTL
- **Impact:** En arabe, les marges horizontales seront inversées, causant des mises en page cassées.
- **Fix:** Remplacer mr-*/ml-* par ms-*/me-* (margin-inline-start/end) ou utiliser le plugin tailwindcss-rtl.

### I18N-04: Pas de plugin RTL dans Tailwind
- **Impact:** Impossible de supporter correctement l'arabe sans une configuration Tailwind dédiée au RTL.
- **Fix:** Installer et configurer tailwindcss-rtl. Ajouter les variantes rtl: et ltr: dans tailwind.config.

### I18N-05: manifest.json "dir": "ltr" hardcoded
- **Impact:** Les PWA et les métadonnées du navigateur indiquent LTR pour l'arabe, causant des inconsistances.
- **Fix:** Générer dynamiquement le manifest.json avec la bonne direction basée sur la langue active.

### I18N-06: index.html lang="fr" hardcoded
- **Impact:** Les lecteurs d'écran et les moteurs de recherche détectent la mauvaise langue.
- **Fix:** Utiliser next-themes ou un middleware pour définir dynamiquement la langue du document HTML.

### I18N-07: 6 pages 100% français en dur
- **Impact:** Ces pages sont inaccessibles aux utilisateurs non-francophones. Contenu marketing et légal bloquant.
- **Fix:** Créer des fichiers de traduction pour ces 6 pages et intégrer le système i18n.

## Roadmap (63 tasks, 0 completed)

### S2: Security & Backend (26 tasks)

- [ ] S2.01: Centraliser la config CORS avec domaine exact (P0)
- [ ] S2.02: Implémenter la vérification de signature PayPal webhook (P0)
- [ ] S2.03: Vérifier le montant payé vs prix DB avant validation (P0)
- [ ] S2.04: Sécuriser la clé CMI — supprimer le fallback (P0)
- [ ] S2.05: Protéger les routes webhook/import avec auth admin (P0)
- [ ] S2.06: Corriger les 3 crashs garantis (BUG-01,02,03) (P0)
- [ ] S2.07: Déplacer les credentials IA dans .env (P0)
- [ ] S2.08: Cacher les stack traces en production (P0)
- [ ] S2.09: Déplacer IBAN/SWIFT dans les variables d'environnement (P0)
- [ ] S2.10: Migrer rate limiting vers Upstash Redis (P1)
- [ ] S2.11: Corriger l'ordre des routes blog (BUG-04) (P1)
- [ ] S2.12: Ajouter try/catch sur tous les handlers async (BUG-05) (P1)
- [ ] S2.13: Protéger contre le mass assignment (P1)
- [ ] S2.14: Supprimer le code mort et les imports inutilisés (P1)
- [ ] S2.15: Auditer et optimiser la config Vercel (P1)
- [ ] S2.16: Ajouter des indexes MongoDB manquants (P1)
- [ ] S2.17: Consolider le service d'email (P1)
- [ ] S2.18: Corriger les codes de statut HTTP incohérents (P1)
- [ ] S2.19: Sanitiser les uploads CSV/Excel (P1)
- [ ] S2.20: Cacher le endpoint /health en production (P1)
- [ ] S2.21: Protéger les routes FAQ admin (P1)
- [ ] S2.22: Implémenter un allowlist pour les settings utilisateur (P1)
- [ ] S2.23: Ajouter une limite de taille aux fichiers uploadés (P1)
- [ ] S2.24: Ajouter des diagnostics DB au démarrage (P1)
- [ ] S2.25: Marquer les messages IA avec un flag isAI (P1)
- [ ] S2.26: Corriger le hash CMI avec séparateur (P1)

### S3: UX/Nav/Design (20 tasks)

- [ ] S3.01: Intégrer les 9 pages dans le Layout (P0)
- [ ] S3.02: Créer une page 404 personnalisée (P0)
- [ ] S3.03: Unifier le design system (tokens Tailwind) (P0)
- [ ] S3.04: i18n du Header et navigation principale (P1)
- [ ] S3.05: Nettoyer le footer (supprimer Trustpilot fictif, ajouter i18n) (P1)
- [ ] S3.06: i18n de la navigation mobile (P1)
- [ ] S3.07: i18n de la navigation dashboard (P1)
- [ ] S3.08: i18n de la page Privacy Policy (P1)
- [ ] S3.09: i18n de la page Help / Aide (P1)
- [ ] S3.10: i18n de la page BlogPost (P1)
- [ ] S3.11: i18n de la page Destination (P1)
- [ ] S3.12: i18n de la page Category (P1)
- [ ] S3.13: i18n de la page Partner Signup (P1)
- [ ] S3.14: i18n de la page Affiliate (P1)
- [ ] S3.15: Corriger les canonical URLs (domaine de prod) (P1)
- [ ] S3.16: Rendre manifest.json dynamique (dir: auto) (P1)
- [ ] S3.17: Générer sitemap.xml dynamique (P1)
- [ ] S3.18: Créer/optimiser robots.txt (P1)
- [ ] S3.19: i18n du checkout et booking flow (P1)
- [ ] S3.20: i18n de login/register et booking success (P1)

### S4: i18n/RTL/Polish (17 tasks)

- [ ] S4.01: Installer et configurer tailwindcss-rtl (P0)
- [ ] S4.02: Convertir mr-*/ml-* en logical properties (P0)
- [ ] S4.03: Ajouter les règles CSS RTL manquantes (P0)
- [ ] S4.04: Rendre le HTML lang dynamique (P0)
- [ ] S4.05: Compléter les traductions (4 langues) (P1)
- [ ] S4.06: i18n des 10 pages restantes (P1)
- [ ] S4.07: Nettoyer tous les console.log (P2)
- [ ] S4.08: Implémenter un logger backend structuré (P2)
- [ ] S4.09: Ajouter un sanitizer HTML (P2)
- [ ] S4.10: Activer React Strict Mode (P2)
- [ ] S4.11: Implémenter un cache pour les taux de change (P2)
- [ ] S4.12: Mettre en cache le sitemap.xml (P2)
- [ ] S4.13: Optimiser robots.txt (P2)
- [ ] S4.14: Ajouter un guard sur le payment simulator (P2)
- [ ] S4.15: Supprimer le vercel.json dupliqué (P2)
- [ ] S4.16: Éliminer le render-blocking CSS (P2)
- [ ] S4.17: Audit final de sécurité et de qualité (P2)

## Environment Variables Required (29)

| Variable | Category | Required For | Status |
|---|---|---|---|
| `MONGO_URI` | Database | Core | Required |
| `JWT_SECRET` | Auth | Core | Required |
| `STRIPE_SECRET_KEY` | Payments | Stripe | Required |
| `STRIPE_WEBHOOK_SECRET` | Payments | Stripe | Required |
| `PAYPAL_CLIENT_ID` | Payments | PayPal | Required |
| `PAYPAL_CLIENT_SECRET` | Payments | PayPal | Required |
| `PAYPAL_MODE` | Payments | PayPal | Required |
| `PAYPAL_WEBHOOK_ID` | Payments | PayPal | Required |
| `CMI_STORE_KEY` | Payments | CMI | Required |
| `CMI_URL` | Payments | CMI | Required |
| `CLOUDINARY_CLOUD_NAME` | Storage | Cloudinary | Required |
| `CLOUDINARY_API_KEY` | Storage | Cloudinary | Required |
| `CLOUDINARY_API_SECRET` | Storage | Cloudinary | Required |
| `EMAIL_HOST` | Email | SMTP | Required |
| `EMAIL_PORT` | Email | SMTP | Required |
| `EMAIL_USER` | Email | SMTP | Required |
| `EMAIL_PASS` | Email | SMTP | Required |
| `RESEND_API_KEY` | Email | Resend | Recommended |
| `RESEND_FROM` | Email | Resend | Required |
| `SENTRY_DSN` | Monitoring | Sentry | Recommended |
| `FRONTEND_URL` | Config | Deployment | Required |
| `UPSTASH_REDIS_REST_URL` | Config | Rate Limiting | Required |
| `UPSTASH_REDIS_REST_TOKEN` | Config | Rate Limiting | Required |
| `IMPORT_WEBHOOK_API_KEY` | Config | Admin | Required |
| `ALLOWED_ORIGINS` | Config | CORS | Required |
| `BANK_IBAN` | Payments | Bank Transfer | Required |
| `BANK_SWIFT` | Payments | Bank Transfer | Required |
| `BANK_NAME` | Payments | Bank Transfer | Required |
| `BANK_ACCOUNT_NAME` | Payments | Bank Transfer | Required |

---
Completed: 0/63 (0%)
Go-Live Readiness: 15%
