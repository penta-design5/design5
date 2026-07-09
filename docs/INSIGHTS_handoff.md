# INSIGHTS 구현 Handoff (진행 상태)

> 스펙 문서: [INSIGHTS_구현계획.md](./INSIGHTS_구현계획.md)
> **구현 진행 상태의 단일 원본(source of truth)은 이 문서다.** 계획서는 스펙으로 고정하고, 단계 진행/완료 시 이 문서만 갱신한다.

- 대상: 사이드바 LABs 다음 **INSIGHTS** 섹션 신설 + 「AI 사용가이드」(카드 갤러리)·「최신 동향」(게시판) 2개 페이지
- 핵심 결정: HTML=단일 자기완결형 `.html`(S3 저장·iframe 뷰어) · 전용 모델 `InsightPost` 단일(**태그 없음**) · 두 페이지 구독 대상 · **페이지 내 검색 없음(헤더 통합검색 사용)**
- 최종 업데이트: 2026-07-09 (P0~P4 완료 ✅, P5~ 대기) · 푸시: `origin/2026-06-17-tiper` (1cb1d47)

범례: ⬜ 대기 · 🟡 진행중 · ✅ 완료 · ⛔ 블록

---

## 진행 현황 요약

| Phase | 내용 | 상태 | 브랜치/커밋 | 검증 |
| --- | --- | --- | --- | --- |
| P0 | 스키마·마이그레이션·시드 (`INSIGHTS` enum, `InsightPost`, 카테고리 2건) | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` (1cb1d47) | validate/generate + `migrate deploy` 적용 + 시드 + 개발망 DB 조회 검증 ✅ |
| P1 | 사이드바 섹션 + 라우팅 골격 | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` (1cb1d47) | tsc 0 / lint 0(신규파일) / `next dev`에서 `/ai-guide`·`/latest-trends`(+상세) 4경로 200 ✅ |
| P2 | 스토리지 업로드/뷰어 + REST API (백엔드) | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` (1cb1d47) | tsc 0 / lint 0(신규 6파일) / 7개 라우트 무인증 **401** 확인. 실 업로드/DB/S3·구독메일은 개발망 대기 |
| P3 | 공용 업로드/수정 Dialog + 공용 상세 iframe 뷰어 | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` (1cb1d47) | tsc 0 / lint 0(신규 2파일) / 상세 2경로 200·컴파일 클린. 실 업로드→iframe 렌더·수정·삭제는 개발망 대기 |
| P4 | 「AI 사용가이드」 카드 갤러리 | ✅ 완료 | `refactor/phase2-api-layer` (미푸시) | tsc 0 / lint 0(신규 2파일) / `/ai-guide` 200·컴파일 클린. 실 데이터 카드·업로드·구독은 개발망 대기 |
| P5 | 「최신 동향」 게시판 테이블 | ⬜ 대기 | - | - |
| P6 | 헤더 통합검색 편입 + 구독 연결 확인 | ⬜ 대기 | - | - |
| P7 | 반응형/권한/QA + 최종 검증 | ⬜ 대기 | - | - |

> 진행 규칙: 각 Phase 착수 시 상태를 🟡, 완료 시 ✅ 로 갱신하고 브랜치/커밋·검증 결과를 채운다. 로컬은 DB 비의존(컴파일·인증 게이팅)까지, 실제 업로드/DB/iframe 렌더는 개발망(로그인+DB+S3) 검증으로 분리 기록한다.

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
- 개발망 검증 대기: 실 데이터 카드 표시(썸네일/제목/설명)·카드 클릭 상세 이동·관리자 추가/수정/삭제·구독 버튼 노출(전역 토글 ON + 로그인 시).
- 다음: P5 (「최신 동향」 게시판 테이블)

### Phase 5 — 「최신 동향」 게시판 테이블  ⬜
- [ ] `InsightTrendListPage` — `DesignRequestListPage` 구조 차용. 컬럼: 체크박스(ADMIN)·**No.**·**제목**(링크)·**게시일**. 페이지네이션(10/20/50)·ADMIN 일괄삭제·`SubscribeButton`. **태그 컬럼·페이지 검색 입력 없음**
- [ ] 글쓰기/수정 = P3 공용 Dialog 재사용(HTML 첨부)
- [ ] `[slug]/page.tsx`의 `insights-trend` case를 실제 컴포넌트로 연결
- 예상 파일: `app/_category-pages/insights-trend/InsightTrendListPage.tsx`(신규)
- 완료 기준: 테이블 필수 컬럼 표시, 제목 클릭 시 iframe 상세 이동, 관리자 일괄 삭제, 구독 버튼
- 검증: `tsc`/`lint` 0 / 컴파일·200 / 개발망에서 목록·페이지네이션·일괄삭제·상세 이동 확인
- 다음: P6

### Phase 6 — 헤더 통합검색 편입 + 구독 연결 확인  ⬜
- [ ] `app/api/search/route.ts`: `SearchResult.resourceType`에 `'insight'` 추가 + **Post 블록 패턴**으로 `prisma.insightPost.findMany`(title contains, createdAt 필터, `include: category`) 블록 추가 → 결과에 카테고리 slug/name·`pageType` 세팅
- [ ] `lib/search-navigation.ts`: `getViewUrl`에 `case 'insight' → /${slug}/${id}`
- [ ] 구독 알림 end-to-end 확인(신규 등록 시 구독자 메일 발송, SMTP 설정 시)
- 예상 파일: `app/api/search/route.ts`, `lib/search-navigation.ts`
- 완료 기준: 헤더 검색에서 게시물 제목 검색 → 결과 노출 → "보기"로 `/{slug}/{id}` 상세 이동
- 검증: `tsc`/`lint` 0 / 개발망에서 통합검색 결과·이동·카테고리 필터 드롭다운 노출 확인 / (SMTP 시) 구독 메일 수신
- 다음: P7

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
