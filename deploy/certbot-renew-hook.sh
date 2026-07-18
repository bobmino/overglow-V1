#!/usr/bin/env bash
# Renew Let's Encrypt then reload Docker nginx proxy.
# Install:
#   sudo cp deploy/certbot-renew-hook.sh /etc/letsencrypt/renewal-hooks/deploy/overglow-reload.sh
#   sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/overglow-reload.sh
# Test:
#   sudo certbot renew --dry-run
#
# Pref-hook (stop proxy for standalone renewals) — /etc/letsencrypt/renewal-hooks/pre/overglow-stop-proxy.sh :
#   #!/bin/bash
#   cd /root/overglow-V1 && docker compose stop proxy

set -euo pipefail
APP_DIR="${APP_DIR:-/root/overglow-V1}"
cd "${APP_DIR}"
docker compose up -d proxy
docker compose exec -T proxy nginx -s reload || docker compose restart proxy
echo "Proxy reloaded after cert renew"
