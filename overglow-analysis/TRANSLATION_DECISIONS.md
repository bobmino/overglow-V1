# Translation decisions — Overglow Trip (task [17])

## Locale parity
- Source of truth: `frontend/public/locales/fr/translation.json`
- EN / ES / AR must mirror the same key tree
- Validation: `node scripts/validateLocales.js`

## Language standards
| Lang | Standard | Notes |
|------|----------|-------|
| FR | Français (Maroc / international) | Primary product language |
| EN | International English | Neutral spelling |
| ES | Neutral / Latin American–friendly Spanish | Avoid strong regionalisms |
| AR | Modern Standard Arabic (MSA) | UI labels in MSA; spoken Darija is not used in product copy |

## Brand / non-translated tokens
Left identical across locales on purpose:
- Brand: Overglow, Overglow-Trip, Overglow Partners
- Payment brands: PayPal, CMI, Visa, Mastercard, Stripe
- Codes: IBAN, SWIFT, MAD, EUR, WhatsApp
- Stats placeholders like `6+`, `50+`, `100%`, `0€`

## Scope for v1 traveler UI
Fully i18n’d public / account flows include: home/search/catalog chrome, legal, help, blog UI, destinations/categories, partner/affiliate, checkout/auth, favorites, history, circuit, tags, loyalty teaser, traveler dashboard bookings.

## Admin / operator consoles
Operator and admin back-offices remain **French-first** for v1 (ops language). Shared keys live under `admin.common.*` for progressive migration. Not a legal/compliance gap for travelers.

## Currency & dates
- Prices: `Intl.NumberFormat` via `CurrencyContext` (locale from i18n)
- Dates: `fr-FR` / `en-GB` / `es-ES` / `ar-MA`
