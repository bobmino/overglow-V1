# Plan de situation — Overglow Trip V1

**Date:** 2026-07-18  
**Branche:** `main`  
**Verdict:** Soft-launch ops live ; BO MAD/peau + catalogue 8 produits prod + harden deploy

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
| Resend SMTP | Fait (clé rotée) |
| Seed catalogue Maroc (`npm run seed:catalog`) | Fait en prod (8 produits, opérateur Active) |
| Backup cron Mongo/uploads | Installé + test OK (cron 03:15 → `/root/backups/overglow/`) |
| Certbot renew hooks | Installés + `certbot renew --dry-run` OK |
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

## Accès soft-launch

| Compte | Email | Note |
|--------|-------|------|
| Admin | `admin@overglow.online` | Changer le mdp après soft-launch |
| Opérateur seed | `partenaire@overglow.online` | Compte catalogue démo |

## Ops manuels restants

1. Changer mdp admin (et partenaire seed) en prod
2. Si 502 / stack down : Actions → **Deploy VPS**, ou sur VPS :
   `cd ~/overglow-V1 && git fetch && git reset --hard origin/main && docker compose up -d --build && bash deploy/post-deploy-harden.sh`
3. Remplacer images Unsplash seed par uploads locaux `/uploads/...` quand contenu réel prêt
