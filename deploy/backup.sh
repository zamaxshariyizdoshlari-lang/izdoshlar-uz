#!/usr/bin/env bash
# Kundalik zaxira: PostgreSQL bazasi + yuklangan rasmlar. Cron bilan ishga tushiring (crontab.example).
# Zaxirani serverning oʻzida emas, boshqa joyga ham nusxalang (rclone, rsync yoki S3) !
set -euo pipefail

APP_DIR="${APP_DIR:-/srv/izdoshlar/backend}"
BACKUP_DIR="${BACKUP_DIR:-/srv/izdoshlar/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"

# .env dan DATABASE_URL ni oʻqiymiz (qiymatni logga chiqarmaymiz)
set -a
# shellcheck disable=SC1091
. "$APP_DIR/.env"
set +a

mkdir -p "$BACKUP_DIR"
stamp="$(date +%Y%m%d-%H%M%S)"

if [[ -n "${DATABASE_URL:-}" ]]; then
  pg_dump "$DATABASE_URL" --format=custom --file="$BACKUP_DIR/db-$stamp.dump"
else
  # SQLite (faqat sinov muhiti uchun)
  sqlite3 "$APP_DIR/db.sqlite3" ".backup '$BACKUP_DIR/db-$stamp.sqlite3'"
fi

if [[ -d "$APP_DIR/media" ]]; then
  tar -czf "$BACKUP_DIR/media-$stamp.tar.gz" -C "$APP_DIR" media
fi

# Eski nusxalarni oʻchirish
find "$BACKUP_DIR" -type f \( -name 'db-*' -o -name 'media-*' \) -mtime +"$KEEP_DAYS" -delete
echo "Zaxira tayyor: $BACKUP_DIR ($stamp)"

# Tiklash (PostgreSQL):  pg_restore --clean --if-exists -d "$DATABASE_URL" db-XXXX.dump
