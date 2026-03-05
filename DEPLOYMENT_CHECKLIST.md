# Vercel 배포 전 체크리스트

## ✅ 완료된 점검 사항

- **TypeScript**: 타입 체크 통과 (`npx tsc --noEmit`)
- **ESLint**: 린트 오류 없음 (`npm run lint`)
- **빌드**: 프로덕션 빌드 성공 (`npm run build`)

## 📋 배포 전 필수 작업

### 1. Prisma 마이그레이션 (DiagramZipConfig)

DiagramZipConfig 테이블을 위한 마이그레이션이 추가되었습니다.

**개발 DB에 이미 `db push`로 테이블이 생성된 경우:**
```bash
# 마이그레이션을 "이미 적용됨"으로 표시 (테이블이 이미 존재하므로)
npx prisma migrate resolve --applied 20260130000000_add_diagram_zip_config
```

**프로덕션 DB (Vercel 배포 시):**
- Vercel 프로젝트 설정 → Settings → General → Build & Development Settings
- **Build Command**를 `prisma migrate deploy && next build`로 지정하세요.
- 이렇게 하면 배포 시 `diagram_zip_config` 테이블이 자동 생성됩니다.

**⚠️ Prisma 마이그레이션 폴더와 .gitignore:**  
현재 `.gitignore`에 `/prisma/migrations`가 있어서 마이그레이션 폴더가 GitHub에 올라가지 않습니다.  
- **`prisma migrate deploy`를 쓰려면:** `prisma/migrations`를 저장소에 포함해야 합니다. `.gitignore`에서 해당 줄을 제거한 뒤 마이그레이션을 커밋하세요.  
- **마이그레이션 없이 쓰는 경우:** 프로덕션 DB는 로컬에서 `prisma db push`로 스키마를 맞춰 두고, Vercel **Build Command**는 `next build`만 사용하세요.

### 2. Vercel 환경 변수 확인

다음 환경 변수가 Vercel 프로젝트에 설정되어 있는지 확인하세요:

| 변수 | 필수 | 설명 |
|------|------|------|
| `DATABASE_URL` | ✅ | Supabase PostgreSQL 연결 URL |
| `DIRECT_URL` | ✅ | Supabase 직접 연결 URL (마이그레이션용) |
| `NEXTAUTH_URL` | ✅ | 배포 URL (예: https://your-app.vercel.app) |
| `NEXTAUTH_SECRET` | ✅ | NextAuth 시크릿 키 |
| `B2_APPLICATION_KEY_ID` | ✅ | Backblaze B2 (다이어그램 ZIP 저장용) |
| `B2_APPLICATION_KEY` | ✅ | Backblaze B2 |
| `B2_BUCKET_ID` | ✅ | Backblaze B2 |
| `B2_BUCKET_NAME` | ✅ | Backblaze B2 |
| `B2_ENDPOINT` | ✅ | Backblaze B2 엔드포인트 |

### 3. Supabase 연결

- Supabase는 프록시(Connection Pooler) 방식 사용 시 `connection_limit=1` 파라미터가 `lib/prisma.ts`에 자동 적용됩니다.
- `DIRECT_URL`은 마이그레이션 실행 시 사용됩니다 (Transaction 모드 연결).

### 4. Supabase Storage - eDM 버킷

eDM 이미지는 Supabase Storage를 사용합니다. 다음 버킷을 생성해야 합니다:

1. Supabase Dashboard → **Storage** → **New bucket**
2. 버킷 이름: `edms`
3. **Public bucket** 체크 (이메일 등에서 직접 URL 접근 가능)
4. **Create bucket** 클릭

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

1. **Konva/Canvas**: next.config.js에서 서버 사이드 빌드 시 `konva`, `canvas`를 externals로 처리합니다. Vercel에서 정상 동작합니다.

2. **Sharp**: 이미지 처리에 사용됩니다. Vercel 기본 환경에서 지원됩니다.

3. **bcryptjs**: Edge Runtime 미지원 경고가 있을 수 있으나, API 라우트에서만 사용되므로 문제없습니다.
