# Prisma 마이그레이션

## `20260427120000_baseline`

`prisma migrate diff --from-empty --to-schema-datamodel` 로 생성한 **현재 `schema.prisma` 전체** DDL입니다.

| 시나리오 | 권장 |
|----------|------|
| **새 빈 Postgres** (로컬·스테이징 신규) | `npx prisma migrate deploy` 로 전체 적용. |
| **`pg_restore` 등으로 이미 스키마+데이터가 있는 DB** | 테이블이 이미 있으면 이 마이그레이션을 **실행하면 실패**합니다. 스키마가 이 파일과 동일하다고 판단되면 `npx prisma migrate resolve --applied "20260427120000_baseline"` 로 **적용 완료만 기록**하고, 이후 변경분만 새 마이그레이션 폴더로 추가합니다. |
| **스키마 드리프트** | `prisma migrate diff --from-url ... --to-schema-datamodel ...` 로 차이를 검토한 뒤 팀 절차에 따름. |

자세한 정책: [docs/PRISMA_MIGRATIONS.md](../../docs/PRISMA_MIGRATIONS.md)
