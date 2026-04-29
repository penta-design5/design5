#!/usr/bin/env bash
# 예시: design5-postgres(Compose 서비스명) DB를 호스트 $DATA_ROOT/backups 아래에 덤프
# crontab: 0 3 * * * /path/to/backup-pg-dump-cron.example.sh
# (실사용 시 경로·환경·보관일수 30일 팀에 맞게 복사·수정)

set -euo pipefail
DATA_ROOT="${DATA_ROOT:-/data/webapps/design5/data}"
BKP_DIR="${DATA_ROOT}/backups/pg"
STAMP="$(date +%Y%m%d-%H%M)"
OUT="${BKP_DIR}/design5-${STAMP}.dump"
mkdir -p "$BKP_DIR"

# .env 의 POSTGRES_USER / POSTGRES_DB 와 동일하게
export POSTGRES_USER=design5
export POSTGRES_DB=design5-db

docker exec design5-postgres pg_dump -U "${POSTGRES_USER:-postgres}" -Fc -f "/tmp/backup-${STAMP}.dump" "${POSTGRES_DB:-design5}"
docker cp "design5-postgres:/tmp/backup-${STAMP}.dump" "$OUT"
docker exec design5-postgres rm -f "/tmp/backup-${STAMP}.dump"
echo "OK: $OUT"

# 오래된 덤프 삭제(30일) — 마지막 수정 시각 기준 30일보다 오래된 `design5-*.dump`만 삭제합니다.
find "$BKP_DIR" -name 'design5-*.dump' -mtime +30 -delete 2>/dev/null || true