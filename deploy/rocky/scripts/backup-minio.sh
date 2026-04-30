#!/usr/bin/env bash
# MinIO 버킷 → 로컬 고정 디렉터리 미러 (매일 덮어쓰기·원격에 없는 로컬 파일 삭제)
# 전제: 이 스크립트를 돌리는 사용자로 `mc alias set` 이 이미 되어 있을 것.
# crontab 예 (Postgres 백업과 시각 분리 권장):
#   30 3 * * * /data/webapps/design5/deploy/rocky/scripts/backup-minio.sh >> /data/webapps/design5/data/backups/minio/cron.log 2>&1

set -euo pipefail

# cron 환경에서 mc 를 못 찾을 때를 대비 (설치 경로에 맞게 조정)
export PATH="/usr/local/bin:/usr/bin:/bin:${PATH:-}"

DATA_ROOT="${DATA_ROOT:-/data/webapps/design5/data}"
MINIO_BACKUP="${DATA_ROOT}/backups/minio/latest"
LOG_DIR="${DATA_ROOT}/backups/minio"
LOG_FILE="${LOG_DIR}/minio-backup.log"

# 2단계에서 등록한 mc alias 이름
MC_ALIAS="${MC_ALIAS:-d5miniobackup}"

# deploy/rocky/scripts/minio-init.sh 와 동일 순서
BUCKETS=(posts edms avatars icons ppt-thumbnails)

mkdir -p "$LOG_DIR" "$MINIO_BACKUP"

log() {
  echo "[$(date -Iseconds)] $*"
}

log "start MinIO mirror → ${MINIO_BACKUP} (alias=${MC_ALIAS})"
{
  log "checking alias…"
  mc alias list | grep -Fx "${MC_ALIAS}" || {
    log "ERROR: mc alias '${MC_ALIAS}' not found. Run: mc alias set ${MC_ALIAS} <endpoint> <key> <secret>"
    exit 1
  }

  for b in "${BUCKETS[@]}"; do
    dest="${MINIO_BACKUP}/${b}"
    mkdir -p "$dest"
    log "mirror bucket: ${b}"
    mc mirror --overwrite --remove "${MC_ALIAS}/${b}/" "${dest}/"
    log "done bucket: ${b}"
  done

  log "finished OK"
} >>"$LOG_FILE" 2>&1

exit 0