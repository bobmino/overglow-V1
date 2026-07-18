#!/usr/bin/env bash
# Backup quotidien Mongo + volume uploads — à installer sur le VPS.
# Cron example (root):
#   15 3 * * * /root/overglow-V1/deploy/backup-overglow.sh >> /var/log/overglow-backup.log 2>&1

set -euo pipefail

APP_DIR="${APP_DIR:-/root/overglow-V1}"
BACKUP_ROOT="${BACKUP_ROOT:-/root/backups/overglow}"
KEEP_DAYS="${KEEP_DAYS:-7}"
STAMP="$(date +%Y%m%d_%H%M%S)"
DEST="${BACKUP_ROOT}/${STAMP}"

mkdir -p "${DEST}"

cd "${APP_DIR}"

# Mongo dump depuis le conteneur
docker compose exec -T mongo mongodump --db=overglow --archive > "${DEST}/mongo-overglow.archive"

# Volume uploads (Docker named volume)
UPLOADS_VOL="$(docker volume ls -q | grep -E 'uploads_data$' | head -n1 || true)"
if [[ -n "${UPLOADS_VOL}" ]]; then
  docker run --rm -v "${UPLOADS_VOL}:/data:ro" -v "${DEST}:/out" alpine \
    tar czf "/out/uploads.tar.gz" -C /data .
else
  echo "WARN: uploads volume not found" >&2
fi

# Rétention
find "${BACKUP_ROOT}" -mindepth 1 -maxdepth 1 -type d -mtime +"${KEEP_DAYS}" -exec rm -rf {} +

echo "OK backup ${DEST}"
ls -lh "${DEST}"
