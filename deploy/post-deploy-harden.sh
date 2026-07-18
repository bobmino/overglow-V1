#!/usr/bin/env bash
# Post-deploy VPS : seed catalogue (idempotent) + cron backup + hooks Certbot.
# Appelé par GitHub Actions Deploy, ou manuellement :
#   bash deploy/post-deploy-harden.sh

set -euo pipefail

APP_DIR="${APP_DIR:-/root/overglow-V1}"
cd "${APP_DIR}"

chmod +x deploy/backup-overglow.sh deploy/certbot-renew-hook.sh deploy/post-deploy-harden.sh 2>/dev/null || true

echo "==> Seed catalogue Maroc (idempotent)"
docker compose exec -T api node -r dotenv/config scripts/seedMoroccoCatalog.js

echo "==> Cron backup (si absent)"
mkdir -p /root/backups/overglow
CRON_LINE="15 3 * * * ${APP_DIR}/deploy/backup-overglow.sh >> /var/log/overglow-backup.log 2>&1"
if crontab -l 2>/dev/null | grep -qF 'backup-overglow.sh'; then
  echo "Cron backup déjà présent"
else
  (crontab -l 2>/dev/null || true; echo "${CRON_LINE}") | crontab -
  echo "Cron backup installé : 03:15 quotidien"
fi

echo "==> Hooks Certbot renew"
mkdir -p /etc/letsencrypt/renewal-hooks/pre /etc/letsencrypt/renewal-hooks/deploy

cat > /etc/letsencrypt/renewal-hooks/pre/overglow-stop-proxy.sh <<PRE
#!/bin/bash
cd ${APP_DIR} && docker compose stop proxy
PRE
chmod +x /etc/letsencrypt/renewal-hooks/pre/overglow-stop-proxy.sh

cp -f "${APP_DIR}/deploy/certbot-renew-hook.sh" \
  /etc/letsencrypt/renewal-hooks/deploy/overglow-reload.sh
chmod +x /etc/letsencrypt/renewal-hooks/deploy/overglow-reload.sh

echo "==> Smoke produits (via conteneur api)"
COUNT="$(docker compose exec -T api node -e "
fetch('http://127.0.0.1:5001/api/products?limit=20')
  .then(r => r.json())
  .then(j => {
    const n = Array.isArray(j) ? j.length : (j.products || j.data || []).length;
    console.log(n);
  })
  .catch(e => { console.error(e); process.exit(1); });
" 2>/dev/null | tr -d '\r' | tail -n1 || echo 0)"
echo "Produits visibles API: ${COUNT}"

echo "OK post-deploy-harden (certbot dry-run: voir deploy/OPS-VPS.md)"
