# 배포 전 체크리스트

## ✅ 완료된 점검 사항 (공통)

- **TypeScript**: 타입 체크 통과 (`npx tsc --noEmit`)
- **ESLint**: 린트 오류 없음 (`npm run lint`)
- **빌드**: 프로덕션 빌드 성공 (`npm run build`)

---

## 사내망 배포 (PostgreSQL + MinIO)

### 인프라

- [ ] `deploy/rocky` 기준 Postgres·MinIO 기동, `DATA_ROOT`·`.env` 확인 ([`deploy/rocky/README.md`](deploy/rocky/README.md))
- [ ] MinIO 버킷: `posts`, `edms`, `avatars`, `icons`, `ppt-thumbnails` 등 팀 스펙과 일치
- [ ] **Presigned PUT** 사용 시 MinIO(또는 게이트웨이) **CORS**에 프로덕션·개발 앱 오리진 허용
- [ ] (선택) Nginx·TLS·`client_max_body_size`, `X-Forwarded-Proto`

### 앱 환경 변수

- [ ] `DATABASE_URL`, `DIRECT_URL` → 사내 Postgres
- [ ] `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION`, `S3_FORCE_PATH_STYLE`, `S3_BUCKET_*`
- [ ] `S3_PUBLIC_BASE_URL`, `NEXT_PUBLIC_S3_PUBLIC_BASE_URL` (브라우저·이메일용 공개 URL이 있을 때)
- [ ] `NEXTAUTH_URL`, `NEXTAUTH_SECRET` (실제 사용자 HTTPS URL과 일치)
- [ ] (선택) `KEEPALIVE_SECRET` + 서버 `cron`에서 `/api/keepalive` 호출

### Prisma·데이터

- [ ] `npx prisma migrate deploy` 또는 팀이 정한 스키마 반영 절차 ([`docs/PRISMA_MIGRATIONS.md`](docs/PRISMA_MIGRATIONS.md))
- [ ] **`pg_restore`만 한 DB**면 baseline 충돌 시 `migrate resolve --applied "20260427120000_baseline"` 여부 검토
- [ ] URL 치환: [`docs/OPERATIONAL_MIGRATION.md`](docs/OPERATIONAL_MIGRATION.md) · `npm run db:migrate-storage-urls:dry`

### 운영

- [ ] GitHub Actions keepalive/백업 워크플로: 사내망만이면 **비활성**하고 사내 백업·핑으로 대체할지 결정

---

## Vercel·클라우드 배포 (선택 / 레거시)

### 1. Prisma 마이그레이션

- 레포에 **`prisma/migrations/`** 가 포함되어 있으며, 첫 항목은 **`20260427120000_baseline`**(빈 DB용 전체 DDL)입니다.  
- 상세·복원 DB 처리: [`docs/PRISMA_MIGRATIONS.md`](docs/PRISMA_MIGRATIONS.md), [`prisma/migrations/README.md`](prisma/migrations/README.md).

**프로덕션(Vercel 등) Build Command 예:** `prisma migrate deploy && next build`

**이전에 다른 이름의 마이그레이션만 `resolve` 했던 DB**는 팀 기존 절차를 우선합니다.

### 2. Vercel 환경 변수 확인

| 변수 | 필수 | 설명 |
|------|------|------|
| `DATABASE_URL` | ✅ | Postgres (사내망 / 풀러 등) |
| `DIRECT_URL` | ✅ | 마이그레이션용 직접 연결 |
| `NEXTAUTH_URL` | ✅ | 배포 URL |
| `NEXTAUTH_SECRET` | ✅ | NextAuth 시크릿 |
| `S3_*` | ✅ (권장) | MinIO(게시물·아바타·eDM·아이콘·PPT 등) |

(구) B2·R2·Supabase Storage는 앱에서 사용하지 않습니다. DB에 옛 URL이 있으면 `lib/legacy-asset-bases` env로 마이그레이션 기간만 대응.

### 3. DB 연결

- Connection Pooler 사용 시 `connection_limit=1` 권장 (`lib/prisma.ts` 참고).
- `DIRECT_URL`은 마이그레이션 실행 시 사용됩니다.

### 4. eDM 객체 스토리지

- **`S3_*` + `edms` 버킷** — `lib/r2-edm-storage.ts` (S3/MinIO만, R2 분기 제거)
- 공개 URL: `S3_PUBLIC_BASE_URL` / `NEXT_PUBLIC_S3_PUBLIC_BASE_URL`

---

## 📁 최근 변경 사항 요약

### 다이어그램 페이지
- `DiagramListPage`, `DiagramEditorPage` - 다이어그램 CRUD
- `DiagramZipSection` - ZIP 파일 업로드/다운로드 (관리자)
- `DiagramZipConfig` 모델 - ZIP 파일 메타데이터 저장
- `/api/diagrams/zip` - ZIP API (GET, POST, DELETE)

### Toast/Confirm UI 변경
- `alert()` → `toast.error()`, `toast.success()` (sonner)
- `confirm()` → `useConfirmDialog().confirm()` (커스텀 AlertDialog)
- `ConfirmDialogProvider`, `Toaster` - `app/providers.tsx`에 추가됨

## ⚠️ 주의사항

1. **Konva/Canvas**: `next.config.js`에서 서버 사이드 빌드 시 `konva`, `canvas`를 externals로 처리합니다.

2. **Sharp**: 이미지 처리에 사용됩니다. Node 런타임·컨테이너에 포함되도록 하세요.

3. **bcryptjs**: Edge Runtime 미지원 경고가 있을 수 있으나, API 라우트에서만 사용되므로 문제없습니다.
