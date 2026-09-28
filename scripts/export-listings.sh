#!/usr/bin/env bash
# Выгружает все анкеты: ник, статус, телефон/телеграм/whatsapp.
# Можно запускать из любой директории — .env ищется рядом с корнем проекта.
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Извлекаем только DATABASE_URL, не исполняя весь .env как bash — он не обязан быть валидным shell-скриптом.
DATABASE_URL="$(grep -m1 '^DATABASE_URL=' "$PROJECT_ROOT/.env" | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'\$//")"

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL не найден в $PROJECT_ROOT/.env" >&2
  exit 1
fi

OUT="listings_export_$(date +%Y%m%d_%H%M%S).csv"

psql "$DATABASE_URL" -c "\copy (
  SELECT
    u.login            AS nickname,
    l.name              AS anketa_name,
    l.status,
    COALESCE(l.contact_phone, '')    AS phone,
    COALESCE(l.contact_telegram, '') AS telegram,
    COALESCE(l.contact_whatsapp, '') AS whatsapp,
    l.created_at
  FROM listings l
  JOIN users u ON u.id = l.user_id
  ORDER BY l.created_at
) TO '$OUT' WITH CSV HEADER"

echo "Готово: $OUT"
