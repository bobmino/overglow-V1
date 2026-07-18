# 11 — Charte & tokens UI

## Tokens (`frontend/src/index.css`)

| Token | Usage |
|-------|--------|
| `--color-primary` `#059669` | CTA, liens, focus |
| `--color-background` | Fond pages (`page-shell`) |
| `--color-surface` | Cartes (`surface-card`) |
| Outfit | Titres (`font-heading`) |
| Inter | Corps |

## Classes utilitaires

- `page-shell` — fond page
- `surface-card` — carte interaction / contenu
- `btn-primary` / `btn-secondary`

## BO

Sidebar slate OK ; contenu = mêmes surfaces/boutons que le public. Devises catalogue en **MAD**.

## Anti-patterns

- Gradients cyan hors brand
- Coques `bg-gray-50` legacy sur pages clés
- `Link` RR sans `LocalizedLink` sur routes publiques i18n
