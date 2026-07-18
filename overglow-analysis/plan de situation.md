# Plan de situation — Overglow Trip V1

**Date:** 2026-07-18  
**Branche:** `main`  
**Verdict:** Soft-launch ops live ; peau BO + catalogue seed prêts

---

## Point d’entrée docs

| Doc | Rôle |
|-----|------|
| [playbook/OVERGLOW-PLAYBOOK.md](./playbook/OVERGLOW-PLAYBOOK.md) | Master playbook |
| [playbook/10-WAVE3-GOLIVE.md](./playbook/10-WAVE3-GOLIVE.md) | DNS + secrets + smoke |
| [deploy/OPS-VPS.md](../deploy/OPS-VPS.md) | Backup, Certbot, Resend, seed catalogue |
| [BACKOFFICE-UX-AUDIT.md](./BACKOFFICE-UX-AUDIT.md) | UX back-office |
| `.cursor/rules/*.mdc` | Règles agents |

---

## Décisions figées

| Sujet | Décision |
|-------|----------|
| Domaine | `https://www.overglow.online` |
| Infra | VPS Docker (api + web + mongo + uploads) |
| Médias | `STORAGE_DRIVER=local` |
| Mail | Resend SMTP (`noreply@overglow.online`) |
| Paiements | Différés jusqu’aux comptes |
| CI/CD | GitHub Actions Deploy VPS (clé SSH en base64) |

---

## Wave 3 ops — statut

| Item | Status |
|------|--------|
| DNS A @ + www → VPS | Fait |
| TLS Let’s Encrypt | Fait |
| CI/CD Deploy | Fait |
| Admin + seed CMS FAQ/blog | Fait |
| Resend SMTP | Fait (rotater clé si exposée) |
| Seed catalogue Maroc (`npm run seed:catalog`) | Prêt — à lancer sur VPS |
| Backup cron Mongo/uploads | Scripts dans `deploy/` — à installer |
| Certbot renew hooks | Scripts dans `deploy/` — à installer |
| Paiements live | Reporté (différé assumé) |
| Audit Fable | Non prévu |

---

## Code récent

| Domaine | Status |
|--------|--------|
| BO MAD + surface-card + titres shell i18n | Fait |
| Onboarding 3 étapes / LocalizedLink / FAQ | Fait |
| Uploads locaux + Docker | Fait |

---

## Prochaines commandes VPS

```bash
cd ~/overglow-V1 && git pull
docker compose up -d --build
docker compose exec api node -r dotenv/config scripts/seedMoroccoCatalog.js
# puis install backup + certbot hooks — voir deploy/OPS-VPS.md
```
