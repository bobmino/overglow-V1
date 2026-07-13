=== PROGRESS TRACKER ===
- [x] [1] Centraliser CORS + Sécuriser routes critiques (P0, S2)
- [x] [2] PayPal Webhook Signature Verification (P0, S2)
- [x] [3] CMI Payment Hardening + Bank Details Securing (P0, S2)
- [x] [4] Fix 3 Guaranteed Crashes (BUG-01,02,03) (P0, S2)
- [x] [5] AI Service Credentials + Error Leak Fix (P0, S2)
- [x] [6] Rate Limiting Migration + Mass Assignment Protection (P1, S2)
- [x] [7] Blog Route Order + Async Error Handling (P1, S2)
- [x] [8] DB Indexes + Status Codes + Email Consolidation (P1, S2)
- [x] [9] CSV Sanitization + Upload Security + Health Endpoint (P1, S2)
- [x] [10] Layout Integration + 404 Page + Design System (P0, S3)
- [x] [11] Header + Footer + Mobile Nav i18n (P1, S3)
- [x] [12] Legal + Support Pages i18n (Privacy, Help, BlogPost) (P1, S3)
- [x] [13] Destination + Category + Partner + Affiliate i18n (P1, S3)
- [x] [14] SEO Fix: Canonical URLs + Manifest + Sitemap + Robots (P1, S3)
- [x] [15] Checkout + Booking + Auth Flow i18n (P1, S3)
- [x] [16] RTL Infrastructure: tailwindcss-rtl + Logical Properties (P0, S4)
- [x] [17] Complete All Translations (4 Languages) (P1, S4)
- [x] [18] Console.log Cleanup + Structured Logger (P2, S4)
- [x] [19] HTML Sanitizer + Strict Mode + Currency Cache (P2, S4)
- [x] [20] Payment Simulator Guard + Vercel Config Cleanup (P2, S4)
- [x] [21] Final Audit: Security + Quality + Performance (P2, S4)
- [x] [22] AI Chat Message Flagging + Legal Compliance (P0, S2)
- [x] [23] Settings Allowlist + Health Endpoint + DB Diagnostics (P1, S2)
- [x] [24] Duplicate Image Fix + Content Authenticity Audit (P1, S3)

---

=== [1] Centraliser CORS + Sécuriser routes critiques (P0, S2) ===

You are a senior backend security engineer. 

TASK: Fix the CORS configuration and secure unprotected routes in this Express.js + MongoDB application deployed on Vercel.

CONTEXT:
- The CORS config in server.js and authMiddleware.js allows *.vercel.app (wildcard subdomain)
- POST /api/products/import (productRoutes.js:74) has NO authentication
- POST /api/upload (uploadRoutes.js:8,28) has NO authentication
- These routes accept requests from ANY Vercel deployment

REQUIREMENTS:
1. Create a centralized cors.js module with an explicit domain allowlist
2. Replace all 4 CORS configurations with the centralized module
3. Add auth + adminGuard middleware to productRoutes.js import route
4. Add auth middleware to all upload routes in uploadRoutes.js
5. Add MIME type validation for uploads (images only: jpg, png, webp, gif)
6. Add file size limit (5MB max)

TESTING: Verify with curl that:
- Authorized domains get 200
- Unauthorized domains get CORS error
- Unauthenticated requests to import/upload get 401
- Admin-only routes require admin role

---

=== [2] PayPal Webhook Signature Verification (P0, S2) ===

You are a payment security specialist.

TASK: Implement PayPal webhook signature verification and server-side amount validation in paymentController.js.

CONTEXT:
- paymentController.js lines 340-358: PayPal webhook handler accepts ANY request without signature verification
- paymentController.js lines 70, 153, 416, 532: Amount paid is NEVER compared to actual product price
- An attacker can forge webhooks to mark orders as paid without payment
- An attacker can modify the payment amount in the form (e.g., set to 0.01€)

REQUIREMENTS:
1. Install @paypal/checkout-server-sdk (or use fetch-based verification)
2. In the webhook handler, verify PayPal-Transmission-Sig, PayPal-Transmission-Time, PayPal-Cert-URL headers
3. Reject any webhook that fails signature verification with 400 status
4. In createOrder, verifyPayPalSuccess, verifyCMISuccess, and bankTransfer handlers:
   a. Fetch the actual product/service price from MongoDB
   b. Compare with the received amount (tolerance: 0.01€)
   c. Reject if amounts don't match
5. Add comprehensive error logging for failed verifications
6. Write unit tests for the verification logic

---

=== [3] CMI Payment Hardening + Bank Details Securing (P0, S2) ===

You are a fintech security engineer specializing in Moroccan payment systems (CMI - Centre Monétique Interbancaire).

TASK: Fix 3 critical payment security issues.

CONTEXT:
- paymentController.js:418: CMI store key has fallback 'your_cmi_store_key' (hardcoded placeholder)
- paymentController.js:423: CMI hash is generated WITHOUT separators (collision risk: '12'+'3' == '1'+'23')
- paymentController.js:501-508: IBAN and SWIFT/BIC are hardcoded in plain text

REQUIREMENTS:
1. CMI Store Key:
   - Remove the fallback value entirely
   - Throw a descriptive error at startup if CMI_STORE_KEY env var is missing
   - Add a startup validation check in server.js

2. CMI Hash Collision Fix:
   - Add a pipe '|' separator between each parameter in the hash computation
   - Example: hash = sha256(amount + '|' + orderId + '|' + storeKey + '|' + timestamp)
   - Add a comment explaining why the separator is critical

3. Bank Details:
   - Move IBAN and SWIFT to environment variables (BANK_IBAN, BANK_SWIFT)
   - Validate they exist at startup
   - Never log them in plain text

---

=== [4] Fix 3 Guaranteed Crashes (BUG-01,02,03) (P0, S2) ===

You are a senior Node.js developer fixing critical runtime bugs.

TASK: Fix 3 guaranteed crash bugs that prevent core functionality from working.

BUG-01: operatorController.js:37
- ERROR: ReferenceError: Product is not defined
- CAUSE: The Product model is used but never imported
- FIX: Add 'const Product = require('../models/Product');' at the top
- VERIFY: Check if other models are also missing imports

BUG-02: inquiryController.js:44,126
- ERROR: ReferenceError: notifyInquiryReceived is not defined
- CAUSE: notifyInquiryReceived is called but never imported
- FIX: Find where notifyInquiryReceived is defined and add the correct import
- VERIFY: Test inquiry creation and update flows

BUG-03: operatorWizardRoutes.js:55-57
- ERROR: SyntaxError: Unexpected token
- CAUSE: Missing closing parenthesis in a function expression
- FIX: Add the missing parenthesis and verify syntax
- VERIFY: Run 'node -c operatorWizardRoutes.js' to check syntax

AFTER FIXES: Run the application and verify no ReferenceError or SyntaxError occurs.

---

=== [5] AI Service Credentials + Error Leak Fix (P0, S2) ===

You are a DevSecOps engineer.

TASK: Fix two critical security issues related to credentials and error information leakage.

ISSUE 1: aiService.js:10-19
- AI service URL (localtunnel) and API keys are hardcoded in the source code
- If this repo is/was public, these credentials are compromised
- FIX:
  a. Move ALL credentials to .env variables (AI_SERVICE_URL, AI_API_KEY)
  b. Add .env to .gitignore if not already present
  c. Add startup validation
  d. Check git history for exposed credentials - if found, ROTATE ALL KEYS IMMEDIATELY

ISSUE 2: api/index.js:83-89
- Global error handler exposes full stack traces in API responses
- FIX:
  a. In production (NODE_ENV=production), return only: { success: false, error: 'Internal Server Error', statusCode: 500 }
  b. In development, return the full error for debugging
  c. Log the full error server-side with timestamp and request info
  d. Never expose: file paths, line numbers, database queries, or internal module names

BONUS: Add a helmet.js middleware for additional security headers.

---

=== [6] Rate Limiting Migration + Mass Assignment Protection (P1, S2) ===

You are a backend engineer specializing in API security.

TASK: Fix two major API security issues.

ISSUE 1: Rate Limiting is NON-FUNCTIONAL
- rateLimiter.js uses express-rate-limit with in-memory store
- Vercel Serverless Functions are STATELESS - memory store doesn't persist between invocations
- FIX:
  a. Install @upstash/ratelimit and @upstash/redis
  b. Create a new rate limiter using Upstash Redis
  c. Configure different limits per endpoint:
     - Auth endpoints: 5 req/min
     - API endpoints: 60 req/min
     - Upload endpoints: 10 req/min
     - Webhook endpoints: No rate limit (verified by signature)
  d. Test on Vercel to confirm rate limiting works across function invocations

ISSUE 2: Mass Assignment Vulnerability
- operatorController.js and inquiryController.js accept raw req.body
- Users can modify sensitive fields (role, isAdmin, _id, etc.)
- FIX:
  a. Create an allowlist utility: function sanitizeBody(body, allowedFields)
  b. Define allowed fields for each operation (create, update, patch)
  c. Apply sanitization BEFORE saving to database
  d. Specifically block: role, isAdmin, _id, __v, password (unless it's a password change endpoint)

---

=== [7] Blog Route Order + Async Error Handling (P1, S2) ===

You are an Express.js expert.

TASK: Fix two runtime issues affecting stability.


ISSUE 1: blogRoutes.js:88-129 - Route Order Bug
- GET /:slug is defined BEFORE GET /admin/all
- Express matches 'admin' as a slug parameter
- The /admin/all endpoint is NEVER reachable
- FIX:
  a. Move GET /admin/all BEFORE GET /:slug
  b. Add validation: slug must match /^[a-z0-9-]+$/ (no 'admin' as slug)
  c. Test both routes independently and together

ISSUE 2: operatorController.js - Missing Error Handling
- NO async handler has try/catch
- Any DB error, timeout, or validation error causes unhandled promise rejection
- In Vercel serverless, this can cause cold starts and 500 errors
- FIX:
  a. Create middleware/asyncHandler.js: a wrapper that catches errors and passes to next()
  b. Apply to ALL async route handlers in operatorController.js
  c. Also apply to inquiryController.js and chatController.js
  d. Ensure errors are properly formatted: { success: false, error: message, statusCode: code }
  e. Test by simulating DB connection errors

---

=== [8] DB Indexes + Status Codes + Email Consolidation (P1, S2) ===

You are a backend performance and reliability engineer.

TASK: Improve database performance, API correctness, and email reliability.

TASK 1: MongoDB Indexes
- Analyze all Mongoose queries in the codebase
- Identify fields used in: find(), findOne(), where(), sort()
- Add compound indexes for common query patterns
- Add unique index on: email (users), slug (products, blog posts)
- Add indexes on: status, createdAt, updatedAt for sorting/filtering
- Use MongoDB explain() to verify indexes are used

TASK 2: HTTP Status Codes Audit
- Review ALL controller endpoints
- Ensure correct status codes:
  - POST create → 201 Created
  - PUT/PATCH update → 200 OK
  - DELETE → 204 No Content
  - GET not found → 404 Not Found
  - Validation error → 400 Bad Request
  - Unauthorized → 401
  - Forbidden → 403
- Fix any incorrect status codes

TASK 3: Email Service Consolidation
- Find all email-sending code (search for: sendEmail, transporter, nodemailer, mailgun, sendgrid)
- Consolidate into a single emailService.js module
- Support: transactional emails, notification emails, marketing emails
- Add: retry logic, fallback provider, email queue
- Create reusable email templates (welcome, booking confirmation, password reset)

---

=== [9] CSV Sanitization + Upload Security + Health Endpoint (P1, S2) ===

You are a security engineer specializing in file upload and input validation.

TASK: Harden file uploads and fix information leakage.

TASK 1: CSV/Excel Upload Sanitization (productRoutes.js)
- Validate file extension: .csv, .xlsx only
- Validate MIME type: text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- Limit file size: 5MB max
- Parse ONLY expected columns (reject extra columns)
- Sanitize cell values (strip HTML, scripts, formulas starting with =)
- Limit number of rows: 1000 max per upload
- Return clear error messages for each validation failure

TASK 2: Upload Route Security (uploadRoutes.js)
- Add authentication middleware (require auth)
- Add admin role check for bulk uploads
- Whitelist allowed file types per upload type:
  - Images: jpg, jpeg, png, webp, gif (max 5MB)
  - Documents: pdf, doc, docx (max 10MB)
- Generate unique filenames (uuid + extension)
- Add virus scanning consideration (at minimum, validate file signatures)

TASK 3: Health Endpoint Protection (server.js)
- Restrict /health to internal requests only
- Check X-Vercel-Forwarded-For or Vercel-IP headers
- In production, return minimal info: { status: 'ok', timestamp }
- Remove: version, uptime, environment details
- Keep detailed health check for Vercel deploy checks (different endpoint)

---

=== [10] Layout Integration + 404 Page + Design System (P0, S3) ===

You are a senior frontend architect.

TASK: Fix 3 catastrophic UX issues that make the site look unfinished.

TASK 1: Integrate 9 Orphan Pages into Layout
These pages render WITHOUT the main layout (no header, footer, nav):
/about, /terms, /privacy, /help, /faq, /culture, /how-it-works, /affiliate, /partners/signup

REQUIREMENTS:
- Create a PublicLayout component if one doesn't exist (header + nav + footer + children)
- Wrap each orphan page in PublicLayout
- Ensure consistent styling across all pages
- Test responsive behavior on mobile

TASK 2: Create Custom 404 Page
- Design a beautiful 404 page matching the site's design language
- Include: friendly error message, search bar, popular links, back to home button
- Add proper SEO (title, meta description)
- Test by navigating to /nonexistent-page

TASK 3: Unify Design System
CURRENT STATE (inconsistent):
- Background colors: bg-gray-50, bg-slate-50, bg-white used randomly
- Primary color: green-700 in some places, primary-600 in others
- PartnerSignup page uses dark theme while rest is light
- Inconsistent spacing, border radius, shadow

REQUIREMENTS:
- Define Tailwind CSS custom properties in globals.css:
  --color-primary, --color-secondary, --color-accent
  --color-background, --color-surface, --color-border
- Create a design tokens file
- Standardize: one background, one primary color, one border style
- Fix PartnerSignup to use light theme (or make it consistent)
- Apply consistently across ALL pages

---

=== [11] Header + Footer + Mobile Nav i18n (P1, S3) ===

You are an i18n specialist for React applications.

TASK: Internationalize the main navigation components (Header, Footer, MobileNav).

CONTEXT:
- The app supports 4 languages: English (en), French (fr), Arabic (ar), Spanish (es)
- French is the default language
- i18n library is already set up (check for react-i18next, next-i18next, or custom solution)
- Current state: most UI text is hardcoded in French

REQUIREMENTS:

1. Header / Main Navigation:
- Extract all text strings to locale files (en.json, fr.json, ar.json, es.json)
- Navigation links, dropdowns, CTAs
- Language selector (if present)
- User menu items
- Search placeholder

2. Footer:
- Remove the FAKE Trustpilot badge ('4.4 rating | 292,570 reviews') - this is FABRICATED
- Replace with real social proof or remove entirely
- Extract all footer text to locale files
- Footer links, copyright, legal links
- Newsletter signup text

3. Mobile Navigation:
- Extract all mobile menu text
- Ensure hamburger menu label is translated
- Submenu items and section headers

4. Dashboard Sidebar:
- Extract all sidebar navigation labels
- Dashboard section names
- User role indicators

DELIVERABLES:
- Updated locale files with all new keys
- Updated components using useTranslation() or equivalent
- Tested in all 4 languages

---

=== [12] Legal + Support Pages i18n (Privacy, Help, BlogPost) (P1, S3) ===

You are an i18n specialist and legal content translator.

TASK: Translate Privacy Policy, Help, and BlogPost pages into 4 languages.

PAGES TO INTERNATIONALIZE:
1. Privacy Policy (/privacy) - FULL translation needed (legal content)
2. Help / Aide (/help) - FULL translation (support content, FAQ)
3. Blog Post (/blog/:slug) - UI labels only (content stays in original language)

REQUIREMENTS:

Privacy Policy:
- Translate the entire privacy policy content
- Legal terminology must be accurate in each language
- Dates, company name, and legal entities stay the same
- Contact information stays the same
- Consider hiring a legal translator for accuracy (flag this in comments)

Help Page:
- Translate FAQ questions and answers
- Translate contact form labels
- Translate support category names
- Keep phone numbers and emails unchanged

Blog Post:
- Translate UI elements: "Published on", "By", "Categories", "Share", "Related posts"
- Blog content (article body) stays in the author's original language
- Category tags should be translated
- "Read more" buttons, comments section labels

LOCALE FILE STRUCTURE:
- Use nested keys: privacy.title, privacy.content, help.faq.q1, etc.
- Keep all 4 locale files (en, fr, ar, es) in sync
- Arabic translations must be accurate (not machine-translated without review)

---

=== [13] Destination + Category + Partner + Affiliate i18n (P1, S3) ===

You are an i18n specialist for travel/e-commerce platforms.

TASK: Translate Destination, Category, Partner Signup, and Affiliate pages into 4 languages.

PAGES:
1. Destination Page (/destinations/:slug) - UI + content translation
2. Category Page (/categories/:slug) - UI + category names translation
3. Partner Signup (/partners/signup) - Full form translation
4. Affiliate Page (/affiliate) - Full page translation + FIX FABRICATED STATS

CRITICAL FIX - Affiliate Page (UX-03):
The affiliate page currently shows:
- "10M+ voyageurs" (the platform is MOROCCO-ONLY, this is FALSE)
- "150+ pays" (the platform operates in MOROCCO ONLY, this is FALSE)

REQUIREMENTS:
- Replace with ACCURATE statistics from the actual platform data
- If real stats are not available, use honest placeholders:
  "X+ voyages organisés au Maroc" 
  "X+ partenaires locaux vérifiés"
  "X+ destinations marocaines"
- This is a LEGAL COMPLIANCE issue (false advertising)

TRANSLATION REQUIREMENTS:
- City names: use local names + translated names (Marrakech/مراكش/Marrakech)
- Category names: translate (Excursions → Excursiones/رحلات/Excursions)
- Partner form: all labels, placeholders, validation messages, help text
- Affiliate page: all marketing copy, CTAs, commission info

ARABIC-SPECIFIC:
- Ensure text direction is correct (RTL)
- Use proper Arabic typography
- Numbers should use Arabic-Indic digits option

---

=== [14] SEO Fix: Canonical URLs + Manifest + Sitemap + Robots (P1, S3) ===

You are an SEO specialist for Next.js applications.

TASK: Fix 4 critical SEO issues.

ISSUE 1: Canonical URLs Point to Vercel Preview (UX-06)
- All pages have canonical URLs pointing to: overglow-v1-3jqp.vercel.app
- Google is indexing the PREVIEW URL instead of the production domain
- FIX:
  a. Set NEXT_PUBLIC_SITE_URL in .env to the production domain
  b. Use this variable in all Next.js Head components for canonical URLs
  c. Add og:url, og:image with absolute production URLs
  d. Ensure all internal links use relative paths (not hard-coded Vercel URLs)

ISSUE 2: Dynamic manifest.json (I18N-05)
- manifest.json has "dir": "ltr" hardcoded
- FIX:
  a. Convert manifest.json to a JS module (manifest.js)
  b. Generate dir based on active language
  c. Serve via API route or generate at build time for each language

ISSUE 3: Generate sitemap.xml
- No sitemap exists
- FIX:
  a. Create a script to generate sitemap.xml
  b. Include all public pages with proper lastmod, changefreq, priority
  c. Add hreflang alternates for each URL (en, fr, ar, es)
  d. Generate at build time

ISSUE 4: Create robots.txt
- No robots.txt exists
- FIX:
  a. Create robots.txt allowing all crawlers
  b. Add Sitemap: reference
  c. Disallow: /api/, /admin/, /dashboard/, /_next/
  d. Support different robots.txt per environment (allow more in staging)

---

=== [15] Checkout + Booking + Auth Flow i18n (P1, S3) ===

You are a full-stack i18n specialist for e-commerce/travel platforms.

TASK: Internationalize the complete booking and authentication flow. These are the HIGHEST CONVERSION pages.

PAGES TO TRANSLATE:
1. Checkout Page (/checkout) - CRITICAL for revenue
2. Booking Success (/booking-success) - Post-purchase confirmation
3. Login Page (/login) - User authentication
4. Register Page (/register) - User registration

CHECKOUT PAGE REQUIREMENTS:
- All form labels and placeholders
- Price display with currency symbol position (€10 vs 10€)
- Date/time picker labels
- Payment method names (PayPal, CMI/credit card, bank transfer)
- Error messages for each payment method
- "Terms and conditions" checkbox text
- Trust badges and security messaging
- Button text: "Pay Now", "Complete Booking", etc.
- Loading states during payment processing
- Error states: payment failed, insufficient funds, etc.

BOOKING SUCCESS REQUIREMENTS:
- Confirmation message
- Booking reference number label
- "What's next" instructions
- "Add to calendar" button
- "Download receipt" button
- "Return to dashboard" link
- Email confirmation notice

AUTH PAGES REQUIREMENTS:
- Form labels: email, password, confirm password, name, phone
- Validation messages for each field
- "Forgot password?" link
- "Don't have an account?" / "Already have an account?"
- Social login buttons (if any)
- Terms of service checkbox
- Password strength indicator text

CURRENCY FORMATTING:
- French: 10,00 € (comma decimal, space before symbol)
- English: €10.00 (period decimal, symbol before)
- Arabic: ١٠٫٠٠ د.م. (Arabic-Indic digits, MAD currency)
- Spanish: 10,00 € (comma decimal)

---

=== [16] RTL Infrastructure: tailwindcss-rtl + Logical Properties (P0, S4) ===

You are a CSS/bidirectional (BiDi) specialist.

TASK: Implement complete RTL (Right-to-Left) support for Arabic language.

CURRENT STATE:
- Arabic is 0% supported
- 30+ instances of mr-*/ml-* (margin-right/margin-left) will break in RTL
- No RTL plugin in Tailwind
- No logical CSS properties used
- manifest.json has "dir": "ltr" hardcoded
- index.html has lang="fr" hardcoded

STEP 1: Install and Configure tailwindcss-rtl
- npm install tailwindcss-rtl
- Add plugin to tailwind.config.js
- This adds 'rtl:' and 'ltr:' variants

STEP 2: Convert Physical to Logical Properties
Find and replace ALL instances:
- ml-* → ms-* (margin-inline-start)
- mr-* → me-* (margin-inline-end)
- pl-* → ps-* (padding-inline-start)
- pr-* → pe-* (padding-inline-end)
- left → inset-inline-start
- right → inset-inline-end
- text-left → text-start
- text-right → text-end
- border-l → border-s
- border-r → border-e
- rounded-l-* → rounded-s-*
- rounded-r-* → rounded-e-*

STEP 3: Fix Flexbox/Grid Direction
- flex-row in RTL should become flex-row-reverse
- Use 'rtl:flex-row-reverse' where needed
- Or better: use logical properties in CSS Grid

STEP 4: Dynamic HTML Attributes
- Make lang attribute dynamic based on selected language
- Make dir attribute dynamic (ltr for en/fr/es, rtl for ar)
- Update _document.jsx or equivalent

STEP 5: Manifest.json
- Generate manifest dynamically with correct "dir" value

---

=== [17] Complete All Translations (4 Languages) (P1, S4) ===

You are a professional translator and i18n engineer.

TASK: Complete ALL remaining translations for the 4 supported languages.

CURRENT COVERAGE: 10/51 pages (19.6%) translated

REQUIREMENTS:
1. Ensure ALL locale files have IDENTICAL key structures
2. Run a script to find missing keys in any locale
3. Translate all missing keys

QUALITY STANDARDS:
- Arabic: Use Modern Standard Arabic (MSA), not dialectal
- Spanish: Use neutral/Universal Spanish
- French: Already the primary language, verify completeness
- English: Use standard international English

AREAS TO CHECK:
- All form labels and validation messages
- All button text
- All navigation items
- All error/success messages
- All tooltip text
- All aria-labels (accessibility)
- All placeholder text
- All meta descriptions and titles
- Email templates (subject lines, body)
- Notification messages
- Date/time formatting
- Number formatting
- Currency formatting

DELIVERABLES:
- 4 complete locale files with zero missing keys
- A validation script that can be run to check completeness
- Documentation of any translation decisions made

---

=== [18] Console.log Cleanup + Structured Logger (P2, S4) ===

You are a DevOps engineer specializing in observability.

TASK: Clean up all console.log statements and implement a proper structured logger.

STEP 1: Audit console.log Usage
- Search for ALL console.log, console.warn, console.error, console.debug
- Categorize: debug info, important logs, error logs, leftover debug code
- Remove ALL leftover debug console.log statements

STEP 2: Create Structured Logger (utils/logger.js)
Features:
- Log levels: debug, info, warn, error, fatal
- Structured JSON output in production
- Human-readable colored output in development
- Timestamps (ISO 8601)
- Request ID tracking (for correlating logs across microservices)
- Module/file context
- Error stack traces (in error/fatal level only)
- Performance: use pino or winston (choose the lighter option)

STEP 3: Replace All Logging
- Replace console.log → logger.info
- Replace console.error → logger.error
- Replace console.warn → logger.warn
- Add request logging middleware in Express
- Add error logging in all catch blocks
- Ensure sensitive data is NEVER logged (passwords, tokens, card numbers)

STEP 4: ESLint Rules
- Add 'no-console': 'error' to ESLint config
- Add a custom rule to detect console usage in production code
- Configure to allow console in test files only

---

=== [19] HTML Sanitizer + Strict Mode + Currency Cache (P2, S4) ===

You are a full-stack security and performance engineer.

TASK: Implement three improvements.

TASK 1: HTML Sanitization
- Install DOMPurify: npm install dompurify @types/dompurify
- Create a sanitizer utility: utils/sanitizer.js
- Apply to ALL user-generated content before:
  a. Storing in MongoDB
  b. Rendering in React components
- Specifically sanitize:
  - Product descriptions
  - Blog post bodies (if user-editable)
  - User profiles (bio, name)
  - Inquiry messages
  - Chat messages
  - Review content
- Configure DOMPurify to allow safe tags only
- Strip all script, iframe, object, embed tags

TASK 2: React Strict Mode
- Enable <React.StrictMode> in pages/_app.jsx
- Fix any issues that StrictMode reveals:
  - Double renders in useEffect
  - Missing cleanup functions
  - Side effects in render

TASK 3: Currency Exchange Rate Cache
- Find the currency service/module
- Implement in-memory cache with 1-hour TTL
- Cache structure: Map<currencyPair, {rate, timestamp}>
- Add fallback rate if API is unavailable
- Log cache hits/misses for monitoring

---

=== [20] Payment Simulator Guard + Vercel Config Cleanup (P2, S4) ===

You are a DevOps and payment security engineer.

TASK: Secure the payment simulator and clean up deployment configuration.

TASK 1: Payment Simulator Guard
- Find the payment simulator/test mode code
- Add an environment variable: ENABLE_PAYMENT_SIM=false
- In production, the simulator should:
  a. Be completely disabled (return 403)
  b. Never process real-looking test payments
  c. Not appear in the UI
- Add startup validation: if ENABLE_PAYMENT_SIM=true in production, log a WARNING

TASK 2: Remove Duplicate vercel.json
- There's a vercel.json in both root/ and api/
- The api/vercel.json can cause conflicts
- Consolidate into a single vercel.json at the root
- Ensure all route configurations are preserved

TASK 3: Render-Blocking CSS Optimization
- Identify CSS that blocks initial page render
- Move non-critical CSS to dynamic imports
- Use Next.js built-in CSS optimization
- Check for large inline styles
- Optimize font loading (use font-display: swap)
- Critical CSS should be inlined, rest should be lazy-loaded

TASK 4: robots.txt + Sitemap Finalization
- Ensure robots.txt is served correctly
- Verify sitemap.xml is accessible at /sitemap.xml
- Add sitemap reference in robots.txt
- Test with Google Search Console's URL Inspection tool

---

=== [21] Final Audit: Security + Quality + Performance (P2, S4) ===

You are a senior QA engineer conducting a final pre-launch audit.

TASK: Run a comprehensive audit across security, quality, and performance.

SECURITY AUDIT:
1. Run 'npm audit' and fix all HIGH/CRITICAL vulnerabilities
2. Verify no .env files or secrets are in git history
3. Test all authentication flows:
   - Login with valid/invalid credentials
   - Registration with duplicate email
   - Password reset flow
   - Token expiration handling
4. Test authorization:
   - Regular user cannot access admin routes
   - Admin can access admin routes
   - Unauthenticated users are redirected to login
5. Test input validation on all forms
6. Verify CORS headers are correct
7. Test file upload security

CODE QUALITY AUDIT:
1. Run ESLint with zero errors
2. Check TypeScript strict mode (if applicable)
3. Verify all async functions have error handling
4. Check for memory leaks (event listeners, timers)
5. Verify no console.log in production code
6. Check for hardcoded values that should be configurable

PERFORMANCE AUDIT:
1. Run Lighthouse (mobile + desktop):
   - Performance score > 90
   - Accessibility score > 90
   - Best Practices > 90
   - SEO > 90
2. Check bundle size (should be < 200KB first load JS)
3. Verify images are optimized (WebP, lazy loading)
4. Check for render-blocking resources
5. Verify API response times < 200ms for simple queries

DELIVERABLE:
- Audit report with pass/fail for each check
- List of remaining issues with severity
- Recommended go/no-go decision

---

=== [22] AI Chat Message Flagging + Legal Compliance (P0, S2) ===

You are a legal tech engineer.

TASK: Fix the AI message attribution issue (SEC-08) and add legal compliance.

ISSUE: chatController.js:209-211
- AI-generated messages are saved as if the user wrote them
- No isAI flag to distinguish AI from human messages
- LEGAL RISK: The user didn't say those things, but the system attributes it to them

REQUIREMENTS:
1. Database: Add isAI: Boolean field to Message schema (default: false)
2. Backend: Set isAI: true when saving AI-generated responses
3. Frontend: Display AI messages with:
   - A different visual style (slightly different background)
   - An "AI Assistant" badge/label
   - A disclaimer: "This response was generated by AI and may not be accurate"
4. Legal:
   - Add a Terms of Service clause about AI-generated content
   - Add a checkbox for users to acknowledge AI is used
   - Consider GDPR implications (automated decision-making disclosure)
5. Chat Controller:
   - Add metadata to AI responses: model, timestamp, confidence
   - Log AI interactions for quality monitoring

---

=== [23] Settings Allowlist + Health Endpoint + DB Diagnostics (P1, S2) ===

You are a backend security and reliability engineer.

TASK: Implement three backend improvements.

TASK 1: User Settings Allowlist
- Create a whitelist of user-updatable fields per role
- Regular user can update: name, email, phone, password, preferences, avatar
- Regular user CANNOT update: role, isAdmin, isVerified, createdAt, _id
- Admin can update additional fields but NEVER: _id, passwordHash
- Apply in a middleware before any user update operation

TASK 2: Database Diagnostics at Startup
- On server start, run diagnostic checks:
  a. Test MongoDB connection (ping)
  b. Check all required collections exist
  c. Verify indexes are created (list all indexes)
  d. Check database size and document counts
  e. Test a simple read operation
- Log results clearly
- If critical checks fail, exit with code 1 (prevent deploy)

TASK 3: FAQ Admin Route Protection
- Add authentication and admin role check to FAQ CRUD routes
- Routes: POST/PUT/DELETE /api/faqs
- GET /api/faqs can remain public
- Add rate limiting specific to FAQ admin routes

---

=== [24] Duplicate Image Fix + Content Authenticity Audit (P1, S3) ===

You are a content and UX specialist for travel platforms.

TASK: Fix content authenticity issues across the platform.

ISSUE 1: Duplicate City Images (UX-05)
4 out of 6 cities share the SAME Unsplash image:
- Marrakech, Fès, Chefchaouen, Essaouira → same "medina" photo
- This is unacceptable for a travel platform

FIX:
- Source unique, high-quality images for each city
- Use local Moroccan photographers (stock photos or Creative Commons)
- Recommended sources: Unsplash (search Morocco + city name), Pexels, or local photographers
- Minimum 3 images per city (hero, gallery thumbnail, card)
- Optimize: WebP format, lazy loading, responsive sizes
- Update alt text in both French and English

ISSUE 2: Content Authenticity Audit
- Audit ALL statistics and claims on the site
- Flag any potentially exaggerated or unverified claims
- Create a content verification checklist:
  [ ] All statistics have a verifiable source
  [ ] All partner logos are authorized
  [ ] All testimonials are from real customers (with permission)
  [ ] All pricing is current and accurate
  [ ] All destination descriptions are factually correct
  [ ] Trustpilot/review badges link to actual profiles
- Fix or remove any unverifiable content