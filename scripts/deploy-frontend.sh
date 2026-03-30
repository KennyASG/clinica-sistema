#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy-frontend.sh — Build Vite + sync a DigitalOcean Spaces CDN
#
# Uso: ./scripts/deploy-frontend.sh [--prod]
# Variables requeridas en el entorno (o en .env.production):
#   VITE_API_URL        — URL base de la API  (ej: https://tu-dominio.gt/api)
#   DO_SPACES_KEY       — Access key de DO Spaces
#   DO_SPACES_SECRET    — Secret key de DO Spaces
#   DO_SPACES_REGION    — Región  (ej: nyc3)
#   DO_SPACES_BUCKET    — Nombre del bucket  (ej: clinica-frontend)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

FRONTEND_DIR="$(cd "$(dirname "$0")/../frontend" && pwd)"
DIST_DIR="$FRONTEND_DIR/dist"

# ── Cargar .env.production si existe ─────────────────────────────────────────
if [[ -f "$FRONTEND_DIR/.env.production" ]]; then
  set -a; source "$FRONTEND_DIR/.env.production"; set +a
fi

echo "▶ Build del frontend..."
cd "$FRONTEND_DIR"
npm run build

echo "▶ Sincronizando con DO Spaces (s3://${DO_SPACES_BUCKET})..."

# Subir assets con hash — cache largo (1 año)
s3cmd sync \
  --access_key="$DO_SPACES_KEY" \
  --secret_key="$DO_SPACES_SECRET" \
  --host="${DO_SPACES_REGION}.digitaloceanspaces.com" \
  --host-bucket="%(bucket)s.${DO_SPACES_REGION}.digitaloceanspaces.com" \
  --acl-public \
  --add-header="Cache-Control:public, max-age=31536000, immutable" \
  --exclude="index.html" \
  --exclude="*.json" \
  "$DIST_DIR/" \
  "s3://${DO_SPACES_BUCKET}/"

# Subir index.html y JSON — sin cache (siempre fresco)
s3cmd sync \
  --access_key="$DO_SPACES_KEY" \
  --secret_key="$DO_SPACES_SECRET" \
  --host="${DO_SPACES_REGION}.digitaloceanspaces.com" \
  --host-bucket="%(bucket)s.${DO_SPACES_REGION}.digitaloceanspaces.com" \
  --acl-public \
  --add-header="Cache-Control:no-cache, no-store, must-revalidate" \
  --include="index.html" \
  --include="*.json" \
  "$DIST_DIR/" \
  "s3://${DO_SPACES_BUCKET}/"

echo "✓ Frontend desplegado en https://${DO_SPACES_BUCKET}.${DO_SPACES_REGION}.cdn.digitaloceanspaces.com"
