#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# backup.sh — Backup diario PostgreSQL → DigitalOcean Spaces
# Cron: 0 2 * * * /opt/clinica/scripts/backup.sh >> /var/log/clinica-backup.log 2>&1
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Configuración ─────────────────────────────────────────────────────────────
DB_NAME="${CLINICA_DB_NAME:-clinica_db}"
DB_USER="${CLINICA_DB_USER:-postgres}"
DB_HOST="${CLINICA_DB_HOST:-localhost}"
DB_PORT="${CLINICA_DB_PORT:-5432}"

SPACES_BUCKET="${DO_SPACES_BUCKET:-clinica-backups}"
SPACES_REGION="${DO_SPACES_REGION:-nyc3}"
SPACES_KEY="${DO_SPACES_KEY}"
SPACES_SECRET="${DO_SPACES_SECRET}"

BACKUP_DIR="/tmp/clinica-backups"
RETENTION_DAYS=30
DATE=$(date +%Y-%m-%d_%H-%M-%S)
FILENAME="backup_${DB_NAME}_${DATE}.sql.gz"

# ── Validar dependencias ───────────────────────────────────────────────────────
for cmd in pg_dump gzip s3cmd; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "[ERROR] Comando no encontrado: $cmd"
    exit 1
  fi
done

# ── Crear directorio temporal ─────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

echo "[$DATE] Iniciando backup de $DB_NAME..."

# ── Dump + compresión ──────────────────────────────────────────────────────────
PGPASSWORD="${CLINICA_DB_PASSWORD}" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-owner \
  --no-acl \
  --format=plain \
  | gzip -9 > "${BACKUP_DIR}/${FILENAME}"

SIZE=$(du -sh "${BACKUP_DIR}/${FILENAME}" | cut -f1)
echo "  Archivo: $FILENAME ($SIZE)"

# ── Subir a DigitalOcean Spaces ───────────────────────────────────────────────
s3cmd put \
  --access_key="$SPACES_KEY" \
  --secret_key="$SPACES_SECRET" \
  --host="${SPACES_REGION}.digitaloceanspaces.com" \
  --host-bucket="%(bucket)s.${SPACES_REGION}.digitaloceanspaces.com" \
  --no-ssl-certificate-check \
  "${BACKUP_DIR}/${FILENAME}" \
  "s3://${SPACES_BUCKET}/backups/${FILENAME}"

echo "  Subido a Spaces: s3://${SPACES_BUCKET}/backups/${FILENAME}"

# ── Eliminar backups locales ───────────────────────────────────────────────────
rm -f "${BACKUP_DIR}/${FILENAME}"

# ── Eliminar backups remotos con más de RETENTION_DAYS días ───────────────────
CUTOFF=$(date -d "-${RETENTION_DAYS} days" +%Y-%m-%d 2>/dev/null || date -v-${RETENTION_DAYS}d +%Y-%m-%d)
echo "  Limpiando backups anteriores a $CUTOFF..."

s3cmd ls \
  --access_key="$SPACES_KEY" \
  --secret_key="$SPACES_SECRET" \
  --host="${SPACES_REGION}.digitaloceanspaces.com" \
  --host-bucket="%(bucket)s.${SPACES_REGION}.digitaloceanspaces.com" \
  "s3://${SPACES_BUCKET}/backups/" \
  | awk '{print $4}' \
  | while read -r file; do
      file_date=$(echo "$file" | grep -oP '\d{4}-\d{2}-\d{2}' | head -1)
      if [[ -n "$file_date" && "$file_date" < "$CUTOFF" ]]; then
        s3cmd del \
          --access_key="$SPACES_KEY" \
          --secret_key="$SPACES_SECRET" \
          --host="${SPACES_REGION}.digitaloceanspaces.com" \
          --host-bucket="%(bucket)s.${SPACES_REGION}.digitaloceanspaces.com" \
          "$file"
        echo "  Eliminado: $file"
      fi
    done

echo "[$DATE] Backup completado exitosamente."
