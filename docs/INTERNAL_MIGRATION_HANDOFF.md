# 사내망 이전 작업 — 채팅/세션 핸드오프 요약

이 문서는 **옵션 B(사내 PostgreSQL + MinIO, 외부 객체 스토리지 의존 없음)** 과 관련해 이전에 진행한 작업을 새 대화(또는 담당자)에게 넘기기 위한 요약입니다. 상세는 각 경로의 파일을 참고하세요.  
**실제 Rocky 서버에 `deploy/rocky`를 올리고, 노트북에서 SSH 터널로 붙어 개발한 뒤 겪은 이슈**는 아래 **§11**에 정리해 두었습니다.  
**Supabase 덤프 복원·백업 수신·URL 검증까지 진행한 뒤 MinIO 업로드로 이어가는 맥락**은 **§12 (2026-04-28 세션)** 를 참고하세요.  
**사내망 기능 검증 마무리·이번 채팅에서 정리된 코드/운영 메모**는 **§15** 를 참고하세요.  
**Rocky 서버에서 Postgres·MinIO 일일 백업(cron·`mc`)** 은 **§16** 을 참고하세요.

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
| **PPT·아바타·아이콘** | **S3 필수** (`requireS3Json`). 공개 URL: `publicUrlForIconsKey` / `publicUrlForAvatarsKey` / `publicUrlForPptThumbnailsKey` (`lib/s3/config.ts`, 베이스 없을 때 `엔드포인트/버킷/키`). `lib/supabase-ppt-thumbnail.ts`는 S3 삭제만(이름 유지). |
| **Keepalive** | `app/api/keepalive/route.ts` — `storage`: S3 `ListBuckets`만. |
| **관리 UI** | `admin/dashboard` — 사내망 안내 + (선택) `NEXT_PUBLIC_MINIO_CONSOLE_URL`, **`NEXT_PUBLIC_ADMINER_URL`** (§14 Adminer 터널). |
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
| `deploy/rocky/scripts/backup-pg-dump.sh` | 사내 운영용 Postgres 덤프(30일 보관 등 팀 설정). |
| `deploy/rocky/scripts/backup-minio.sh` | MinIO → 로컬 고정 디렉터리 `mc mirror`(버킷별, §16). |
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

## 14. Web UI로 Postgres·MinIO 보기 (노트북 + SSH 터널)

터미널만 쓰기 부담될 때, **사내망 서버에서 서비스를 띄운 뒤 로컬 브라우저로 터널 접속**하는 방식입니다. (운영 공개는 하지 않음.)

### 14.1 MinIO 콘솔 (버킷·객체·정책)

`deploy/rocky/docker-compose.yml` 기준 MinIO **콘솔**은 호스트 `127.0.0.1:9001` 에 매핑됩니다.

1. **노트북**에서 SSH 터널 (예: SSH 포트 `6022`, 서버 `design@192.168.1.42`):
   ```bash
   ssh -N -L 19001:127.0.0.1:9001 -p 6022 design@192.168.1.42
   ```
2. 브라우저: `http://127.0.0.1:19001` (로컬 포트는 터널 앞쪽과 동일하게)
3. 로그인: `deploy/rocky/.env` 의 **`MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`**
4. (선택) 앱 관리 UI에서 콘솔 링크: `NEXT_PUBLIC_MINIO_CONSOLE_URL`, `NEXT_PUBLIC_ADMINER_URL` — [`env.example.txt`](../env.example.txt) 참고.

S3 API(9000)는 기존과 같이 `127.0.0.1:19000` 터널 등으로 별도 열 수 있습니다.

### 14.2 Postgres — Adminer (웹 SQL 클라이언트)

**사내망 서버**에 Docker가 있으면 서버에서 Adminer 컨테이너를 띄웁니다.

```bash
docker run --rm -d --name adminer -p 18080:8080 adminer
```

**노트북**에서 터널:

```bash
ssh -N -L 18080:127.0.0.1:18080 -p 6022 design@192.168.1.42
```

브라우저: `http://127.0.0.1:18080`

#### Adminer 접속 필드 (중요: Linux Docker)

- **시스템**: PostgreSQL  
- **사용자 / 비밀번호 / 데이터베이스**: `deploy/rocky/.env` 의 `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`

**서버(호스트) 입력은 Linux에서 `host.docker.internal` 기본 미지원**이라 그대로 쓰면  
`could not translate host name "host.docker.internal"` 오류가 납니다. 아래 중 하나를 씁니다.

**방법 A (권장): Postgres 컨테이너와 같은 Docker 네트워크에 Adminer 붙이기**

1. Postgres 컨테이너가 쓰는 네트워크 확인:
   ```bash
   docker inspect design5-postgres --format '{{json .NetworkSettings.Networks}}'
   ```
2. Adminer를 그 네트워크에 연결 (네트워크 이름은 환경마다 다름, 예: `rocky_default`):
   ```bash
   docker network connect <위에서_확인한_네트워크_이름> adminer
   ```
3. Adminer 화면 **서버**에 **컨테이너 이름** 입력: `design5-postgres`  
   (Compose `container_name` 과 일치해야 함.)

**방법 B: Adminer 재기동 시 host-gateway 추가**

```bash
docker rm -f adminer
docker run --rm -d --name adminer \
  --add-host=host.docker.internal:host-gateway \
  -p 18080:8080 adminer
```

이후 **서버**에 `host.docker.internal`, **포트** `5432` (호스트에 Postgres 포트가 바인딩된 경우).

#### 확인

- 서버에서: `curl -I http://127.0.0.1:18080` → 응답 있으면 Adminer 기동 정상.
- 터널은 **브라우저를 여는 노트북**에서 유지.

#### 정리

- MinIO UI: 터널 `9001` → 로컬 브라우저.  
- Postgres UI: 서버에서 Adminer + 터널 `18080` → 로컬 브라우저; **서버 호스트는 Linux에 맞게 `design5-postgres` 또는 host-gateway 방식**으로 지정.

---

## 15. 기능 검증 완료 및 채팅 세션 정리 (2026-04-29)

팀에서 **사내망(Rocky + 터널) 기준 주요 기능 검증을 마친 시점**의 기록입니다. 세부 스펙은 SOT 문서·코드를 따릅니다.

### 15.1 검증 범위(요지)

- Chart Generator, Admin 대시보드, PPT(폰트 ZIP), eDM(생성·수정·삭제·스토리지), ICON, 메일(HTML/이미지 URL), Rocky `deploy/rocky`의 `.env` / `.env.app` 배치 등을 점검함.

### 15.2 이번 기간에 레포에 반영된 코드·문서

| 항목 | 내용 |
|------|------|
| **ICON 등 공개 URL** | `S3_PUBLIC_BASE_URL`이 비어 있을 때 `publicUrlForS3ObjectKey`가 키만 반환하던 문제 → `lib/s3/config.ts`에 `publicUrlForIconsKey`, `publicUrlForAvatarsKey`, `publicUrlForPptThumbnailsKey` 추가. `upload-icon`, `upload-ppt-thumbnail`, `profile/upload-avatar`에서 사용. |
| **아이콘 삭제** | `app/api/posts/[id]/route.ts` DELETE: DB에 파일명만 있는 레거시 행은 객체 키 폴백으로 MinIO 삭제 시도. |
| **Chart Generator** | 저장 프리셋 불러올 때 `chartType`이 UI에 반영되지 않던 문제 → `ChartSettingsPanel`에 `onChartTypeChange`, `ChartGeneratorPage`에서 연결. 구버전 localStorage 프리셋은 `chartType` 없으면 `bar`. |
| **Admin 대시보드** | `NEXT_PUBLIC_ADMINER_URL` 설정 시 **Adminer (PostgreSQL)** 버튼으로 새 탭 열기 — `app/(dashboard)/admin/dashboard/page.tsx`. 예시: `env.example.txt`, `deploy/rocky/.env.app.example`. |

### 15.3 논의만 정리된 운영·동작 메모 (참고)

- **Gmail / 그룹 계정**: App Password는 Google Cloud Console이 아니라 **해당 Google 계정** 보안 설정. 그룹(배포용) 주소만 있으면 SMTP용 사용자·릴레이·API 등은 Workspace/팀 정책으로 별도 결정.
- **`GMAIL_*`**: Next는 **루트** `.env` / `.env.local`; Docker 앱은 **`deploy/rocky/.env.app`**. **`deploy/rocky/.env`에는 넣지 않음**(Compose DB·MinIO 전용).
- **`.env` vs `.env.app`**: 파일을 **통째로 동일하게** 만들 수 없음 — 변수 집합이 다름. `cp .env.app.example .env.app` 후 각각 유지.
- **PPT 폰트 ZIP**: `app/api/categories/[slug]/zip/route.ts` → `uploadFile` → **`posts`** 버킷, 키 접두 **`categories/<slug>/zip/`** (예: `ppt` → `categories/ppt/zip/...`).
- **eDM 삭제 후 `edms` 잔존 객체**: `lib/r2-edm-storage.ts`의 `deleteEdmFileByUrl`은 `http(s)` URL일 때 **`S3_PUBLIC_BASE_URL`로 시작하는 경우에만** 키 추출 후 삭제. MinIO path-style이면 베이스는 보통 **`http://127.0.0.1:19000/edms`** 처럼 **버킷 경로까지** 맞출 것. 베이스가 비면 URL 저장분은 DB만 삭제되고 객체가 남을 수 있음.
- **메일 HTML의 이미지**: 수신 클라이언트·Gmail 등이 **원격으로 GET** 하므로 `http://127.0.0.1/...` 는 수신 환경에서 열리지 않음. 실발송용은 **인터넷에서 열리는 공개 URL(HTTPS 권장)** 이 필요. 발신 주소(`@pentasecurity.com`)만 바꿔서는 해결되지 않음.
- **`S3_PUBLIC_BASE_URL` in Rocky**: 데이터 평면 `deploy/rocky/.env`가 아니라 **Next가 읽는 `deploy/rocky/.env.app`**(또는 로컬 루트 `.env`)에 두는 것이 맞음.

### 15.4 운영 전환 시 후속

- §13·§8에 적힌 **TLS·최종 도메인·`NEXTAUTH_*` / `S3_PUBLIC_*`·URL 치환 dry-run** 등은 실제 공개 도메인 반영 후 재확인.

---

## 16. Rocky 일일 백업 — Postgres 덤프 + MinIO `mc mirror` (2026-04 세션 정리)

**실행 위치:** 백업·`crontab`은 **Postgres·MinIO Docker가 떠 있는 Rocky 서버**에서만 수행합니다(노트북 터널만으로는 cron 대상이 아님).  
**백업 디스크:** 대용량은 **`/data`**(예: `rl-data` 마운트) 아래에 두는 것을 권장합니다. [`deploy/WEBAPPS_LAYOUT.md`](../deploy/WEBAPPS_LAYOUT.md)의 `DATA_ROOT`(기본 `…/design5/data`)와 맞춥니다.

### 16.1 정책 요약

| 대상 | 방식 | 보관 |
|------|------|------|
| **PostgreSQL** | `docker exec design5-postgres` + `pg_dump -Fc` → 호스트 파일 | **일별 파일** + `find … -mtime +30 -delete` 등(팀 일수). |
| **MinIO** | `mc mirror --overwrite --remove` 로 **고정 루트 한 곳**에 버킷별 동기화 | **한 벌만 유지**(매일 같은 경로를 갱신). 두 번째 실행부터는 변경분 위주로 짧게 끝나는 경우가 많음. |

### 16.2 경로(예시)

- **데이터·Compose 볼륨:** `$DATA_ROOT` = `/data/webapps/design5/data` (`.env`의 `DATA_ROOT`).
- **Postgres 덤프:** `$DATA_ROOT/backups/pg/` — 파일명 예 `design5-YYYYMMDD-HHMM.dump`.
- **MinIO 미러:** `$DATA_ROOT/backups/minio/latest/<버킷>/` — 버킷은 [`deploy/rocky/scripts/minio-init.sh`](../deploy/rocky/scripts/minio-init.sh)와 동일: `posts`, `edms`, `avatars`, `icons`, `ppt-thumbnails`.
- **로그:** `$DATA_ROOT/backups/minio/minio-backup.log`(스크립트 내부), `…/backups/minio/cron.log`·`…/backups/pg/cron.log`(crontab 리다이렉트).

### 16.3 레포 스크립트

- **`deploy/rocky/scripts/backup-pg-dump.sh`** — `POSTGRES_USER` / `POSTGRES_DB`는 **`deploy/rocky/.env`의 `POSTGRES_*`와 반드시 일치**. 쉘 주석은 **`#`만** 사용(`//`는 Bash 주석이 아님).
- **`deploy/rocky/scripts/backup-minio.sh`** — 동일 사용자로 사전에 `mc alias set …`(예: alias `d5miniobackup`, 엔드포인트 `http://127.0.0.1:9000`, 키는 `.env`의 `MINIO_ROOT_*`와 맞춤). alias 검사는 `mc alias list` 출력 형식에 맞게 **`grep -Fx "${MC_ALIAS}"`** 사용. 기본 alias 이름은 스크립트 내 `MC_ALIAS="${MC_ALIAS:-d5miniobackup}"`의 **`:-`** 는 Bash “비어 있으면 기본값” 문법이며 이름의 하이픈이 아님.
- 예시 원본: [`backup-pg-dump-cron.example.sh`](../deploy/rocky/scripts/backup-pg-dump-cron.example.sh).

### 16.4 `mc` 준비(서버에서 1회)

1. 호스트에 MinIO Client(`mc`) 설치 후 `mc --version` 확인.  
2. `mc alias set <별칭> http://127.0.0.1:9000 '<MINIO_ROOT_USER>' '<MINIO_ROOT_PASSWORD>'` — **cron과 동일한 Linux 사용자**로 등록해야 `~/.mc/config.json`이 맞음.  
3. `mc ls <별칭>/` 로 버킷 목록 확인.  
4. 첫 미러 전 선택: `mc mirror --dry-run …` 로 한 버킷만 검토.

### 16.5 crontab 예시(I/O 분리)

Postgres와 MinIO를 **같은 새벽에 겹치지 않게** 두는 것을 권장합니다.

```cron
10 3 * * * /data/webapps/design5/deploy/rocky/scripts/backup-pg-dump.sh >> /data/webapps/design5/data/backups/pg/cron.log 2>&1
30 3 * * * /data/webapps/design5/deploy/rocky/scripts/backup-minio.sh >> /data/webapps/design5/data/backups/minio/cron.log 2>&1
```

- **`2>&1`** 까지 포함해야 stderr가 로그에 합쳐짐(`2>&`만 쓰면 잘못된 리다이렉션).  
- 스크립트: `chmod +x`, `crontab -e`는 **백업을 돌릴 사용자**(예: `design`).  
- `crontab -l`로 등록 확인. 수동 검증: 스크립트를 터미널에서 직접 실행 후 `echo $?`(0 기대), `ls`·`tail`로 덤프·로그 확인.

### 16.6 트러블슈팅 메모

- **`backup-minio.sh`가 즉시 exit 1:** `tail`로 `minio-backup.log` 확인. 과거에는 `mc alias list | grep -E …`가 **별칭 단독 줄**(뒤에 공백 없음) 형식과 맞지 않아 실패한 사례 있음 → 레포 스크립트는 `grep -Fx`로 정리됨.  
- **cron만 `mc: command not found`:** 스크립트의 `PATH`에 `mc` 설치 경로 추가 또는 절대 경로 사용.  
- **복구·오프사이트:** 한 서버 디스크만 두면 장애 시 함께 위험 — 팀 정책에 따라 NAS·다른 마운트로 주기 복사 검토.

---

*이 파일은 “이전 대화 맥락 요약”용이며, 제품 사양의 단일 출처(SOT)는 `env.example.txt`·`docs/DEPLOYMENT.md`·실제 코드를 따릅니다.*
