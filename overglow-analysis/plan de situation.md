# Plan de situation — Overglow Trip V1

**Date:** 2026-07-18  
**Branche:** `main`  
**Verdict:** Soft-launch code + BO UX P0 + **docs/rules alignés**

---

## Point d’entrée docs

| Doc | Rôle |
|-----|------|
| [playbook/OVERGLOW-PLAYBOOK.md](./playbook/OVERGLOW-PLAYBOOK.md) | Master playbook (remplace le pack Desktop fantôme) |
| [BACKOFFICE-UX-AUDIT.md](./BACKOFFICE-UX-AUDIT.md) | UX back-office direction |
| `.cursor/rules/*.mdc` | Règles agents Cursor (vérité V1) |

Le pack `Desktop/zip/*.md` d’origine n’est **pas** la source de vérité — versions réécrites dans `playbook/`.

---

## Décisions métier (hors code)

- Stripe / PayPal / CMI **live** : activer quand comptes prêts  
- 5–10 expériences réelles + opérateur en DB  
- Pages légales avocat  

---

## Livré code

| Domaine | Status |
|--------|--------|
| CMS seed blog + FAQ | Fait |
| BO menus + UX P0 (badges, edit produits/opérateurs, FAQ CRUD) | Fait |
| Avis / annulation 100 % DB | Fait |
| Footer / contenu honnête | Fait |
| Alignement `.mdc` + playbook | Fait (2026-07-18) |

---

## Post-deploy

1. Smoke UI admin + `/fr/blog` + `/fr/faq`  
2. `npm run seed:cms` prod si vide  
3. Env paiements / Sentry quand prêts  
