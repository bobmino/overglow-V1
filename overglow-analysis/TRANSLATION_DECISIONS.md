# Translation decisions — Overglow Trip

## Locale parity
- Source of truth: `frontend/public/locales/fr/translation.json`
- EN / ES / AR must mirror the **same key tree** (including admin & operator)
- Validation: `node scripts/validateLocales.js` or `npm run i18n:validate` (frontend)

## Language standards
| Lang | Standard | Notes |
|------|----------|-------|
| FR | Français (Maroc / international) | Primary product language for copy authoring |
| EN | International English | Neutral spelling |
| ES | Neutral Spanish | Avoid strong regionalisms |
| AR | Modern Standard Arabic (MSA) | UI labels in MSA (not Darija dialect) |

## Brand / non-translated tokens
Left identical across locales on purpose:
- Brand: Overglow, Overglow-Trip, Overglow Partners
- Payment brands: PayPal, CMI, Visa, Mastercard, Stripe
- Codes: IBAN, SWIFT, MAD, EUR, WhatsApp
- Numeric placeholders like `6+`, `50+`, `100%`, `0€`

## Scope — all surfaces, all languages
**Traveler, partner/affiliate, admin, and operator UIs** must be available in FR, EN, ES, and AR.
There is no “French-only” back-office: operators and admins can switch language like any other user.

Namespaces:
- Public / account: `header`, `footer`, `auth`, `checkout`, `dashboard`, `profile`, …
- Admin: `admin.*` (e.g. `admin.common`, `admin.dashboard`, `admin.products`, …)
- Operator: `operator.*` (e.g. `operator.common`, `operator.dashboard`, …)

## Currency & dates
- Prices: `Intl.NumberFormat` via `CurrencyContext` (locale from i18n)
- Dates: `fr-FR` / `en-GB` / `es-ES` / `ar-MA`
