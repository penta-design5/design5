# 아키텍처 문서

## 폴더 구조

```
layerary/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 인증 레이아웃
│   │   ├── login/                # 로그인
│   │   ├── register/             # 회원가입
│   │   └── error/                # 인증 에러
│   ├── (dashboard)/              # 대시보드 레이아웃
│   │   ├── [slug]/               # 카테고리별 페이지 (동적 라우트)
│   │   │   ├── page.tsx          # 목록 페이지
│   │   │   └── [id]/page.tsx     # 상세 페이지
│   │   ├── admin/                # 관리자 페이지
│   │   │   ├── dashboard/        # 대시보드
│   │   │   ├── users/            # 회원 관리
│   │   │   └── notices/          # 공지사항
│   │   ├── diagram/              # 다이어그램 (목록/편집기)
│   │   ├── edm/                  # eDM (목록/편집기)
│   │   ├── chart-generator/      # 차트 생성기
│   │   ├── pdf-extractor/        # PDF 추출기
│   │   └── profile/              # 프로필
│   ├── _category-pages/          # 카테고리별 페이지 컴포넌트
│   │   ├── gallery/              # 갤러리형 (Penta Design)
│   │   ├── ci-bi/                # CI/BI
│   │   ├── character/            # 캐릭터
│   │   ├── ppt/, icon/           # PPT, 아이콘
│   │   ├── diagram/              # 다이어그램
│   │   ├── edm/                  # eDM
│   │   ├── desktop/              # 바탕화면
│   │   ├── card/                 # 감사/연말 카드
│   │   └── welcomeboard/         # 웰컴보드
│   └── api/                      # API Routes
├── components/
│   ├── layout/                   # MainLayout, Header, Sidebar
│   ├── category-pages/           # 카테고리별 UI (Card, UploadDialog, PropertyPanel 등)
│   ├── search/                   # SearchFilterDropdown, SearchResultsDialog
│   ├── chart-generator/          # 차트 생성기 UI
│   ├── pdf-extractor/            # PDF 추출기 UI
│   └── ui/                       # Shadcn UI 컴포넌트
├── lib/                          # 유틸 및 설정
│   ├── auth.ts, auth-helpers.ts  # NextAuth
│   ├── prisma.ts                 # Prisma 클라이언트
│   ├── b2.ts                     # 게시물 객체 업로드/다운로드(S3_* 우선). import 경로 유지
│   ├── b2-client-url.ts         # 클라이언트용 공개 스토리지 URL 판별(getB2ImageSrc 등)
│   ├── r2-edm-storage.ts (S3/MinIO eDM), supabase-ppt-thumbnail (S3 삭제 헬퍼; 이름 유지)
│   ├── categories.ts             # 카테고리 조회
│   └── *.ts                      # 스키마, 유틸
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── types/                        # TypeScript 타입 정의
```

---

## 주요 컴포넌트 관계

- **MainLayout** (Sidebar, Header) → `[slug]` → 카테고리별 ListPage/DetailPage
- **Header**: SearchFilterDropdown, SearchResultsDialog (통합 검색)
- **카테고리 페이지**: ListPage + Card + UploadDialog + PropertyPanel 패턴
- **특수 페이지**: Diagram, eDM (목록/편집기), Chart Generator, PDF Extractor

---

## 라우팅 구조

| 경로 | 설명 |
|------|------|
| `/` | 홈 (리다이렉트) |
| `/login`, `/register`, `/error` | 인증 (공개) |
| `/[slug]` | 카테고리 목록 (예: /ci-bi, /ppt) |
| `/[slug]/[id]` | 카테고리별 상세 |
| `/admin/*` | 관리자 전용 (ADMIN 역할) |
| `/diagram`, `/diagram/editor`, `/diagram/[id]` | 다이어그램 |
| `/edm`, `/edm/editor`, `/edm/[id]` | eDM |
| `/chart-generator` | 차트 생성기 |
| `/pdf-extractor` | PDF 추출기 |
| `/profile` | 프로필 |

---

## 상태 관리

- **서버**: Prisma(Postgres), NextAuth 세션
- **클라이언트**: `useState`, `useEffect` (전역 상태 관리 라이브러리 미사용)

---

## 데이터 플로우

1. **페이지 로드**
   - `getCategoryBySlug` / `getCategories` (캐싱) → 카테고리 정보
   - API fetch (`/api/posts`, `/api/diagrams` 등) → 리소스 목록
   - 렌더링 (ListPage → Card 컴포넌트)

2. **업로드**
   - FormData/JSON → API Route → **S3/MinIO**(또는 레거시 R2) 업로드 → DB 저장
   - 서버 경유 업로드와 Presigned **PUT** 직접 업로드가 혼재. 직접 업로드 시 객체 스토리지 **CORS**에 앱 오리진 필요.

3. **검색**
   - Header 검색창 → `GET /api/search?q=...&categorySlug=...` → SearchResultsDialog

---

## 인증 흐름

- **middleware.ts**
  - `/admin`: ADMIN 역할만 접근, 그 외 리다이렉트
  - `/login`, `/register`, `/error`: 공개
  - API 라우트: 각 Route Handler에서 개별 인증 처리

- **API**
  - `auth()`, `requireAuth()`, `requireAdmin()` (`lib/auth-helpers.ts`) 사용

---

## 주기 작업·백업

- **Keepalive**: 퍼블릿 `APP_URL`이면 `.github/workflows/keepalive.yml` 또는 [KEEPALIVE_SETUP.md](KEEPALIVE_SETUP.md). 사내망 전용 URL이면 서버 `cron` + `curl` 권장.
- **DB 백업**: 레거시는 `backup-supabase-to-b2.yml`. 사내망은 `pg_dump` + (선택) MinIO — [deploy/rocky/README.md](../deploy/rocky/README.md).
