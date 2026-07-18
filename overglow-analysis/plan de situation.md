# Plan de situation — Overglow Trip V1

**Date:** 2026-07-18  
**Branche:** `main`  
**Verdict:** Finalisation souveraineté + UX marché en cours / livrée en repo

---

## Point d’entrée docs

| Doc | Rôle |
|-----|------|
| [playbook/OVERGLOW-PLAYBOOK.md](./playbook/OVERGLOW-PLAYBOOK.md) | Master playbook |
| [playbook/10-WAVE3-GOLIVE.md](./playbook/10-WAVE3-GOLIVE.md) | DNS + secrets + smoke |
| [playbook/09-MAIL-DNS.md](./playbook/09-MAIL-DNS.md) | SMTP + SPF/DKIM |
| [BACKOFFICE-UX-AUDIT.md](./BACKOFFICE-UX-AUDIT.md) | UX back-office |
| `.cursor/rules/*.mdc` | Règles agents |

---

## Décisions figées

| Sujet | Décision |
|-------|----------|
| Domaine | `https://www.overglow.online` |
| Infra | VPS Docker (api + web + mongo + uploads) |
| Médias | `STORAGE_DRIVER=local` — pas Cloudinary |
| Paiements | Différés jusqu’aux comptes ; checklist Wave 3 |
| CI/CD | GitHub Actions `ci.yml` + `deploy.yml` |

---

## Livré code (waves 0–2)

| Domaine | Status |
|--------|--------|
| Playbook souveraineté | Fait |
| Docker Compose + nginx + Dockerfiles | Fait |
| Uploads disque `/uploads` | Fait |
| CI + deploy SSH | Fait (secrets VPS à configurer) |
| SMTP notes + EMAIL_FROM | Fait |
| Charte tokens + LocalizedLink + CTA retour | Fait |
| Onboarding 3 étapes dans shell | Fait |
| BO skin (shell + dashboard) | Fait (peau) |
| FAQ enrichies + Help/FAQ i18n | Fait |

---

## Wave 3 (ops — hors repo)

1. DNS `overglow.online` → VPS  
2. Secrets prod en bloc  
3. Seed CMS + produits réels  
4. Paiements live **si** comptes OK  
5. Smoke HTTPS + upload + BO  
6. (Optionnel) audit Fable sur staging  

Voir [playbook/10-WAVE3-GOLIVE.md](./playbook/10-WAVE3-GOLIVE.md).
