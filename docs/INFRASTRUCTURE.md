# 인프라 다이어그램

배포 환경의 물리적/논리적 구조를 표현합니다. Vercel, Supabase, Backblaze B2, GitHub가 실제로 어떻게 연결되는지 보여줍니다.

## 인프라 개요

```mermaid
flowchart TB
  subgraph users [Users]
    U1[User]
  end

  subgraph cdn [Vercel Edge Network]
    CDN[CDN]
  end

  subgraph vercel [Vercel]
    Serverless[Serverless Functions]
    Static[Static Assets]
  end

  subgraph supabase [Supabase]
    PgSQL[(PostgreSQL)]
    Pooler[Connection Pooler]
    Storage[Storage - edms bucket]
  end

  subgraph b2 [Backblaze B2]
    Bucket[B2 Bucket]
  end

  subgraph github [GitHub]
    Repo[Repository]
    Actions[GitHub Actions]
  end

  U1 -->|HTTPS| CDN
  CDN --> Serverless
  CDN --> Static
  Serverless -->|DATABASE_URL| Pooler
  Pooler --> PgSQL
  Serverless -->|Service Role| Storage
  Serverless -->|B2 API| Bucket
  Repo -->|push| vercel
  Actions -->|3일마다| Serverless
```

## 구성 요소별 설명

### Vercel

| 구성요소 | 설명 |
|----------|------|
| **CDN (Edge Network)** | 전 세계 엣지에서 정적 에셋 및 이미지 최적화 제공 |
| **Serverless Functions** | Next.js API Routes, Server Components가 실행되는 런타임 |
| **Static Assets** | `public/`, 빌드 결과물 등 정적 파일 |

- **배포**: GitHub push 시 자동 빌드·배포
- **빌드 명령**: `prisma migrate deploy && next build`

### Supabase

| 구성요소 | 설명 | 환경 변수 |
|----------|------|------------|
| **Connection Pooler** | Session 모드 연결 풀. Prisma용 | `DATABASE_URL` (connection_limit=1 권장) |
| **PostgreSQL** | 메인 DB. 마이그레이션은 Direct 연결 사용 | `DIRECT_URL` |
| **Storage (edms)** | eDM 셀 이미지용 Public 버킷 | `SUPABASE_SERVICE_ROLE_KEY` |

### Backblaze B2

| 구성요소 | 설명 | 환경 변수 |
|----------|------|------------|
| **B2 Bucket** | 게시물 이미지, 다이어그램 썸네일, PPT ZIP, 가이드 영상 등 | `B2_APPLICATION_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET_ID`, `B2_BUCKET_NAME`, `B2_ENDPOINT` |

### GitHub

| 구성요소 | 설명 |
|----------|------|
| **Repository** | 소스 코드. push 시 Vercel 트리거 |
| **GitHub Actions** | 3일마다 `{APP_URL}/api/keepalive` 호출 (Supabase 비활동 방지) |

- **Variables**: `APP_URL` (배포 URL)
- **Secrets** (선택): `KEEPALIVE_SECRET`

## 환경 변수 연결 관계

```mermaid
flowchart LR
  subgraph vercel [Vercel Environment]
    V[Next.js App]
  end

  subgraph env [환경 변수]
    E1[DATABASE_URL]
    E2[DIRECT_URL]
    E3[NEXTAUTH_URL]
    E4[B2_*]
    E5[SUPABASE_*]
  end

  V --> E1
  V --> E2
  V --> E3
  V --> E4
  V --> E5

  E1 --> Pooler[Supabase Pooler]
  E2 --> PgSQL[Supabase Direct]
  E4 --> B2[Backblaze B2]
  E5 --> Storage[Supabase Storage]
```

## 관련 문서

- [DEPLOYMENT.md](DEPLOYMENT.md) - 배포 가이드
- [KEEPALIVE_SETUP.md](KEEPALIVE_SETUP.md) - Keepalive 설정
- [Mermaid Live Editor](https://mermaid.live) - 다이어그램 PNG/SVG 내보내기
