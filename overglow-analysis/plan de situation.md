# Plan de situation — Overglow Trip V1

**Date:** 2026-07-18  
**Branche:** `main`  
**Verdict:** Soft-launch ops live — on ratisse L3→L4 jusqu’au Done  
**Vision focale :** canvas `overglow-softlaunch-zoom` (L0→L5)

---

## Décisions figées

| Sujet | Décision |
|-------|----------|
| Domaine | `https://www.overglow.online` **uniquement** |
| Marque Overcom | **Hors scope** — projet agence plus tard ; `overcom.online` ignoré |
| Infra | VPS Docker (api + web + mongo rs0 + uploads) |
| Médias | `STORAGE_DRIVER=local` |
| Mail | Resend SMTP (`noreply@overglow.online`) |
| Paiements | Différés jusqu’aux comptes |
| CI/CD | GitHub Actions Deploy VPS |

---

## Zoom L0 → L5 (ordre d’exécution)

| Niveau | Focus | État |
|--------|-------|------|
| **L0** Marque | `overglow.online` only | **Fait** |
| **L1** Infra | DNS TLS Docker CI backup Certbot Mongo rs0 | **Fait** |
| **L2** Catalogue | 8 produits MAD + images cities + schedules | **Fait** |
| **L3** Smoke critique | Upload · AR RTL · booking UI · mdp | **Fait** |
| **L4** Conformité | CGU / Privacy avocat | **À toi** |
| **L5** Post-launch | Photos métier · PSP live · Sentry | **Différé** |

### File L3 (clos)

1. ~~Smoke upload~~ — fait
2. ~~Smoke AR RTL `/ar`~~ — fait
3. ~~Smoke UI booking → `/booking-success`~~ — fait (350 MAD, espèces)
4. ~~Rotation mdp admin + partenaire~~ — fait (nouveaux mdp communiqués)

### Critère Done soft-launch

HTTPS `overglow.online` · stack VPS · catalogue + booking différé · upload local OK · BO utilisable · légal OK ou disclaimer · paiements live **ou** différé documenté.

---

## Point d’entrée docs

| Doc | Rôle |
|-----|------|
| [playbook/OVERGLOW-PLAYBOOK.md](./playbook/OVERGLOW-PLAYBOOK.md) | Master playbook |
| [playbook/10-WAVE3-GOLIVE.md](./playbook/10-WAVE3-GOLIVE.md) | DNS + secrets + smoke |
| [deploy/OPS-VPS.md](../deploy/OPS-VPS.md) | Backup, Certbot, Resend, seed |
| Canvas IDE `overglow-softlaunch-zoom` | Zoom L0→L5 live |

---

## Soft-launch vérifié

| Check | Résultat |
|-------|----------|
| Domaine `www.overglow.online` | OK |
| Images `/images/cities/*` | 8/8 HTTP 200 |
| Mongo `rs0` + TX | OK |
| Booking API différé + TX | 201 `PENDING_PAYMENT` |
| Upload local `/uploads/*` | **OK** smoke + HTTPS 200 WebP |
| Homepage catalogue | OK |

---

## Accès

| Compte | Email | Note |
|--------|-------|------|
| Admin | `admin@overglow.online` | **Changer mdp** |
| Opérateur | `partenaire@overglow.online` | **Changer mdp** |

## Ops recovery

```bash
cd ~/overglow-V1 && git fetch && git reset --hard origin/main \
  && docker compose up -d --build && bash deploy/post-deploy-harden.sh
```
