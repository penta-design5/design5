# API 문서

## 인증 방식 개요

API는 NextAuth 세션 기반 인증을 사용합니다.

- **`auth()`**: 현재 세션 조회. 미인증 시 `null` 반환
- **`requireAuth()`**: 로그인 필수. 미인증 시 `Error("Unauthorized")` 발생
- **`requireAdmin()`**: ADMIN 역할 필수. 미인증/비관리자 시 `Error` 발생

클라이언트는 쿠키에 저장된 세션을 자동으로 전송합니다. API Routes는 `auth()`, `requireAuth()`, `requireAdmin()` 등 `lib/auth-helpers.ts` 유틸을 사용해 인증을 처리합니다.

---

## 엔드포인트 요약

### Auth

| 메서드 | 경로 | 인증 | 용도 |
|--------|------|------|------|
| - | `/api/auth/[...nextauth]` | - | NextAuth (로그인, 로그아웃, 세션) |
| POST | `/api/auth/register` | 없음 | 회원가입 (pentasecurity.com 도메인만) |

**회원가입 요청 예시 (POST /api/auth/register)**

```json
{
  "name": "홍길동",
  "email": "user@pentasecurity.com",
  "password": "abc123!@#"
}
```

---

### Search

| 메서드 | 경로 | 인증 | 용도 |
|--------|------|------|------|
| GET | `/api/search` | 로그인 필수 | 통합 검색 (Post, Diagram, Desktop, Card, WelcomeBoard) |

**쿼리 파라미터**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| q | string | 검색어 (제목 등) |
| categorySlug | string | 카테고리 필터 (diagram, wallpaper, card, welcome-board 등) |
| dateFrom | string | 날짜 필터 시작 (ISO) |
| dateTo | string | 날짜 필터 종료 (ISO) |

**응답 예시**

```json
{
  "results": [
    {
      "id": "...",
      "resourceType": "post",
      "categoryName": "CI/BI",
      "categorySlug": "ci-bi",
      "title": "제목",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "slug": "ci-bi",
      "pageType": "ci-bi"
    }
  ]
}
```

---

### Posts

| 메서드 | 경로 | 인증 | 용도 |
|--------|------|------|------|
| GET | `/api/posts` | 없음 | 게시물 목록 (categorySlug, page, limit, concept, tag, year) |
| POST | `/api/posts` | ADMIN | 게시물 생성 |
| GET | `/api/posts/[id]` | - | 게시물 상세 |
| PUT | `/api/posts/[id]` | ADMIN | 게시물 수정 |
| DELETE | `/api/posts/[id]` | ADMIN | 게시물 삭제 |
| POST | `/api/posts/upload` | ADMIN | 파일 업로드 (서버 경유, Penta Design 등) |
| POST | `/api/posts/upload-presigned` | ADMIN | Presigned URL 발급. 클라이언트가 **HTTP PUT**으로 객체 스토리지(S3/MinIO)에 직접 업로드할 때 사용(CI/BI, Character, PPT 등). 브라우저 직접 업로드 시 **버킷 CORS**에 앱 오리진 필요. 참고: [DEPLOYMENT.md](DEPLOYMENT.md) |
| POST | `/api/posts/upload-icon` | ADMIN | 아이콘 업로드 |
| ... | 기타 posts 하위 라우트 | - | 썸네일, 다운로드 등 |

---

### Categories

| 메서드 | 경로 | 인증 | 용도 |
|--------|------|------|------|
| GET | `/api/categories/[slug]/guide-video` | 없음 | 가이드 영상 정보 조회 |
| POST | `/api/categories/[slug]/guide-video` | ADMIN | 가이드 영상 업로드 |
| DELETE | `/api/categories/[slug]/guide-video` | ADMIN | 가이드 영상 삭제 |
| GET | `/api/categories/[slug]/zip` | 없음 | ZIP 파일 정보 조회 |
| POST | `/api/categories/[slug]/zip` | ADMIN | ZIP 업로드 |
| DELETE | `/api/categories/[slug]/zip` | ADMIN | ZIP 삭제 |

---

### Diagrams

| 메서드 | 경로 | 인증 | 용도 |
|--------|------|------|------|
| GET | `/api/diagrams` | 로그인 | 본인 다이어그램 목록 (page, limit) |
| POST | `/api/diagrams` | 로그인 | 다이어그램 생성 |
| GET | `/api/diagrams/[id]` | 로그인(본인) | 다이어그램 상세 |
| PUT | `/api/diagrams/[id]` | 로그인(본인) | 다이어그램 수정 |
| DELETE | `/api/diagrams/[id]` | 로그인(본인) | 다이어그램 삭제 |
| GET | `/api/diagrams/zip` | 로그인 | 다이어그램 ZIP 다운로드 |

---

### eDM

| 메서드 | 경로 | 인증 | 용도 |
|--------|------|------|------|
| GET | `/api/edm` | 로그인 | eDM 목록 (관리자: 전체, 일반: 본인) |
| POST | `/api/edm` | 로그인 | eDM 생성 (FormData: image, title, description, gridConfig, cellLinks, alignment). 셀 이미지는 Cloudflare R2에 저장 |
| GET | `/api/edm/[id]` | 로그인 | eDM 상세 |
| PATCH | `/api/edm/[id]` | 로그인 | eDM 수정 |
| DELETE | `/api/edm/[id]` | 로그인 | eDM 삭제 |

---

### Admin

| 메서드 | 경로 | 인증 | 용도 |
|--------|------|------|------|
| GET | `/api/admin/users` | ADMIN | 사용자 목록 |
| GET | `/api/admin/users/[id]/role` | ADMIN | 사용자 역할 조회 |
| PATCH | `/api/admin/users/[id]/role` | ADMIN | 사용자 역할 변경 |
| GET | `/api/admin/notices` | ADMIN | 공지 목록 |
| POST | `/api/admin/notices` | ADMIN | 공지 생성 |
| GET | `/api/admin/dashboard/stats` | ADMIN | 대시보드 통계 (게시물 수, 이미지 수 등) |

---

### Profile

| 메서드 | 경로 | 인증 | 용도 |
|--------|------|------|------|
| GET | `/api/profile/me` | 로그인 | 내 프로필 조회 |
| PATCH | `/api/profile/update` | 로그인 | 프로필 수정 |
| POST | `/api/profile/change-password` | 로그인 | 비밀번호 변경 |
| POST | `/api/profile/check-password` | 로그인 | 비밀번호 확인 |
| POST | `/api/profile/upload-avatar` | 로그인 | 아바타 업로드 |
| POST | `/api/profile/remove-avatar` | 로그인 | 아바타 삭제 |
| POST | `/api/profile/delete-account` | 로그인 | 계정 삭제 |

---

### Keepalive

| 메서드 | 경로 | 인증 | 용도 |
|--------|------|------|------|
| GET | `/api/keepalive` | 선택 (KEEPALIVE_SECRET) | Supabase 비활동 방지 (DB/Storage ping) |

`KEEPALIVE_SECRET`이 설정된 경우 `Authorization: Bearer <secret>` 헤더가 필요합니다. GitHub Actions 등에서 3~4일마다 호출하는 것을 권장합니다.

**응답 예시**

```json
{
  "ok": true,
  "db": true,
  "supabase": true,
  "at": "2025-02-12T00:00:00.000Z"
}
```

---

### 기타 리소스 API

| 경로 | 메서드 | 인증 | 용도 |
|------|--------|------|------|
| `/api/card-templates` | GET, POST | - | 카드 템플릿 |
| `/api/card-templates/[id]` | GET, PUT, DELETE | - | 카드 템플릿 CRUD |
| `/api/desktop-wallpapers` | GET, POST | - | 바탕화면 리소스 |
| `/api/desktop-wallpapers/[id]` | GET, PUT, DELETE | - | 바탕화면 CRUD |
| `/api/welcomeboard-templates` | GET, POST | - | 웰컴보드 템플릿 |
| `/api/welcomeboard-templates/[id]` | GET, PUT, DELETE | - | 웰컴보드 CRUD |
| `/api/notices` | GET | - | 공지 목록 (일반) |
| `/api/notices/[id]` | GET | - | 공지 상세 |

세부 스키마는 각 route 파일을 참조하세요.
