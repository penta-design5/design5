# 운영 DB·파일 마이그레이션 (사내망)

`data-backup/`의 PostgreSQL 덤프·오브젝트 백업을 **새 사내 Postgres + MinIO**로 옮기고, DB에 저장된 **절대 URL**을 내부 게이트웨이·`S3_PUBLIC_BASE_URL` 규칙에 맞게 바꾸는 절차입니다.

## 순서 판단 (요약)

| 질문 | 권장 |
|------|------|
| 백업 **덤프 파일만** 먼저 `sed`로 URL 바꿀까? | **`-Fc`(맞춤 형식) 덤프는 비권장** — 바이너리라 깨지기 쉽습니다. **복원 후 DB에서 `UPDATE`/스크립트**가 안전합니다. |
| URL을 **스테이징 DB**에서 먼저 바꿀까, 운영에 바로 복원할까? | **스테이징에서 한 번** 복원 → MinIO에 객체 반영 → `migrate-storage-urls` dry-run → 실제 반영 → 앱 스모크 후 **운영**에 동일 절차를 권장합니다. |
| **파일(MinIO)** vs **DB 복원** 어느 쪽을 먼저? | **객체를 MinIO에 먼저** 두고(키·경로가 확정된 뒤), DB를 복원하고, URL 치환으로 **브라우저가 가리킬 주소**를 맞춥니다. DB만 먼저 복원하면 깨진 이미지가 길게 남을 수 있습니다. |

## 권장 단계 (전체)

1. **MinIO 준비**  
   - `deploy/rocky` 등으로 버킷 `posts`, `edms`, `avatars`, `icons`, `ppt-thumbnails` 존재 확인.  
   - `data-backup`에서 내려받은 파일을 **원본 키/경로 규칙**에 맞춰 `mc cp` / `mc mirror` / `aws s3 sync` 로 업로드(팀이 정한 키 ↔ DB URL 규칙과 일치해야 함).

2. **Postgres 복원**  
   - 스테이징(또는 운영) DB에 `pg_restore` 또는 `psql` (평문일 때).  
   - 절차 예: [`deploy/rocky/README.md`](../deploy/rocky/README.md)「덤프 복원」.

3. **Prisma 스키마 정합**  
   - 복원한 DB가 현재 `schema.prisma`와 맞는지 확인.  
   - 마이그레이션 정책: [`docs/PRISMA_MIGRATIONS.md`](PRISMA_MIGRATIONS.md).

4. **URL 일괄 치환 (복원된 DB에 연결한 뒤)**  
   - `STORAGE_URL_REPLACEMENTS_FILE`(또는 `_JSON`) 설정 후:
   - `npm run db:migrate-storage-urls:dry` → 로그 검토  
   - `npm run db:migrate-storage-urls`  
   - 상세: [`scripts/storage-url-replacements.example.json`](../scripts/storage-url-replacements.example.json), [`scripts/migrate-storage-urls-to-s3.ts`](../scripts/migrate-storage-urls-to-s3.ts).

5. **앱·환경**  
   - `DATABASE_URL` / `S3_*` / `S3_PUBLIC_BASE_URL`·`NEXT_PUBLIC_S3_PUBLIC_BASE_URL`을 **실제 내부망 값**으로 설정.  
   - Presigned·이미지·eDM·다운로드 스모크.

6. **운영 컷오버**  
   - 스테이징에서 검증된 동일 순서를 운영에 적용. 다운타임·롤백 계획은 팀 표준에 따름.

## `data-backup` 폴더

레포에 포함된 백업(용량·보안 정책에 따라 **Git에 올리지 않는 것**이 일반적)은 예:

- `supabase_backup_*.dump` — Postgres 논리/맞춤 덤프  
- `r2-r2_backup/`, `supabase-storage-backup/*.zip` 등 — 객체 파일

**DB URL 치환**은 덤프가 아니라 **복원 후 연결된 DB**에서 수행하는 것을 기본으로 합니다.

## 치환 JSON(`storage-url-replacements*.json`) 작성 체크리스트

1. **샘플 복사**  
   - `scripts/storage-url-replacements.example.json` → 팀 전용 파일(예: `scripts/my-replacements.json`, **Git에 올리지 않음** 권장).

2. **`from` 문자열**  
   - DB·백업에 **실제로 남아 있는 접두어**와 일치시키기(끝의 `/` 유무까지).  
   - Supabase Storage 공개 URL: `…/storage/v1/object/public/…` 형태가 흔함.  
   - R2·Worker·B2 퍼블릭은 팀이 쓰던 **정확한 origin**을 `psql`/`SELECT DISTINCT` 또는 샘플 행으로 확인.

3. **`to` 문자열**  
   - 내부 게이트웨이 + `S3_PUBLIC_BASE_URL` 정책과 동일해야 브라우저·이메일에서 열림.  
   - 버킷이 경로에 포함되는지(`…/posts/…` vs `…/bucket/key`) MinIO·Nginx 설정과 **한 세트**로 맞출 것.

4. **순서**  
   - 스크립트는 `from` 길이 **긴 것부터** 치환합니다. **부분 겹침**(짧은 `from`이 긴 URL의 일부만 덮는 경우)을 피하려면 더 구체적인 `from`을 배열 **앞쪽**에 두세요.

5. **검증**  
   - `npm run db:migrate-storage-urls:dry` 후 로그에 찍힌 모델명·건수 확인.  
   - 공지·디자인 요청 **Markdown/본문**에 URL이 있으면 `Notice.content`, `DesignRequest.content`도 치환됩니다(일반 텍스트와 겹치지 않는 `from` 설계).

6. **롤백**  
   - 실행 전 `pg_dump` 스냅샷 또는 복원본 보관.

## 관련 문서

- [DEPLOYMENT.md](DEPLOYMENT.md) — 배포·환경 변수  
- [PRISMA_MIGRATIONS.md](PRISMA_MIGRATIONS.md) — `migrate deploy` / Git 정책  
- [POSTGRES_RLS_INTERNAL.md](POSTGRES_RLS_INTERNAL.md) — (선택) 사내 Postgres RLS  
