# 배포 가이드

## 개요

이 프로젝트는 두 가지 배포 모델을 지원합니다.

| 모델 | DB | 객체 스토리지 | 앱 실행 |
|------|----|----------------|---------|
| **사내망(권장, 옵션 B)** | 자체 PostgreSQL | MinIO(S3 호환) | 단일 서버·Docker·Nginx 등 자체 호스팅 |
| **클라우드(레거시, 참고용)** | — | (과거) Supabase / R2 등 | Vercel 등 |

사내망 전용 요약·Rocky 예시: [`deploy/rocky/README.md`](../deploy/rocky/README.md), 디렉터리 규칙: [`deploy/WEBAPPS_LAYOUT.md`](../deploy/WEBAPPS_LAYOUT.md).  
환경 변수 스펙: 루트 [`env.example.txt`](../env.example.txt), 노트북→내부망: [`env.local.internal.example.txt`](../env.local.internal.example.txt).

**데이터 이전·URL 치환:** [`OPERATIONAL_MIGRATION.md`](OPERATIONAL_MIGRATION.md) · **Prisma 마이그레이션 정책:** [`PRISMA_MIGRATIONS.md`](PRISMA_MIGRATIONS.md) · **(선택) 사내 PG RLS:** [`POSTGRES_RLS_INTERNAL.md`](POSTGRES_RLS_INTERNAL.md).

---

## 1. 사내망 배포 (PostgreSQL + MinIO)

### 1.1 데이터 평면

1. 서버에 `deploy/rocky/.env`를 준비하고(`deploy/rocky/.env.example` 참고), `DATA_ROOT` 아래에 Postgres·MinIO 데이터가 쌓이도록 합니다.
2. `docker compose --env-file .env up -d`로 **PostgreSQL 17**과 **MinIO**를 기동합니다. 버킷 초기화는 `docker-compose.yml`의 init 서비스 또는 팀 스크립트를 따릅니다.
3. MinIO **콘솔(기본 9001)**·API(9000)는 기본이 `127.0.0.1` 바인딩입니다. 다른 PC에서 직접 쓰려면 `.env`의 `HOST_BIND`와 방화벽을 조정합니다.

### 1.2 Next.js 앱 환경 변수

앱이 읽는 `.env` / `.env.production` 등에 다음을 맞춥니다.

- **DB**: `DATABASE_URL`, `DIRECT_URL` — 사내 Postgres 연결 문자열 (`connection_limit=1` 권장).
- **객체 스토리지(필수)**: `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION`, `S3_FORCE_PATH_STYLE`(MinIO는 `true` 권장), 버킷명 `S3_BUCKET_POSTS` 등. 브라우저·이메일에 노출되는 공개 GET URL이 있으면 `S3_PUBLIC_BASE_URL` 및 `NEXT_PUBLIC_S3_PUBLIC_BASE_URL`을 동일 호스트로 둡니다.
- **인증**: `NEXTAUTH_URL`(실제 사용자가 여는 HTTPS URL), `NEXTAUTH_SECRET`, (선택) Google OAuth.
- **Keepalive(선택)**: `KEEPALIVE_SECRET` — 사내 `cron`에서 `curl`로 `/api/keepalive` 호출 시 동일 값을 `Authorization: Bearer`로 전달합니다.

**객체 스토리지(필수)** — 앱은 **S3/MinIO만** 사용합니다(아바타·아이콘·PPT·eDM·게시물). eDM는 `S3_*` + `S3_BUCKET_EDMS`(또는 기본 `edms`). Supabase Storage REST·R2·B2 앱 API는 제거됨.

### 1.3 Presigned 업로드와 MinIO CORS

CI/BI, Character, PPT 등은 `/api/posts/upload-presigned`로 받은 URL에 대해 브라우저가 **HTTP PUT**으로 객체를 직접 올립니다. MinIO 버킷(또는 앞단 Nginx)의 **CORS**에 다음을 허용해야 합니다.

- 앱 오리진: 예) `https://design.example.corp`, 개발 시 `http://localhost:3000`
- 메서드: `PUT`, `GET`, (필요 시) `HEAD`
- `Authorization`, `Content-Type` 등 프리플라이트에 필요한 헤더

설정은 MinIO 콘솔, `mc`, 또는 S3 호환 API로 합니다. (이전 B2 전용 `npm run b2:setup-cors` 스크립트는 제거되었습니다.)

### 1.4 Prisma 마이그레이션

배포 파이프라인 또는 수동으로 스키마를 맞춥니다.

```bash
npx prisma migrate deploy
```

팀 정책에 따라 `prisma db push`만 쓰는 경우, 프로덕션 DB와 스키마를 사전에 일치시켜 두어야 합니다.  
`.gitignore`에 `prisma/migrations`가 있으면 `migrate deploy`를 쓰기 어렵습니다 — 마이그레이션을 Git에 포함할지 팀에서 결정합니다.

### 1.5 빌드·실행·리버스 프록시

```bash
npm ci
npm run build
npm run start
```

프로덕션에서는 **Nginx(또는 동급)** 뒤에 Next를 두고, `X-Forwarded-Proto` 등을 넘겨 `NEXTAUTH_URL`과 실제 URL이 일치하도록 합니다. NextAuth는 `trustHost` 설정을 사용합니다(`lib/auth.ts`).

**Docker(Next standalone + Nginx)로 한 번에** 올릴 때는 `deploy/rocky`의 `docker-compose.app.yml`·`Dockerfile`·`.env.app.example`을 사용합니다. 절차는 [`deploy/rocky/README.md`](../deploy/rocky/README.md) **8) (선택) 풀스택** 절을 따릅니다.

---

## 2. Keepalive·백업 (사내망)

- **헬스**: 앱이 떠 있는 호스트에서 `GET /api/keepalive`를 주기적으로 호출합니다. DB `SELECT 1`과, `S3_*` 설정 시 S3 `ListBuckets`로 스토리지 연결을 확인합니다. 자세한 절차는 [`deploy/rocky/README.md`](../deploy/rocky/README.md)의「사내망 운영」절을 참고하세요.
- **DB 백업**: `pg_dump`를 `cron`으로 실행하고, 필요 시 덤프를 MinIO 백업 버킷 등으로 복사합니다.
- **GitHub Actions** (`.github/workflows/keepalive.yml`, `backup-supabase-to-b2.yml`): 퍼블릿 URL·클라우드 전제입니다. 사내망만 쓰는 경우 **워크플로 비활성화**하고 위 사내 작업으로 대체하는 것이 일반적입니다. 워크플로 파일 상단 주석을 참고하세요.

[`docs/KEEPALIVE_SETUP.md`](KEEPALIVE_SETUP.md)에는 GitHub 방식과 사내망 `cron` 방식이 모두 설명되어 있습니다.

---

## 3. (선택) Vercel + 클라우드 스토리지

Vercel 등 퍼블릿 배포도 **S3/MinIO 필수**로 맞춥니다(구 클라우드 R2/Supabase Storage 경로는 제거).

- 빌드 명령 예: `prisma migrate deploy && next build`
- 객체 스토리지: `S3_*` (MinIO 또는 S3 호환)
- eDM: `lib/r2-edm-storage.ts`는 S3( MinIO)만

---

## 4. 도메인·OAuth

- 사내망: 내부 DNS·TLS 인증서로 사용자에게 열리는 **단일 HTTPS 베이스 URL**을 정하고 `NEXTAUTH_URL`에 동일하게 넣습니다.
- Google OAuth: Google Cloud Console에 **승인된 리다이렉트 URI**로 `https://<도메인>/api/auth/callback/google` 등을 등록합니다.

---

## 5. 주의사항

1. **Konva/Canvas**: `next.config.js`에서 서버 빌드 시 externals 처리.
2. **Sharp**: 이미지 썸네일·처리에 사용. Node 런타임에 포함되도록 배포 이미지를 맞춥니다.
3. **bcryptjs**: Edge Runtime 미지원 경고가 있어도 API 라우트 한정 사용이면 무방합니다.
