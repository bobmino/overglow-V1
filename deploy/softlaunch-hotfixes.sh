#!/bin/bash
set -euo pipefail
cd ~/overglow-V1
git pull origin main
docker compose up -d --build
# Nginx proxy cache l'IP Docker de web — obligatoire après recreate web
docker compose restart proxy
docker compose exec -T api node -r dotenv/config scripts/seedMoroccoCatalog.js
docker compose restart api
echo "DEPLOY_OK"
