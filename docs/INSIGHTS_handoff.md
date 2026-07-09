# INSIGHTS 구현 Handoff (진행 상태)

> 스펙 문서: [INSIGHTS_구현계획.md](./INSIGHTS_구현계획.md)
> **구현 진행 상태의 단일 원본(source of truth)은 이 문서다.** 계획서는 스펙으로 고정하고, 단계 진행/완료 시 이 문서만 갱신한다.

- 대상: 사이드바 LABs 다음 **INSIGHTS** 섹션 신설 + 「AI 사용가이드」(카드 갤러리)·「최신 동향」(게시판) 2개 페이지
- 핵심 결정: HTML=단일 자기완결형 `.html`(S3 저장·iframe 뷰어) · 전용 모델 `InsightPost` 단일(**태그 없음**) · 두 페이지 구독 대상 · **페이지 내 검색 없음(헤더 통합검색 사용)**
- 최종 업데이트: 2026-07-09 (P0~P6 완료 ✅ + 사내망 확인, P7만 대기) · 푸시: `origin/2026-06-17-tiper` (최신 `f2488af`)
- **다음 세션 시작점: P7 (반응형/권한/QA 최종 점검)** — 아래 "Phase별 상세 > Phase 7" 체크리스트부터 진행. P0~P6 코드+UI는 사내망 검증 완료.

범례: ⬜ 대기 · 🟡 진행중 · ✅ 완료 · ⛔ 블록

---

## 진행 현황 요약

| Phase | 내용 | 상태 | 브랜치/커밋 | 검증 |
| --- | --- | --- | --- | --- |
| P0 | 스키마·마이그레이션·시드 (`INSIGHTS` enum, `InsightPost`, 카테고리 2건) | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` (1cb1d47) | validate/generate + `migrate deploy` 적용 + 시드 + 개발망 DB 조회 검증 ✅ |
| P1 | 사이드바 섹션 + 라우팅 골격 | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` (1cb1d47) | tsc 0 / lint 0(신규파일) / `next dev`에서 `/ai-guide`·`/latest-trends`(+상세) 4경로 200 ✅ |
| P2 | 스토리지 업로드/뷰어 + REST API (백엔드) | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` (1cb1d47) | tsc 0 / lint 0(신규 6파일) / 7개 라우트 무인증 **401** 확인. 실 업로드/DB/S3·구독메일은 개발망 대기 |
| P3 | 공용 업로드/수정 Dialog + 공용 상세 iframe 뷰어 | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` (1cb1d47) | tsc 0 / lint 0(신규 2파일) / 상세 2경로 200·컴파일 클린. 실 업로드→iframe 렌더·수정·삭제는 개발망 대기 |
| P4 | 「AI 사용가이드」 카드 갤러리 | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` | tsc 0 / lint 0 / `/ai-guide` 200. **사내망 확인: 추가/수정/삭제 정상 ✅**. 헤더 좌측 여백·타이틀 위치 레이아웃 픽스 반영 |
| P5 | 「최신 동향」 게시판 테이블 | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` | tsc 0 / lint 0 / `/latest-trends` 200. **사내망 확인 ✅** |
| P6 | 헤더 통합검색 편입 + 구독 연결 확인 | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` | tsc 0 / lint 0 / `/api/search` 401 게이팅. **사내망 확인 ✅** |
| P7 | 반응형/권한/QA + 최종 검증 | ⬜ 대기 | - | - |

> 진행 규칙: 각 Phase 착수 시 상태를 🟡, 완료 시 ✅ 로 갱신하고 브랜치/커밋·검증 결과를 채운다. 로컬은 DB 비의존(컴파일·인증 게이팅)까지, 실제 업로드/DB/iframe 렌더는 개발망(로그인+DB+S3) 검증으로 분리 기록한다.

---

## 사내망 확인 완료 (2026-07-09) + 후속 UI 조정

P4~P6 기능(가이드 카드·게시판·통합검색·구독)이 **사내망에서 정상 동작 확인**되었고, 사내망 피드백에 따라 아래 UI 조정을 반영·확인 완료했다. (모두 `origin/2026-06-17-tiper` 푸시됨)

| 커밋 | 내용 |
| --- | --- |
| `f6ad8b6` | 목록 페이지 헤더 좌측 여백/타이틀 위치 정렬(자체 `px-8` 이중 패딩·`container mx-auto` 제거 → MainLayout `px-8`에 의존, Penta Design gallery 패턴) |
| `ef98fcd` | 상세 페이지 타이틀을 디자인 의뢰 상세와 동일 폰트/색: 카테고리명 `page-header-title`(h1) + 게시물 제목 `page-header-title text-2xl`(h2) |
| `ff51238` | 상세 페이지 자체 패딩(`px-4 py-4 md:px-8`) 제거 → 목록과 제목 위치 일치 |
| `6785b33` | AI 사용가이드 카드: 썸네일 제거 → 좌상단 제목/설명 크게 + 좌상단→우하단 그라데이션(`from-white to-[#F7F8FA]`). 업로드 다이얼로그 썸네일 필드 제거(썸네일 미사용) |
| `f2488af` | 상세 헤더 버튼(목록/수정/삭제) 하단 정렬(`items-start`→`items-end`) |

> 참고: 썸네일은 더 이상 카드에 사용하지 않는다. `InsightPost.thumbnailUrl` 및 API의 thumbnail 수신은 하위호환으로 남겨뒀으나(항상 null) 어디에도 표시되지 않음. 다크모드는 프로젝트 미지원 확정이라 카드 그라데이션은 지정된 밝은 색만 사용.

---

## Phase별 상세

### Phase 0 — 스키마·마이그레이션·시드  ✅
- [x] `prisma/schema.prisma`: `CategoryType`에 `INSIGHTS` 추가 (enum **끝에 append** → 순수 `ADD VALUE`, 데이터 보존)
- [x] `InsightPost` 모델 추가 (+ `Category.insightPosts`, `User.insightPosts`/`updatedInsightPosts` 역참조)
- [x] 마이그레이션 **손수 작성**(순수 additive) + `migrate deploy`로 적용 (**shadow DB·`migrate dev`·`db push` 미사용**)
- [x] `prisma/seed.ts`: 카테고리 2건 추가 (upsert — 삭제 연산 없음)
- 수정 파일:
  - `prisma/schema.prisma` (`CategoryType`에 `INSIGHTS`, `InsightPost` 모델, `Category`/`User` 역참조)
  - `prisma/migrations/20260709120000_add_insights/migration.sql` (신규 — `ALTER TYPE ADD VALUE` + `CREATE TABLE insight_posts` + INDEX + FK 3종, DROP/변경 없음)
  - `prisma/seed.ts` (INSIGHTS 카테고리 2건 upsert)
- 검증:
  - `npx prisma validate` → "valid 🚀", `npx prisma generate` → 성공
  - `npx prisma migrate status` → 적용 전 `add_insights`만 pending 확인 → **`npx prisma migrate deploy`** 로 적용(전진 전용) → "Database schema is up to date!"
  - `npm run db:seed` → 카테고리 19건 upsert(신규 2건 포함), 삭제 없음
  - 개발망 DB 조회: `type=INSIGHTS` 카테고리 2건(`ai-guide`/`insights-guide` order 1, `latest-trends`/`insights-trend` order 2) + `insight_posts` 테이블 존재(0건) 확인 ✅
- 계획 대비 변경/결정:
  - **데이터 보존 우선**: enum 값을 선언 끝에 추가해 마이그레이션이 `ALTER TYPE ... ADD VALUE 'INSIGHTS'` 순수 추가가 되도록 함(중간 삽입 시 enum 재생성 위험 회피). 사이드바 순서는 `Sidebar.tsx` `categoryOrder`가 제어하므로 enum 선언 위치와 무관.
  - `migrate diff`(live DB 연결) 대신 **SQL 손수 작성** — 개발망 터널 상태와 무관하게 additive 보장, shadow DB 접촉 0.
  - `ALTER TYPE ADD VALUE`는 이 마이그레이션 내에서 값을 사용하지 않아 PG12+ 트랜잭션에서 안전.
- 다음: P1 (사이드바 섹션 + 라우팅 골격)

### Phase 1 — 사이드바 섹션 + 라우팅 골격  ✅
- [x] `Sidebar.tsx` `categoryOrder`에 `CategoryType.INSIGHTS`를 `ETC` 뒤에 삽입
- [x] `Sidebar.tsx` `getCategoryLabel`에 `INSIGHTS → 'INSIGHTS'` 추가 (별도 하드코딩 블록 없음, 일반 렌더러 자동 처리)
- [x] `[slug]/page.tsx` switch에 `insights-guide`/`insights-trend` case + import (P1 플레이스홀더 컴포넌트)
- [x] `[slug]/[id]/page.tsx` switch에 두 case(공용 상세) + `generateMetadata` 분기(`prisma.insightPost` 제목 조회)
- 수정/신규 파일:
  - `components/category-pages/layout/Sidebar.tsx` (`categoryOrder`에 INSIGHTS(ETC↔ADMIN 사이), `getCategoryLabel`에 `INSIGHTS→'INSIGHTS'`)
  - `app/(dashboard)/[slug]/page.tsx` (import 2 + switch case 2)
  - `app/(dashboard)/[slug]/[id]/page.tsx` (import 1 + switch case 2(공용) + `generateMetadata` insights 분기)
  - `app/_category-pages/insights-guide/InsightGuideListPage.tsx` (신규 — P1 플레이스홀더)
  - `app/_category-pages/insights-trend/InsightTrendListPage.tsx` (신규 — P1 플레이스홀더)
  - `app/_category-pages/insights/InsightPostDetailPage.tsx` (신규 — 공용 상세 플레이스홀더)
- 검증:
  - `npx tsc --noEmit` → exit 0
  - `next lint`(신규 3파일 + 스위치 2 + Sidebar) → error 0 (Sidebar의 `Home`/`IconComponent` unused 경고는 **기존** 경고, 회귀 아님)
  - `next dev`: `/ai-guide`·`/latest-trends`(목록) + `/ai-guide/:id`·`/latest-trends/:id`(상세) **4경로 모두 HTTP 200**, dev 로그 컴파일 에러 없음
- 계획 대비 변경/결정:
  - P1은 **라우팅 골격**만 — 3개 페이지 컴포넌트는 헤더+"구현 예정" 플레이스홀더. 실 UI는 P3(상세)·P4(가이드)·P5(동향).
  - 공용 상세 컴포넌트는 중립 위치 `app/_category-pages/insights/`에 배치(가이드/동향 두 pageType가 공유).
  - 상세 스모크는 존재하지 않는 id로도 200(플레이스홀더가 fetch 없이 렌더). 실제 404/데이터 표시는 P3에서 구현·검증.
  - 사이드바 순서·라벨의 **개발망 육안 확인**은 로그인 세션에서 별도 확인 권장(로컬 200까지 검증 완료).
- 다음: P2 (스토리지 업로드/뷰어 + REST API)

### Phase 2 — 스토리지 업로드/뷰어 + REST API  ✅
- [x] `lib/insights-schemas.ts` (zod 검증 + DTO 타입 + 상수, **태그 필드 없음**)
- [x] `lib/insights-storage.ts` (HTML/썸네일 업로드 헬퍼 — POST/PATCH 공용, 검증+`uploadFile`)
- [x] `POST /api/insights/posts` (multipart) — `.html`/`text/html`·크기(≤5MB) 검증 → `uploadFile(buffer, 'insights/{slug}/{uuid}.html', 'text/html; charset=utf-8')` → 메타데이터 저장 → 구독 알림
- [x] `GET /api/insights/posts` — `categoryId`·`page`·`limit` (검색 `q` 없음), `{ items, total, page, pageSize }`
- [x] `GET|PATCH|DELETE /api/insights/posts/[id]` (조회=requireAuth, 변경=requireAdmin). PATCH는 multipart(HTML/썸네일 교체 시 기존 객체 best-effort 정리), DELETE는 DB 삭제 후 객체 정리
- [x] `DELETE /api/insights/posts/bulk` (requireAdmin) — 대상 조회 후 deleteMany + 객체 정리
- [x] `GET /api/insights/posts/[id]/view` — requireAuth 후 HTML을 `text/html; charset=utf-8`로 스트리밍 (`Cache-Control: private`)
- [x] `lib/categories.ts` `SUBSCRIBABLE_TYPES`에 `CategoryType.INSIGHTS` 추가
- [x] 생성/수정 성공 시 `notifyMenuUpdate` 연결 (`isSubscribableCategory` 가드, 상세 딥링크 `postId` 전달)
- 신규/수정 파일:
  - `lib/insights-schemas.ts`(신규), `lib/insights-storage.ts`(신규)
  - `app/api/insights/posts/route.ts`(신규 — GET/POST), `.../[id]/route.ts`(신규 — GET/PATCH/DELETE), `.../[id]/view/route.ts`(신규 — GET), `.../bulk/route.ts`(신규 — DELETE)
  - `lib/categories.ts` (`SUBSCRIBABLE_TYPES` += INSIGHTS)
- 검증:
  - `npx tsc --noEmit` → exit 0, `next lint`(신규 6 + categories) → "No ESLint warnings or errors"
  - `next dev`: 7개 라우트(GET/POST posts, GET/PATCH/DELETE [id], GET [id]/view, DELETE bulk) **모두 무인증 401** + 표준 `{ error:'인증이 필요합니다.' }`. `bulk`(정적) ↔ `[id]`(동적) 및 중첩 `/view` 라우팅 정상 해결.
- 계획 대비 변경/결정:
  - 스토리지 키: 행 id 대신 `crypto.randomUUID()` 사용(파일-행 분리, 정리는 저장된 URL로 `deleteFileByUrl`).
  - 업로드는 **서버 프록시 multipart**(`request.formData()`) — POST/PATCH 공용. HW가 쓰는 "URL 선업로드 후 JSON" 방식 대신 HTML 단일 파일에 맞춘 직접 업로드.
  - HTML 검증은 확장자(.html/.htm) 우선 + MIME(text/html, 빈 값 허용) 병행 + 5MB 상한(`lib/insights-storage.assertValidHtmlFile`).
  - 뷰어 캐시는 `private, max-age=300`(로그인 전용 문서라 공유 캐시 금지).
  - **실 업로드/DB 저장/S3 text/html 서빙/구독 메일**은 로그인+DB+S3 필요 → **개발망 검증 대기**(로컬은 401 게이팅·컴파일까지).
- 다음: P3 (공용 업로드/수정 Dialog + 공용 상세 iframe 뷰어)

### Phase 3 — 공용 업로드/수정 Dialog + 공용 상세 iframe 뷰어  ✅
- [x] `components/insights/InsightPostFormDialog.tsx` — 제목·(guide)설명·(guide)썸네일·HTML 파일(단일 `.html`, 자기완결 안내). 생성/수정 공용, **태그 선택 없음**
- [x] `InsightPostDetailPage` (공용, 플레이스홀더 → 실제 구현) — 헤더(뒤로가기·제목·설명·ADMIN 수정/삭제) + iframe 뷰어
- [ ] (선택·후순위) 상세 진입 시 `viewCount` 증가 — 미구현
- 신규/수정 파일:
  - `components/insights/InsightPostFormDialog.tsx` (신규 — 상태 기반 + multipart `FormData`로 POST/PATCH, `variant: 'guide'|'trend'` prop으로 설명/썸네일 노출 제어)
  - `app/_category-pages/insights/InsightPostDetailPage.tsx` (플레이스홀더 → iframe 뷰어 + 관리자 수정/삭제 + AlertDialog)
- 검증:
  - `npx tsc --noEmit` → exit 0, `next lint`(신규 2파일) → "No ESLint warnings or errors"
  - `next dev`: `/ai-guide/:id`·`/latest-trends/:id` 상세 200, 컴파일 에러 없음(폼 다이얼로그 import 포함)
- 계획 대비 변경/결정:
  - 폼은 `react-hook-form` 대신 **상태 기반**(HW 업로드 다이얼로그와 동일 패턴) — 파일 입력 처리에 단순·일관적.
  - 업로드는 프리사인 방식 대신 **multipart `FormData`를 API로 직접 전송**(P2 서버 프록시 업로드와 일치). 수정 시 HTML 미선택이면 기존 문서 유지.
  - iframe `sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"`(자기완결 문서의 스크립트/링크 동작 허용, 부모 DOM 접근 차단). 높이는 `h-[calc(100dvh-220px)] min-h-[480px]`(전역 헤더+제목/컨트롤 고려, MainLayout full-bleed 분기 미사용).
  - 권한: 상세 수정/삭제는 **ADMIN만**(업로드 주체가 관리자) — design-request의 작성자/관리자 조건과 다름.
  - 폼 `variant`는 상세에서 `category.pageType`로 파생(guide↔trend). 상세 Category 인터페이스에 `pageType` 추가.
- 개발망 검증 대기: 실제 `.html` 업로드 → 상세 iframe **스타일 격리 렌더** → 수정(문서 교체)·삭제(객체 정리)·구독 메일.
- 다음: P4 (「AI 사용가이드」 카드 갤러리)

### Phase 4 — 「AI 사용가이드」 카드 갤러리  ✅
- [x] `InsightGuideListPage` — `HardwareListPage` 마소너리 차용(카드 폭 320·gap 24·`<Flipper>`), 헤더에 `SubscribeButton` + ADMIN "게시물 추가" 버튼
- [x] `InsightGuideCard` — `HardwareCard` 치수 복제(폭 320, 이미지 박스 200px, 하단 풋터 제목+설명). **태그 뱃지·필터 토글 없음**
- [x] `[slug]/page.tsx`의 `insights-guide` case는 P1에서 이미 연결됨(플레이스홀더 → 실제 목록으로 대체)
- 신규/수정 파일:
  - `components/insights/InsightGuideCard.tsx` (신규 — HW 카드 복제, 썸네일 없으면 `FileText` 플레이스홀더, hover 상세보기 라벨 + 관리자 수정/삭제 오버레이)
  - `app/_category-pages/insights-guide/InsightGuideListPage.tsx` (플레이스홀더 → 마소너리 목록: `/api/insights/posts?categoryId=` fetch, 헤더+구독+추가버튼, 스켈레톤/빈상태, 업로드/수정 다이얼로그, 삭제 AlertDialog)
- 검증:
  - `npx tsc --noEmit` → exit 0, `next lint`(신규 2파일) → "No ESLint warnings or errors"
  - `next dev`: `/ai-guide` 200, 컴파일 에러 없음
- 계획 대비 변경/결정:
  - 필터 토글 행 없음(태그 제거). 페이지 내 검색 없음(헤더 통합검색). 목록은 `limit=100` 단순 조회(무한스크롤은 데이터량 증가 시 후속 도입 여지).
  - 카드 액션(수정/삭제 오버레이)은 **데스크톱 관리자만**(HW와 동일, `!isMobileViewport`). 카드 클릭 상세 이동은 모바일 포함 전 뷰포트 허용(HW는 모바일 클릭 차단이나, 가이드는 모바일 속성 패널이 없어 상세 이동이 자연스러움).
  - 업로드/수정은 P3 공용 `InsightPostFormDialog`(`variant="guide"`) 재사용 → 설명·썸네일 필드 노출.
- 개발망 검증 완료(2026-07-09): 관리자 **추가/수정/삭제 정상 동작 확인** ✅. (구독 버튼 노출·구독 메일은 별도 확인 권장)
- 레이아웃 픽스(2026-07-09, 사내망 피드백): 두 INSIGHTS 페이지 헤더가 다른 페이지와 정렬되도록 수정 — 가이드 페이지의 **자체 `px-8` 이중 패딩 제거**(MainLayout이 이미 `px-8` 제공 → 사이드바 기준 좌측 여백 일치), 동향 플레이스홀더의 **`container mx-auto px-8 py-6` 제거**(타이틀이 아래로 밀리던 문제 해결). 모두 Penta Design(gallery, `w-full` + `page-header-*`) 패턴에 정렬. 파일: `InsightGuideListPage.tsx`, `InsightTrendListPage.tsx`.
- 다음: P5 (「최신 동향」 게시판 테이블)

### Phase 5 — 「최신 동향」 게시판 테이블  ✅
- [x] `InsightTrendListPage` — `DesignRequestListPage` 구조 차용. 컬럼: 체크박스(ADMIN)·**No.**·**제목**(링크+긴 제목 툴팁)·**게시일**. 페이지네이션(10/20/50)·ADMIN 일괄삭제·`SubscribeButton`. **태그 컬럼·페이지 검색 입력 없음**
- [x] 글쓰기 = P3 공용 Dialog(`variant="trend"`, HTML 첨부). 개별 수정/삭제는 상세 페이지에서(P3)
- [x] `[slug]/page.tsx`의 `insights-trend` case는 P1에서 연결됨(플레이스홀더 → 실제 게시판으로 대체)
- 수정 파일:
  - `app/_category-pages/insights-trend/InsightTrendListPage.tsx` (플레이스홀더 → 게시판: `/api/insights/posts` 목록/페이지네이션, `page-header-stack` 헤더+구독+글쓰기, 전체건수/보기 select, 관리자 체크박스+일괄삭제, No.(역순)·제목 링크·게시일 컬럼)
- 검증:
  - `npx tsc --noEmit` → exit 0, `next lint`(신규 1파일) → "No ESLint warnings or errors"(미사용 `cn` import 제거 후)
  - `next dev`: `/latest-trends` 200, 컴파일 에러 없음
- 계획 대비 변경/결정:
  - design-request의 상세 검색 Popover·상태 컬럼·마감일 등은 제외(요구 컬럼: No./제목/게시일). 검색은 헤더 통합검색(P6) 사용.
  - 개별 게시물 **수정/삭제는 상세 페이지(P3)** 의 관리자 버튼으로 처리(design-request와 동일 흐름). 목록은 글쓰기 + 일괄삭제만.
  - 제목 40자 초과 시 말줄임 + 툴팁(전체 제목). 컬럼 정렬: No. 우측정렬 역순(`total-(page-1)*size-index`).
  - 미인증 시 `/login` 리다이렉트(게시판이므로 design-request 패턴 채택).
- 개발망 검증 대기: 실 글쓰기(HTML 첨부)·목록/페이지네이션·관리자 일괄삭제·제목 클릭 상세 iframe 이동·구독.
- 다음: P6 (헤더 통합검색 편입 + 구독 연결 확인)

### Phase 6 — 헤더 통합검색 편입 + 구독 연결 확인  ✅
- [x] `app/api/search/route.ts`: `SearchResult.resourceType`에 `'insight'` 추가 + `insightPost.findMany`(제목 contains + 카테고리/날짜 필터) 블록 → 결과 필드는 행의 `category` 관계에서 직접(name/slug/pageType)
- [x] `lib/search-navigation.ts`: `getViewUrl`에 `case 'insight' → /${slug}/${id}`
- [x] 구독 연결 확인(코드): `SUBSCRIBABLE_TYPES` += INSIGHTS(P2) + 두 페이지 `SubscribeButton`(P4/P5) + 생성/수정 `notifyMenuUpdate`(P2). 실 메일은 SMTP+구독자 필요 → 개발망 확인
- 수정 파일:
  - `app/api/search/route.ts` (resourceType += `'insight'`; aux 카테고리 조회에 `insights-guide`/`insights-trend` 추가 → `insightsSlugs` 게이트; `insightPost` 검색 블록 신규)
  - `lib/search-navigation.ts` (`case 'insight'`)
- 검증:
  - `npx tsc --noEmit` → exit 0, `next lint`(수정 2파일) → "No ESLint warnings or errors"
  - `next dev`: `/api/search?q=test` **무인증 401**(컴파일 클린, 신규 블록이 기존 검색 회귀 없음)
- 계획 대비 변경/결정:
  - InsightPost가 자체 `categoryId` 관계를 가지므로 aux-category 맵이 아닌 **Post 방식**(행의 `category` 관계에서 취득)으로 구현.
  - aux 조회에 insights pageType 2종 추가는 **카테고리 필터 게이트(`shouldSearchInsight`)** 용(불필요 쿼리 회피). guide/trend 모두 상세가 `/${slug}/${id}` 라 `getViewUrl` 단일 경로.
- 개발망 검증 대기: 로그인 후 헤더 검색 제목 입력 → 결과 노출 → "보기" 상세 iframe 이동 / 카테고리 필터 드롭다운 두 메뉴 노출 / (SMTP+구독자) 알림 메일.
- 다음: P7 (반응형/권한/QA + 최종 검증)

### Phase 7 — 반응형/권한/QA + 최종 검증  ⬜
- [ ] 모바일 사이드바(Sheet)·카드 그리드·게시판 테이블 반응형 확인
- [ ] 권한 매트릭스 확인(미로그인/일반/관리자 × 조회·업로드·수정·삭제)
- [ ] iframe `sandbox` 동작·문서 스타일 격리·다크모드 육안
- [ ] 최종 `tsc --noEmit` 0 / `next lint` 0 / 관련 테스트 통과
- 완료 기준: 데스크톱/모바일 회귀 없음, 권한 게이팅 정상
- 검증: 로컬 컴파일/타입/린트 + 개발망 데스크톱·모바일 수동 QA
- 다음: 배포 (운영 DB 카테고리 2건 시드/수동 삽입 → `migrate deploy` → `origin/2026-06-17-tiper` 반영)

---

## 리스크 · 미결 사항
- **개발망 의존 검증:** 실제 업로드/DB/iframe 렌더는 로컬(외부망)에서 불가 → 개발망(로그인+DB+S3)에서 확인 필요. 로컬은 컴파일·인증 게이팅까지만.
- **iframe 뷰어 방식 확정 필요(P2/P3):** 프록시 뷰어 라우트(`/[id]/view`)로 서빙 확정. 만약 개발망에서 S3 public URL 직접 사용이 더 단순하면 뷰어 라우트 대신 직접 URL로 조정 가능(계획 §5 대안).
- **HTML 크기 상한:** 5MB 가정 — 실제 문서 크기 확인 후 조정.
- **iframe 높이:** 상세 레이아웃 full-bleed 여부(MainLayout 분기) vs 컨테이너 높이(`h-[calc(...)]`) — P3에서 확정.
