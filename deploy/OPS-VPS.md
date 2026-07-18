# Ops VPS — backups, Certbot, Resend

## Rotation clé Resend

1. Resend → API Keys → revoke ancienne → créer nouvelle  
2. Sur VPS :

```bash
cd ~/overglow-V1
# éditer EMAIL_PASS= et RESEND_API_KEY= (guillemets sur EMAIL_FROM)
nano .env
docker compose up -d --force-recreate api
docker compose logs api --tail 20 | grep -i email
```

## Backup quotidien

```bash
cd ~/overglow-V1
chmod +x deploy/backup-overglow.sh
mkdir -p /root/backups/overglow
# test
./deploy/backup-overglow.sh
# cron
crontab -e
# ajouter :
# 15 3 * * * /root/overglow-V1/deploy/backup-overglow.sh >> /var/log/overglow-backup.log 2>&1
```

## Certbot renew + proxy Docker

```bash
# Pref-hook : libérer :80
sudo tee /etc/letsencrypt/renewal-hooks/pre/overglow-stop-proxy.sh >/dev/null <<'EOF'
#!/bin/bash
cd /root/overglow-V1 && docker compose stop proxy
EOF
sudo chmod +x /etc/letsencrypt/renewal-hooks/pre/overglow-stop-proxy.sh

# Deploy-hook : relancer proxy
sudo cp /root/overglow-V1/deploy/certbot-renew-hook.sh \
  /etc/letsencrypt/renewal-hooks/deploy/overglow-reload.sh
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/overglow-reload.sh

sudo certbot renew --dry-run
```

## Seed catalogue Maroc

```bash
cd ~/overglow-V1
docker compose exec api node -r dotenv/config scripts/seedMoroccoCatalog.js
# Smoke: https://www.overglow.online/fr/search
```
