# 사내망 이전 작업 — 채팅/세션 핸드오프 요약

이 문서는 **옵션 B(사내 PostgreSQL + MinIO, 외부 객체 스토리지 의존 없음)** 과 관련해 이전에 진행한 작업을 새 대화(또는 담당자)에게 넘기기 위한 요약입니다. 상세는 각 경로의 파일을 참고하세요.  
**실제 Rocky 서버에 `deploy/rocky`를 올리고, 노트북에서 SSH 터널로 붙어 개발한 뒤 겪은 이슈**는 아래 **§11**에 정리해 두었습니다.  
**Supabase 덤프 복원·백업 수신·URL 검증까지 진행한 뒤 MinIO 업로드로 이어가는 맥락**은 **§12 (2026-04-28 세션)** 를 참고하세요.

---

## 1. 목표·전제

- **DB**: 사내(또는 팀) PostgreSQL, Prisma는 기존과 동일 `DATABASE_URL` / `DIRECT_URL`.
- **객체 스토리지**: **S3 호환 API** — 사내 **MinIO** 권장. 앱은 `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`로 통일.
- **제거됨**: `backblaze-b2`, `@supabase/supabase-js`, Supabase Storage REST 래퍼(`lib/supabase*.ts` 삭제), R2 eDM 분기.

---

## 2. 핵심 구현 (코드)

| 영역 | 내용 |
|------|------|
| **S3/MinIO** | `lib/s3/config.ts`, `lib/s3/post-storage.ts`, `lib/s3/url-helpers.ts`, `lib/s3/stream-utils.ts` — `S3_*` env로 `isS3StorageConfigured()` 등. |
| **기존 `lib/b2.ts`** | B2 SDK 제거. 업로드·Presigned는 **S3 설정 시**만. 그 외 다운로드는 **HTTP `fetch`**, 삭제는 S3 경로 + 레거시 B2 URL은 경고만. |
| **eDM** | `lib/r2-edm-storage.ts` — **`S3_*` / MinIO `edms`만** (파일명은 유지). |
| **Supabase Storage** | **제거** (이전 REST 래퍼 삭제). |
| **Presigned** | B2 POST → **S3 Presigned PUT**. 클라이언트 `uploadMode`·`/api/posts/upload-presigned` 등. |
| **퍼블릭 URL** | `lib/b2-client-url.ts`, `lib/public-asset-url.ts`, `lib/legacy-asset-bases.ts` — **`S3_PUBLIC` / `NEXT_PUBLIC_S3`** + 선택 레거시 호스트. |
| **PPT·아바타·아이콘** | **S3 필수** (`requireS3Json`). `lib/supabase-ppt-thumbnail.ts`는 S3 삭제만(이름 유지). |
| **Keepalive** | `app/api/keepalive/route.ts` — `storage`: S3 `ListBuckets`만. |
| **관리 UI** | `admin/dashboard` — 사내망 안내 + (선택) `NEXT_PUBLIC_MINIO_CONSOLE_URL`. |
| **eDM UI** | `EdmEditorPage`, `EdmCard` — `supabase.co` 대신 `isKnownPublicAssetBaseUrl` 등. |
| **Next/Image** | `next.config.js` — `https` + `http` + `hostname: '**'` (로컬/사내 MinIO HTTP). |

---

## 3. 인프라·배포 (레포)

| 경로 | 용도 |
|------|------|
| `deploy/rocky/docker-compose.yml` | PostgreSQL 17 + MinIO (+ init). |
| `deploy/rocky/docker-compose.app.yml` | (선택) Next standalone + Nginx — `docker-compose.yml`에 오버레이. |
| `deploy/rocky/Dockerfile` | 루트 컨텍스트 빌드, `next build`는 호스트의 Postgres(빌드 args)에 붙는 전제. |
| `deploy/rocky/.env.app.example` | 앱 컨테이너 런타임(서비스명 `postgres` / `minio`). |
| `deploy/rocky/.env.example` | `DATA_ROOT`, `HOST_BIND`, MinIO/Postgres 자격, (선택) Nginx 포트. |
| `deploy/rocky/README.md` | `compose up`, **풀스택(8)**, 덤프 복원, **사내망 운영: `pg_dump`·cron, `curl /api/keepalive`**. |
| `deploy/rocky/scripts/backup-pg-dump-cron.example.sh` | DB 덤프 예시( cron용 ). |
| `deploy/WEBAPPS_LAYOUT.md` | `/data/webapps/design5/data` 등 권장 레이아웃. |
| `env.local.internal.example.txt` | 노트북→사내망 SSH 터널 등 예시. |
| `env.example.txt` | S3_* 필수 중심; 구 클라우드 변수는 비사용 안내. |

---

## 4. GitHub Actions

- `.github/workflows/backup-supabase-to-b2.yml`, `keepalive.yml` — **퍼블릿 클라우드** 전제. 상단 **주석**에 사내망이면 **비활성**·`deploy/rocky/README`의 cron·`pg_dump` 권장.
- 자동으로 사내망에 붙지 **않음** — 러너·URL 정책은 팀에서 별도 결정.

---

## 5. 문서 (갱신됨)

- `docs/DEPLOYMENT.md` — **사내망 배포** 우선, Vercel은 선택(레거시).
- `docs/INFRASTRUCTURE.md` — 사내망 Mermaid + 레거시 클라우드 섹션.
- `docs/DATA_FLOW.md`, `docs/ARCHITECTURE.md`, `docs/SYSTEM_ARCHITECTURE.md` — B2·Supabase-only 표현 정리.
- `docs/API.md` — `upload-presigned` → PUT + CORS.
- `docs/KEEPALIVE_SETUP.md` — (이전 턴) `storage` 필드, 사내망 cron 절.
- `DEPLOYMENT_CHECKLIST.md` — 사내망·eDM = **S3/MinIO `edms`만**, Prisma baseline·URL 치환 체크.
- `docs/OPERATIONAL_MIGRATION.md`, `docs/PRISMA_MIGRATIONS.md`, `prisma/migrations/README.md` — 운영 이전·마이그레이션 절차.
- `README.md` — 기술 스택·env를 S3/MinIO 중심으로 수정.

**남기거나 미흡할 수 있음:** `docs/SUPABASE_SECURITY_SETUP.md` (Postgres RLS 쪽으로의 전면 이전은 미작업일 수 있음), 일부 `docs/INFRASTRUCTURE` 외 옛 절쟁.

---

## 6. package.json

- `backblaze-b2`, `@supabase/supabase-js` **제거됨**.
- `b2:setup-cors`, `b2:check-cors` 스크립트 제거( MinIO CORS는 콘솔·`mc`·문서 ).

---

## 7. 환경 변수 (요지)

- **필수(사내망 권장):** `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_*`, **`S3_ENDPOINT`**, **`S3_ACCESS_KEY_ID`**, **`S3_SECRET_ACCESS_KEY`**, `S3_REGION`, `S3_FORCE_PATH_STYLE`(MinIO `true`), `S3_BUCKET_POSTS` 등, `S3_PUBLIC_BASE_URL` / `NEXT_PUBLIC_S3_PUBLIC_BASE_URL`.
- **MinIO 콘솔 링크(선택):** `NEXT_PUBLIC_MINIO_CONSOLE_URL`.
- (참고) 구 B2/R2/Supabase URL·키는 **앱에서 미사용**. DB·이미지 마이그레이션 기간에만 `legacy-asset-bases` env.
- `deploy/rocky/.env`는 **Docker 전용**; 앱 루트 `.env` / `.env.local`은 **Next/Prisma** — 역할 구분.

---

## 8. 남은 작업·주의 (새 세션에서 이어갈 때)

구축·로컬 연동 중 **자주 막히는 지점**(rsync 권한, MinIO 자격, `minio-init` 126, Prisma 터널, 시드 vs 덤프, OAuth, ADMIN 역할 등)은 **§11**을 먼저 보세요.

1. **데이터 이전(운영)**: [`docs/OPERATIONAL_MIGRATION.md`](OPERATIONAL_MIGRATION.md) — MinIO 객체 → `pg_restore` → `npm run db:migrate-storage-urls` (dry-run 선행). *(실제 진행 순서가 DB 먼저였다면 **§12** 참고 — 이후 MinIO·URL 치환으로 맞추면 됨.)*
2. **TLS(443)·퍼블릭 객체 URL**: 게이트웨이·`S3_PUBLIC_BASE_URL` 확정.
3. **Prisma**: [`docs/PRISMA_MIGRATIONS.md`](PRISMA_MIGRATIONS.md) — 레포에 `prisma/migrations/` 포함(baseline `20260427120000_baseline`); `pg_restore` DB는 `migrate resolve` 여부 확인 후 `migrate deploy`.
4. **RLS(선택)**: [`docs/POSTGRES_RLS_INTERNAL.md`](POSTGRES_RLS_INTERNAL.md) · [`docs/SUPABASE_SECURITY_SETUP.md`](SUPABASE_SECURITY_SETUP.md) 상단 안내.

---

## 9. 계획 문서·To-do YAML

- `docs/사내망_이전_계획_baa87487.plan.md` — 본문에 상세 기획, **앞부분 YAML `todos`는 `pending`이 많이 남아 있을 수 있음** (실제 코드와 동기화하려면 수동 갱신).

---

## 10. 검증

- `npx tsc --noEmit` — 통과한 상태로 유지 권장.
- `npm run build` — DB·환경 없으면 sitemap 등에서 실패할 수 있음(환경 이슈).

---

## 11. 실제 구축 · 노트북 연동 트러블슈팅 (2026-04 세션)

새 채팅에서 **사내망 Docker(DB·MinIO) + 로컬 Next** 조합을 다시 잡을 때 참고용입니다. IP·포트·DB 이름은 환경에 맞게 바꿉니다.

### 11.1 디스크·디렉터리

- **`/dev/mapper/rl-data`** 는 블록 장치라 `cd`로 들어가지 않습니다. 마운트 포인트 **`/data`** 아래에 `webapps/design5/...` 트리를 만듭니다 ([`deploy/WEBAPPS_LAYOUT.md`](../deploy/WEBAPPS_LAYOUT.md)).
- **`deploy/rocky/`를 서버로 복사**: 노트북에서 `rsync`/`scp`. 원격 경로가 **`root` 소유**이면 `design` 사용자로 `rsync` 시 **Permission denied**·`status 23` — 서버에서 `sudo chown -R design:design /data/webapps/design5` 등으로 쓰기 가능하게 맞춤.

### 11.2 Docker 데이터 평면 (`docker compose --env-file .env up -d`)

- **역할**: Postgres + MinIO 기동, `minio-init`으로 버킷 생성(의존: MinIO healthy). **웹(Next)** 은 포함되지 않음 — [`deploy/rocky/README.md`](../deploy/rocky/README.md).
- **MinIO 기동 실패 로그** `MINIO_ROOT_USER length should be at least 3` / password **8자 이상** — `deploy/rocky/.env`의 `MINIO_ROOT_*` 규칙 준수. 비밀번호에 `$` `#` 등이 있으면 Compose·쉘 해석 주의.
- **`design5-minio-init` `Exited (126)`**: 마운트된 `scripts/minio-init.sh`에 **실행 비트(`chmod +x`)** 없음인 경우가 많음 — 서버에서 `chmod +x deploy/rocky/scripts/minio-init.sh` 후 `docker rm -f design5-minio-init` → `docker compose ... up -d minio-init`. (레포에서 `command: sh /scripts/minio-init.sh` 형태로 바꾸면 실행 비트 없이도 동작하게 할 수 있음.)

### 11.3 Prisma (`migrate deploy` / `migrate status`)

- **노트북 → 사내 DB**: `ssh -N -L 15432:127.0.0.1:5432 -p <ssh_port> user@<server>` 등으로 터널 유지. **`P1001`** = 터널 없음·끊김·포트 불일치.
- **`P1013` invalid port**: `DATABASE_URL` 안 **비밀번호 특수문자 미이스케이프**로 호스트/포트가 깨진 경우 — URL 인코딩.
- **Prisma가 표시하는 DB 이름**은 **`DATABASE_URL` 경로의 DB명**이지, `deploy/rocky/.env`의 `POSTGRES_DB`를 자동으로 읽는 것이 아님 — 둘을 **의도적으로 일치**.
- **빈 DB**: `npx prisma migrate deploy`로 baseline 적용. **이미 `pg_restore`만 한 DB**는 [`docs/PRISMA_MIGRATIONS.md`](PRISMA_MIGRATIONS.md)대로 `migrate resolve` 검토.
- **덤프 없이도** 메뉴·`/penta-design` 라우트가 필요하면: **`Category` 등 행이 필요** — `npm run db:seed` ([`prisma/seed.ts`](../prisma/seed.ts)). 운영 데이터까지는 **`pg_restore` + MinIO 객체 + URL 치환** ([`docs/OPERATIONAL_MIGRATION.md`](OPERATIONAL_MIGRATION.md)).

### 11.4 SSH 터널 (`ssh -N`)

- **`-N`**: 로그인 후 **쉘 없이** 포워딩만 유지 → 화면이 “멈춘 것처럼” 보이는 것이 **정상**. 그 터미널은 **닫지 말고** 두고, **다른 터미널**에서 `npm run dev`·Prisma 실행.
- 끊김 완화(선택): `-o ServerAliveInterval=60 -o ServerAliveCountMax=3`.

### 11.5 로컬 Next (`localhost:3000`)와 사내 DB·MinIO

- **`npm run dev`** 는 노트북에서만 동작. 브라우저는 `http://localhost:3000`.
- **DB·S3 연결 대상**은 **루트 `.env` / `.env.local`의 `DATABASE_URL`·`S3_*`** — 터널을 `127.0.0.1:15432`·`127.0.0.1:19000` 등으로 열어 두었으면, **트래픽은 SSH를 타고 내부망 서버의 Docker Postgres·MinIO로** 간다. 터널을 끄거나 env를 로컬 DB로 바꾸면 대상이 달라짐.
- **`deploy/rocky/.env`**: Compose 전용 — Next/Prisma가 읽지 않음. 역할 구분은 위 **§7**과 동일.

### 11.6 NextAuth · Google OAuth · 관리자 메뉴

- **`JWTSessionError` / `no matching decryption secret`**: 브라우저 쿠키가 **이전 `NEXTAUTH_SECRET`** 으로 암호화된 상태에서 비밀만 바뀐 경우. **`.env`와 `.env.local`의 `NEXTAUTH_SECRET` 단일·일치** + **`localhost:3000` 쿠키 삭제** 또는 시크릿 창.
- **Google `redirect_uri_mismatch`**: Google Cloud Console → OAuth 클라이언트 → **승인된 리디렉션 URI**에  
  `http://localhost:3000/api/auth/callback/google`  
  (포트·호스트는 `NEXTAUTH_URL`과 동일하게) 및 **승인된 자바스크립트 원본** `http://localhost:3000`.
- **사이드바 ADMIN 블록이 안 보임**: [`components/layout/Sidebar.tsx`](../components/layout/Sidebar.tsx)에서 **`session.user.role === 'ADMIN'`** 일 때만 렌더. Google 최초 가입은 기본 **`MEMBER`**. 해당 계정을 DB에서 `ADMIN`으로 올리거나(`UPDATE "User" SET role = 'ADMIN' WHERE email = '...'`), 시드의 **`admin@pentasecurity.com` + 비밀번호 로그인** 등 팀 정책에 따름.

### 11.7 관련 문서·체크리스트

- Phase 1 상세(터널·env·스모크): 레포 루트 [`env.local.internal.example.txt`](../env.local.internal.example.txt), [`deploy/rocky/README.md`](../deploy/rocky/README.md) §3.
- 배포 전 점검: [`DEPLOYMENT_CHECKLIST.md`](../DEPLOYMENT_CHECKLIST.md).

---

## 12. 운영 마이그레이션 진행 기록 (2026-04-28 세션)

새 채팅에서 **DB 복원 이후 객체(MinIO)·URL 치환**을 이어갈 때의 맥락입니다. (이상적인 순서는 [`OPERATIONAL_MIGRATION.md`](OPERATIONAL_MIGRATION.md) — 객체 먼저 권장이나, 본 세션에서는 **Postgres 복원·Prisma 정합을 먼저 완료**한 뒤 백업 파일을 서버로 옮기고 **MinIO 업로드 단계로 진입**함.)

### 12.1 노트북에서 `pg_restore` (SSH 터널)

- **터미널 1**: `ssh -N -o ServerAliveInterval=60 -o ServerAliveCountMax=3 -L 15432:127.0.0.1:5432 -p <ssh_port> <user>@<host>` (DB는 서버 `127.0.0.1:5432` 가정).
- **터미널 2**: `pg_restore -h 127.0.0.1 -p 15432 -U <POSTGRES_USER> -d <POSTGRES_DB> --no-owner --no-acl --verbose ./data-backup/supabase_backup-*.dump`
- **`-d` DB 이름 오타**(`esign5-db` 등) 시 연결 실패·다른 DB로 붙음 — `deploy/rocky/.env`의 **`POSTGRES_DB`** 와 **완전히 동일**하게.
- **`FATAL: password authentication failed`**: 비밀번호의 `/` 때문이라기보다 **오타·`.env`와 실제 컨테이너 초기화 시 비밀번호 불일치**(볼륨 최초 생성 시 값)를 우선 의심. `PGPASSWORD` 는 작은따옴표로 감싸면 `/` 는 문제 없음.

### 12.2 덤프를 “이미 Prisma/시드가 있는 DB”에 넣었을 때

- 증상: `type "CategoryType" already exists`, `relation "posts" already exists`, `COPY ... duplicate key`, `authorId` FK 실패, `multiple primary keys` 등 **대량 오류**.
- 원인: **`migrate deploy` / `db:seed` 로 스키마·초기 행이 있는 상태**에서 전체 Supabase 덤프를 또 적용하려 함.
- 조치: **`postgres` DB에 접속해 `pg_terminate_backend` → `DROP DATABASE` → `CREATE DATABASE`** 로 대상 DB를 비움 → **`migrate deploy`·시드 없이** `pg_restore`만 → [`PRISMA_MIGRATIONS.md`](PRISMA_MIGRATIONS.md)대로 `npx prisma migrate resolve --applied "20260427120000_baseline"` → `npx prisma migrate deploy` (대기 마이그레이션 없으면 `No pending migrations`).

### 12.3 `pg_restore` 무시 오류 소수 건

- 예: **`pg_graphql`**, **`supabase_vault`**, **`vault.secrets` COPY** — 사내 일반 Postgres 이미지에 없는 Supabase 전용 확장·스키마. **`public` 앱 데이터와 무관**하면 무시해도 됨.
- **`wal_level` / logical replication** 경고 — Realtime을 사내 DB에서 쓰지 않으면 보통 앱과 무관.

### 12.4 로컬 브라우저에서 이미지가 “다 잘 보이는” 이유

- **`localhost:3000`** 은 **노트북 Next**가 UI를 제공. DB에는 여전히 **Supabase / `assets.layerary.com` / `cdn.layerary.com`** 등 **외부 절대 URL**이 남아 있으면, 브라우저가 **인터넷 쪽 스토리지**로 직접 요청 → 외부가 살아 있으면 이미지는 정상 표시. **MinIO 이전 완료를 의미하지 않음.**
- 확인: 개발자 도구 Network 또는 “새 탭에서 이미지 열기”로 **실제 요청 호스트** 확인.

### 12.5 객체 vs URL 치환 순서

- **권장**: MinIO에 파일(올바른 **객체 키**) 반영 **후** [`migrate-storage-urls`](../scripts/migrate-storage-urls-to-s3.ts) (`npm run db:migrate-storage-urls:dry` → 본 실행). URL만 먼저 바꾸면 **404** 가능.
- 상세: [`OPERATIONAL_MIGRATION.md`](OPERATIONAL_MIGRATION.md).

### 12.6 서버 경로·백업 수신

- **`tree` 가 `webapps/design5/...` 로 보였는데 `cd /webapps/design5/deploy` 가 안 됨**: 실제 권장 루트는 **`/data/webapps/design5/`** ([`WEBAPPS_LAYOUT.md`](../deploy/WEBAPPS_LAYOUT.md)). `/webapps/design5` 에는 **`data` 만 있고 `deploy` 가 없을 수 있음** — `deploy/rocky` 는 레포에서 **별도 `rsync`/`scp`**.
- 노트북 `data-backup/` → 서버 예: **`/data/webapps/design5/data-backup-incoming/`** (`rsync -avh --progress -e "ssh -p …" …/data-backup/ user@host:…/data-backup-incoming/`).

### 12.7 백업 압축 해제 구조 (검증됨)

서버 `data-backup-incoming` 예시:

- **`bzsnapshot-unpacked/`** (B2 스냅샷): `posts/<slug>/…`, `thumbnails/posts/<slug>/…`(썸네일), `diagrams/`, `categories/`, `card-thumbnails/` 등.
- **`r2-r2_backup/`** (eDM): `<postId>_<timestamp>/thumbnail.jpg`, `cell_*` 등 — DB `edms.thumbnailUrl` 의 `https://cdn.layerary.com/<폴더>/thumbnail.jpg` 와 **폴더명 일치**.
- **Supabase**: `supabase-icons/`(파일명 루트), `supabase-avatars/avatars/…`, `supabase-ppt-thumbnails/` 등 — DB `posts` 행 중 **`…/storage/v1/object/public/icons/파일`** 은 **`icons` 버킷** 키가 파일명과 동일.

**`posts` 테이블 URL 샘플과의 대응**

| 출처 | URL 패턴 (예) | MinIO 버킷·키 방향 |
|------|----------------|---------------------|
| Supabase Storage | `…/object/public/icons/<파일>` | 버킷 **`icons`**, 키 `<파일>` |
| B2/Worker CDN | `https://assets.layerary.com/posts/<slug>/파일` | 버킷 **`posts`**, 키 `<slug>/파일` |
| 동일(썸네일) | `https://assets.layerary.com/thumbnails/posts/<slug>/…png` | 버킷 **`posts`**, 키 `thumbnails/posts/<slug>/…png` |
| R2 eDM | `https://cdn.layerary.com/<id>/thumbnail.jpg` | 버킷 **`edms`**, 키 `<id>/thumbnail.jpg` |

`mc` 예시는 §12에서 한 번에 적지 않음 — 구체 명령은 [`OPERATIONAL_MIGRATION.md`](OPERATIONAL_MIGRATION.md) + `deploy/rocky/README.md` §4 버킷 표. **`mc alias set`** 후 `mc cp --recursive` 로 위 키 규칙 유지.

### 12.8 DB 데이터 확인 (SQL)

- Prisma `User` 모델은 **`@@map("users")`** → `SELECT … FROM users` (테이블명 `"User"` 아님).
- **사내 터미널**: `docker exec -it design5-postgres psql -U … -d …`  
- **노트북**: 터널 유지 후 `psql "postgresql://…@127.0.0.1:15432/…"` — **같은 DB**이면 위치 무관.

### 12.9 다음 세션에서 할 일 (체크리스트)

1. **MinIO**: `mc`로 `posts` / `edms` / `icons` / `avatars` / `ppt-thumbnails` 등에 **§12.7 구조대로** 객체 업로드.  
2. **`S3_PUBLIC_BASE_URL` 등 퍼블릭 URL** 확정.  
3. **`STORAGE_URL_REPLACEMENTS_FILE`**: `from` 을 DB에 남은 **호스트+경로 접두**(Supabase `icons` URL, `assets.layerary.com/posts/`, `thumbnails/posts/`, `cdn.layerary.com/` 등)별로 **긴 것부터** 배열 앞에 두고 `to` 매핑 — [`storage-url-replacements.example.json`](../scripts/storage-url-replacements.example.json).  
4. **`npm run db:migrate-storage-urls:dry`** → 본 실행.  
5. 앱 스모크·(선택) TLS·Actions/cron 정책.

---

## 13. 후속 작업 기록 (2026-04-28 늦은 세션)

아래는 §12를 실제로 수행하면서 나온 이슈와 확정된 상태입니다. 새 채팅에서 이어갈 때 시작점으로 사용합니다.

### 13.1 URL 치환 실행 (터널 기반 임시 공개 URL)

- 치환 파일: `scripts/storage-url-replacements.internal-tunnel.json`
  - Supabase `.../public/icons|avatars|ppt-thumbnails` → `http://127.0.0.1:19000/<bucket>`
  - `assets.layerary.com/posts` / `thumbnails/posts` / `cdn.layerary.com` → MinIO 경로로 매핑
- 실행 순서:
  - `npm run db:migrate-storage-urls:dry`
  - 검토 후 `npm run db:migrate-storage-urls` 본 실행
- `psql "$DATABASE_URL"` 시 `invalid URI query parameter: "schema"` 발생 가능:
  - Prisma용 `?schema=public` 쿼리를 제거한 접속 문자열로 `psql` 사용.

### 13.2 업로드·표시 이슈와 원인

- 게시물 업로드 500 + `request signature ... does not match`:
  - 원인: 로컬 Next가 읽는 루트 `.env.local` 의 `S3_*` 값과 MinIO 실제 자격 불일치.
  - 조치: `.env.local` 의 `S3_ENDPOINT`/`S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY` 정합 + dev 서버 재시작.
- 이미지 403 (`AccessDenied`)로 브라우저 미표시:
  - 원인: MinIO 버킷 익명 읽기 미허용.
  - 조치: 개발 검증 목적 `mc anonymous set download` 를 `posts/edms/icons/avatars/ppt-thumbnails`에 적용.
- 새 업로드 일부 URL과 버킷 경로 불일치 이슈:
  - `S3_PUBLIC_BASE_URL` 정책(버킷 prefix 포함 여부)에 따라 URL이 달라지므로, 도메인 확정 전/후 정책을 일관되게 맞춰야 함.

### 13.3 아이콘 페이지 대량 `Error` 복구

- DB 확인 결과:
  - `categories.slug='icon'` + `posts` 기준 **292건** 존재 (PUBLISHED도 292).
  - 즉, 문제는 DB 건수가 아니라 MinIO `icons` 객체 누락/불일치.
- 진단:
  - 예: `clock`은 `mc stat local/icons/<key>` 성공, `box1`은 `Object does not exist`.
  - Supabase 아이콘 재다운로드 zip을 재이관.
- 주의점:
  - 압축 해제 시 `__MACOSX/._*.svg` 가 함께 풀려 개수가 2배(예: 584)로 보일 수 있음.
  - 실제 아이콘만 반영하려면 `__MACOSX` 제거 후 반영.
- 최종 조치:
  - `rm -rf /tmp/icons-unpack/__MACOSX`
  - `mc mirror --overwrite /tmp/icons-unpack/ local/icons/`
  - 검증: `mc stat local/icons/1771466035761-box1.svg` 성공, `mc ls local/icons/ | wc -l` = **292**
  - 결과: 로컬 브라우저 아이콘 페이지 전체 표시 확인.

### 13.4 현재 상태와 다음 시작점

- 현재(터널 기반 개발 검증): 메뉴별 목록/이미지/아이콘 표시 정상.
- 다음 세션 우선순위:
  1. 게시물 **업로드/수정/삭제**(카테고리별) 최종 스모크.
  2. 도메인 `design5.pentasecurity.com` + TLS 반영.
  3. `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`, `S3_PUBLIC_BASE_URL`, `NEXT_PUBLIC_S3_PUBLIC_BASE_URL` 를 최종값으로 전환.
  4. 운영용 URL 치환 JSON(터널 URL 제거)로 dry-run → 본 실행.
  5. 임시 익명 다운로드 정책(`mc anonymous`)은 운영 보안정책에 맞춰 재검토.

---

*이 파일은 “이전 대화 맥락 요약”용이며, 제품 사양의 단일 출처(SOT)는 `env.example.txt`·`docs/DEPLOYMENT.md`·실제 코드를 따릅니다.*
