# Prisma 마이그레이션 정책 (사내망·CI)

## 현재 레포 상태

- **`prisma/migrations/`** 를 Git에 포함합니다(`.gitignore`에서 제외됨).
- **`20260427120000_baseline`**: `schema.prisma` 기준 **빈 DB → 전체 DDL** (`prisma migrate diff --from-empty …`).  
  - 상세: [`prisma/migrations/README.md`](../prisma/migrations/README.md)

## 배포 시 (`migrate deploy`)

1. CI 또는 서버에서 **`npx prisma migrate deploy`** 를 `next build` 전(또는 컨테이너 기동 시) 실행합니다.
2. **새 빈 Postgres**에는 baseline이 그대로 적용됩니다.

### `pg_restore`로 이미 스키마가 있는 DB

- `migrate deploy`가 baseline의 `CREATE TABLE` 을 실행하면 **이미 존재** 오류가 납니다.
- 스키마가 baseline과 동일(또는 동등)하다고 확인된 경우:

  ```bash
  npx prisma migrate resolve --applied "20260427120000_baseline"
  ```

  로 **이 마이그레이션만 적용 완료로 표시**하고, 이후 추가된 마이그레이션만 `deploy`가 실행합니다.
- 스키마가 어긋나 있으면 `prisma migrate diff`로 차이를 본 뒤 **수동 SQL** 또는 **새 마이그레이션**으로 맞춥니다.

## 이후 스키마 변경

- 로컬: `npx prisma migrate dev --name 설명` (개발 DB에 적용 + SQL 생성).
- 생성된 `prisma/migrations/<timestamp>_설명/` 를 **커밋**합니다.

## `migrate deploy`를 쓰지 않는 팀

- `prisma db push`만 쓰는 경우, 프로덕션은 **사전 스키마 일치** 전제이며 이력이 약해집니다. 팀 합의가 필요합니다.

## 참고

- [OPERATIONAL_MIGRATION.md](OPERATIONAL_MIGRATION.md) — 덤프 복원·URL 치환  
- [DEPLOYMENT_CHECKLIST.md](../DEPLOYMENT_CHECKLIST.md)  
- [deploy/rocky/README.md](../deploy/rocky/README.md)  
