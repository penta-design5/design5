# LAYERARY

펜타시큐리티 디자인 자산 관리 포털

## 프로젝트 개요

LAYERARY는 펜타시큐리티의 디자인 작업물을 리뷰하고, 필요한 리소스(CI/BI, ICON, PPT 템플릿 등)를 검색·편집·다운로드할 수 있는 중앙 집중식 플랫폼입니다.

## 기술 스택

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Backend**: Next.js API Routes / Server Actions
- **Database**: PostgreSQL (사내망 자체 또는 호스티드)
- **ORM**: Prisma
- **Storage**: **S3 호환(MinIO 권장)** — 게시물·아바타·아이콘·eDM(`edms`) 등 **전부 동일 S3/MinIO**
- **Auth**: NextAuth.js (Auth.js)

## 사전 요구사항

- Node.js 18+
- npm

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 `env.example.txt`를 참고해 필요한 환경 변수를 설정하세요.

```bash
cp env.example.txt .env.local
```

**사내망(권장):** `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_*`, **`S3_*`**(엔드포인트·자격증명·버킷·`S3_PUBLIC_BASE_URL` 등). 상세는 `env.example.txt`, `env.local.internal.example.txt`, [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md), [deploy/rocky/README.md](deploy/rocky/README.md).

(구) 클라우드 B2·R2·Supabase는 **앱에서 사용하지 않습니다.** DB·이미지 URL 마이그레이션 기간이면 `env.example.txt`의 `legacy-asset-bases` 주석 참고.

### 객체 스토리지 (MinIO / S3 호환)

게시물·ZIP·썸네일 등은 **`S3_*`로 연결된 버킷**에 저장됩니다. Presigned **PUT** 직접 업로드 시 **CORS**에 앱 오리진을 넣어야 합니다.

### eDM 저장소

**`S3_*` + `edms` 버킷** — `lib/r2-edm-storage.ts` (R2 전용 경로는 제거됨). `S3_PUBLIC_BASE_URL`이 있으면 이메일·HTML에 **만료 없는 공개 URL**로 저장됩니다. 배포: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

### 3. 데이터베이스 마이그레이션

```bash
npm run db:migrate
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 프로덕션 빌드 및 실행

```bash
npm run build
npm run start
```

## 주요 기능

- **통합 검색**: Post, Diagram, Desktop Wallpaper, Card, WelcomeBoard 등 통합 검색
- **카테고리별 리소스 관리**
  - Penta Design, CI/BI, ICON, PPT, 다이어그램, eDM 등
  - PDF Extractor, Chart Generator
- **관리자 기능**: 회원 관리, 공지사항, 대시보드

## 스크립트

| 스크립트 | 설명 |
|---------|------|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 실행 |
| `npm run db:seed` | 시드 데이터 삽입 |
| `npm run db:migrate` | Prisma 마이그레이션 |
| `npm run db:studio` | Prisma Studio 실행 |

## 관련 문서

- [docs/API.md](docs/API.md) - API 엔드포인트 및 인증
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - 아키텍처 및 폴더 구조
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - 배포 가이드
- [docs/OPERATIONAL_MIGRATION.md](docs/OPERATIONAL_MIGRATION.md) - pg_restore·MinIO·URL 치환 순서
- [docs/PRISMA_MIGRATIONS.md](docs/PRISMA_MIGRATIONS.md) - `migrate deploy` / migrations Git 정책
- [docs/POSTGRES_RLS_INTERNAL.md](docs/POSTGRES_RLS_INTERNAL.md) - (선택) 사내 Postgres RLS
- [docs/SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md) - 시스템 아키텍처 다이어그램
- [docs/DATA_FLOW.md](docs/DATA_FLOW.md) - 데이터 플로우 다이어그램
- [docs/INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md) - 인프라 다이어그램
- [docs/SUPABASE_SECURITY_SETUP.md](docs/SUPABASE_SECURITY_SETUP.md) - (과거) Supabase; 사내 PG는 RLS·역할 정책을 별도 검토

## 라이선스

Private
