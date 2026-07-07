# ICON+ 구현 Handoff (진행 상태)

> 스펙 문서: [ICON_PLUS_개발계획.md](./ICON_PLUS_개발계획.md)
> **구현 진행 상태의 단일 원본(source of truth)은 이 문서다.** 계획서는 스펙으로 고정하고, 단계 진행/완료 시 이 문서만 갱신한다.

- 대상: SOURCE > ICON 페이지에 ICON+ 탭 추가
- 최종 업데이트: 2026-07-07

범례: ⬜ 대기 · 🟡 진행중 · ✅ 완료 · ⛔ 블록

---

## 진행 현황 요약

| Phase | 내용 | 상태 | 브랜치/커밋 | 검증 |
| --- | --- | --- | --- | --- |
| P0 | 사전 준비 (의존성·스키마·마이그레이션) | ✅ 완료 | `refactor/phase2-api-layer` | validate/generate + `migrate deploy` 적용 + 테이블 조회 검증 ✅ |
| P1 | 탭 골격 & ICON 탭 정리 | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` | typecheck/lint 통과 + 사내망 브라우저 수동 검증 완료 ✅ |
| P2 | 데이터/전처리/API | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` | tsc/lint 0 + 단위테스트 13종 통과 + 라우트 인증 게이팅(401) 확인. 관리자 업로드/DB 검증은 사내망 대기 |
| P3 | ICON+ 레이아웃 & 목록 | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` | tsc/lint 0 + `?tab=plus` 컴파일·200. 실 데이터 표시는 사내망(로그인+업로드) 대기 |
| P4 | 업로드 다이얼로그 & anchor 입력 | ⬜ 대기 | | |
| P5 | 병합 미리보기 | ⬜ 대기 | | |
| P6 | 속성 조정 & 다운로드 | ⬜ 대기 | | |
| P7 | 반응형/접근성/QA | ⬜ 대기 | | |

---

## Phase별 상세

### Phase 0 — 사전 준비  ✅
- [x] `sanitize-html`, `fast-xml-parser` 의존성 확인/추가 (+ `@types/sanitize-html` devDep)
- [x] `prisma/schema.prisma`에 `IconPlusResource` / `IconPlusType` 추가 (+ `User.iconPlusResources` 역참조)
- [x] `prisma validate` 통과, `prisma generate`로 클라이언트 재생성(코드에서 타입 사용 가능)
- [x] 개발망 DB 마이그레이션 생성·적용 (터널 연결 상태에서 완료)
- 수정 파일:
  - `package.json` / `package-lock.json` (deps 3종 추가)
  - `prisma/schema.prisma` (`IconPlusType` enum, `IconPlusResource` model, `User` 역참조 1줄)
  - `prisma/migrations/20260707120000_add_icon_plus/migration.sql` (신규)
- 검증:
  - `npx prisma validate` → "valid 🚀", `npx prisma generate` → 성공 (client v5.22.0)
  - `npx prisma migrate deploy` → `20260707120000_add_icon_plus` 적용
  - `npx prisma migrate status` → "up to date", `SELECT count(*) FROM icon_plus_resources` 정상 실행
- 계획 대비 변경/결정:
  - `fast-xml-parser`는 이미 transitive로 존재했으나 명시적 의존성으로 승격
  - `@types/sanitize-html`을 devDependency로 추가(TS 타입)
  - **shadow DB 위험 회피**: `migrate dev` 대신 `migrate diff`(live DB→schema)로 SQL 생성 후 `migrate deploy` 적용 — shadow DB 미사용, 리셋 없음. 마이그레이션 SQL은 순수 additive(CREATE TYPE/TABLE/INDEX + ADD FK, 기존 테이블 변경 없음)
- 다음 작업:
  - Phase 1 착수 (탭 골격 & ICON 탭 정리)

### Phase 1 — 탭 골격 & ICON 탭 정리  ✅
- [x] `IconListPage`에 `ICON` / `ICON+` 탭 도입, 기존 ICON UI를 `ICON` 탭(`IconTab.tsx`)으로 분리
- [x] `아이콘 추가` 버튼을 헤더 → 액션 행의 `삭제` 버튼 우측으로 이동
- [x] URL 쿼리 `?tab=plus` 동기화 (ICON 은 파라미터 제거, ICON+ 는 `?tab=plus`)
- 완료 기준: 탭 전환 동작, ICON 탭 기존 기능 회귀 없음, 버튼 위치 변경 반영 → **충족**
- 수정 파일:
  - `app/_category-pages/icon/IconListPage.tsx` (컨테이너로 재작성: 공통 헤더 노드(타이틀+구독+탭바) 생성, `?tab` 동기화, 탭별 렌더 분기)
  - `app/_category-pages/icon/IconTab.tsx` (신규 — 기존 ICON UI/로직 전량 이관, `header` prop을 좌측 컬럼 내부에 렌더, `아이콘 추가` 버튼을 액션 행 `삭제` 우측으로 이동)
  - `app/_category-pages/icon/IconPlusWorkspace.tsx` (신규 — Phase 1 안내 플레이스홀더, Phase 3+ 에서 3영역 레이아웃으로 확장 예정)
  - `components/category-pages/IconCategory/IconPropertyPanel.tsx` (sidebar variant는 원래대로 `fixed` 전체 높이 유지)
- 검증:
  - `npx tsc --noEmit` → error 0 (기존 42 error는 전부 gitignore된 `icon-merger/` 참고 폴더 → tsconfig `exclude`에 추가하여 제거)
  - `npx next lint` → 신규 파일 error 0 (`downloading` unused 경고 1건은 원본 `IconListPage`에서 그대로 이관된 기존 경고, 회귀 아님)
  - `next dev` 로컬 기동 → `/`, `/[slug]` 컴파일 클린 + 200 (DB는 터널 필요; 컴파일 검증은 무관)
  - **사내망 브라우저 수동 검증 완료**: 탭 노출/전환/`?tab=plus`, `아이콘 추가` 버튼 우측 배치, 속성 패널 전체 높이, ICON 탭 기존 기능 회귀 없음 ✅
- 계획 대비 변경/결정:
  - 탭 UI는 shadcn `Tabs`(`@radix-ui/react-tabs`) 미설치 → 의존성 추가 대신 Design5 토큰 기반 경량 버튼 탭바로 구현(2개 탭, `role=tablist/tab` + `aria-selected`, 하단 언더라인 인디케이터)
  - **레이아웃 구조 결정**: 공통 헤더를 전체 폭 상단바로 빼면 `fixed` 속성 패널(화면 전체 높이)과 겹쳐 구독 버튼이 가려짐 → 헤더를 **원래처럼 IconTab 좌측 컬럼(`pr-[410px]`) 내부**에 두어 해결. ICON+ 탭은 패널이 없어 헤더를 전체 폭 상단에 렌더. (중간에 패널을 `absolute`로 바꿨다가 높이가 줄어 다시 `fixed`로 되돌림)
  - 탭 전환 시 컴포넌트 언마운트로 ICON 탭의 선택/속성 상태는 초기화(계획 §13 "전환 시 초기화 권장" 반영)
  - **구독 버튼 표시 조건(주의)**: `SubscribeButton`은 `enabled !== true || subscribed === null`이면 렌더하지 않음 → 관리자 전역 메뉴구독 스위치 ON + 로그인 + API(DB) 정상일 때만 노출. 로컬에서 터널/스위치 조건 미충족 시 안 보이는 것은 정상(코드 버그 아님).
- 다음 작업:
  - Phase 2 착수 (`merge-svg.ts`/`process-svg.ts` 이식, `/api/icon-plus` 라우트)

### Phase 2 — 데이터/전처리/API  ✅
- [x] `merge-svg.ts` 이식 (순수 함수, 의존성 없음 — 스타일만 Design5화)
- [x] `process-svg.ts` 이식 (sanitize/normalize, `SvgProcessingError`를 `BadRequestError`로 통합)
- [x] `/api/icon-plus` GET/POST/DELETE 구현
- [x] `/api/icon-plus/[id]` PATCH(anchor) 구현
- 완료 기준: 관리자 업로드/삭제/anchor 수정, 사용자 조회, 비관리자 업로드 403 → **코드/게이팅 충족** (실 DB 업로드는 사내망 검증 대기)
- 수정 파일:
  - `lib/svg/merge-svg.ts` (신규 — `mergeSvgsByAnchor`, 미리보기·다운로드 공용 순수 함수)
  - `lib/svg/process-svg.ts` (신규 — `processSvgFile`, 검증/sanitize/normalize + `SvgProcessingError extends BadRequestError`)
  - `app/api/icon-plus/route.ts` (신규 — GET 로그인 조회 / POST 관리자 업로드 / DELETE 관리자 일괄 삭제, `withRouteHandler`+`errorResponse` 컨벤션)
  - `app/api/icon-plus/[id]/route.ts` (신규 — PATCH 관리자 anchor 수정, MAIN 대상 `updateMany` + 404 처리)
  - `lib/svg/process-svg.test.ts`, `lib/svg/merge-svg.test.ts` (신규 — DB 비의존 단위 테스트 13종)
- 검증:
  - `npx tsc --noEmit` → error 0, `npx next lint` (신규 4파일) → 0
  - `npx vitest run` → 전체 178 테스트 통과 (신규 SVG 로직 13종 포함: 정규화/viewBox 파생/sanitize 태그 제거/외부 URL 거부/확장자·MIME·크기 검증/anchor 병합·크기 재계산)
  - `next dev` 로컬: `/api/icon-plus` GET·POST·DELETE, `/api/icon-plus/[id]` PATCH 모두 **무인증 401** 확인 (JWT 세션 → DB 불필요). 관리자 업로드/삭제/조회 및 비관리자 403은 사내망(로그인+DB)에서 최종 검증 예정.
- 계획 대비 변경/결정:
  - 인증: icon-merger `getCurrentUser/requireAdminUser` → Design5 `requireAuth()/requireAdmin()` (`@/lib/auth-helpers`). GET은 `requireAuth`(로그인 필수).
  - Prisma: `@/generated/prisma` `prisma.icon` → `@/lib/prisma` `prisma.iconPlusResource`. 스키마 필드 `userId`→`authorId`. POST는 `$transaction`으로 다중 생성 원자화.
  - 에러 처리: icon-merger의 수동 try/catch(401/403/400 분기)를 Design5 `withRouteHandler`+`errorResponse`로 대체. `SvgProcessingError`를 `BadRequestError`로 상속시켜 400 자동 매핑.
  - 라우트 분담(계획 §8): 일괄 삭제는 컬렉션 `DELETE /api/icon-plus`(id 배열), `[id]`는 PATCH(anchor)만. (icon-merger의 `[id]` DELETE는 미이식)
- 다음 작업:
  - Phase 3 착수 (ICON+ 3영역 레이아웃 & 타입별 목록 — `IconPlusWorkspace` 실제 구현, GET API 연동)

### Phase 3 — ICON+ 레이아웃 & 목록  ✅
- [x] 3영역 레이아웃(`IconPlusWorkspace`) 구현 — 계획 §3.3 그리드 스펙(`minmax(196px,0.8fr) minmax(440px,2fr) minmax(300px,1fr)`)
- [x] 좌측 메인 아이콘 / 중앙 병합용 아이콘·텍스트 2섹션 구현
- [x] 섹션 공통 헤더 액션(추가/더보기 전체 선택/선택 개수/선택 해제/삭제)
- [x] 상호 배타 선택(병합용 아이콘 ↔ 텍스트)
- [x] Design5 디자인 토큰·컴포넌트 적용(`Button`/`DropdownMenu`/`useConfirmDialog`/토큰 색상)
- 완료 기준: 레이아웃이 `ICON_layout_02.jpg`와 유사, 타입별 목록 독립 표시 → **충족**
- 수정 파일:
  - `app/_category-pages/icon/IconPlusWorkspace.tsx` (플레이스홀더 → 실제 3영역 컨테이너: 타입별 fetch, 선택 상태/상호배타, 삭제)
  - `components/category-pages/IconCategory/iconplus/types.ts` (신규 — `IconPlusResource`/`IconPlusType` 클라이언트 타입)
  - `components/category-pages/IconCategory/iconplus/IconPlusCard.tsx` (신규 — svgContent dangerouslySetInnerHTML 렌더, icon/text/main variant)
  - `components/category-pages/IconCategory/iconplus/ResourceSection.tsx` (신규 — 3섹션 공용: 헤더/추가버튼/더보기/선택액션/그리드/빈상태)
  - `components/category-pages/IconCategory/iconplus/IconPlusPropertyPanel.tsx` (신규 — 대표 미리보기 선택 상태 반영 스캐폴드, 컨트롤은 P5/P6)
- 검증:
  - `npx tsc --noEmit` → 0, `npx next lint`(신규 5파일) → 0
  - `next dev`: `/icon?tab=plus` 컴파일 클린 + 200, 런타임 에러 없음(DB 미연결 prisma 로그만)
  - 실 데이터(카드) 표시·선택·삭제는 사내망(로그인 + Phase 2 API 업로드)에서 최종 검증 예정
- 계획 대비 변경/결정:
  - 선택 모델: 관리자=다중 선택(전체 선택/일괄 삭제용), 일반 사용자=섹션당 단일 선택(§3.3). 메인 선택은 병합용과 독립.
  - 상호 배타: 병합용 아이콘 선택 시 병합용 텍스트 선택 해제(및 반대) — 컨테이너 토글 핸들러에서 처리.
  - 삭제 확인은 Design5 전역 `useConfirmDialog()` 사용(ICON 탭의 AlertDialog와 별개, 재사용성 우선).
  - 우측 속성 패널은 스크롤 시 상단 고정(`lg:sticky`). `추가` 버튼은 현재 안내 토스트(업로드 다이얼로그는 Phase 4에서 연결).
  - 카드 svgContent는 서버 sanitize된 값이라 `dangerouslySetInnerHTML` 렌더(계획 §13 준수).
- 다음 작업:
  - Phase 4 착수 (업로드 다이얼로그 & MAIN anchor 입력 — `추가` 버튼에 연결)

### Phase 4 — 업로드 다이얼로그 & anchor 입력  ⬜
- [ ] SVG 드래그앤드롭 업로드
- [ ] MAIN 단건 + anchor 클릭/드래그 지정(십자선 표시)
- [ ] 병합용 아이콘/텍스트 다중 업로드
- 완료 기준: 검증/sanitize 통과, MAIN anchor 저장, 위험 SVG 차단
- 수정 파일:
- 검증:
- 계획 대비 변경/결정:
- 다음 작업:

### Phase 5 — 병합 미리보기  ⬜
- [ ] 선택 조합 → `mergeSvgsByAnchor` 실시간 미리보기(`메인 + 리소스 = 결과`)
- 완료 기준: 절단 영역 상단/좌측 정렬, 결과 viewBox 재계산, 미선택 시 다운로드 비활성
- 수정 파일:
- 검증:
- 계획 대비 변경/결정:
- 다음 작업:

### Phase 6 — 속성 조정 & 다운로드  ⬜
- [ ] 색상 10종(흰색 예외) / 선 두께 / 크기 / 포맷 / 초기화
- [ ] SVG/PNG/JPG 다운로드(병합 결과 기준, `lib/svg/*` 재사용)
- 완료 기준: 속성 변경이 미리보기·다운로드에 반영, 3포맷 정상 저장
- 수정 파일:
- 검증:
- 계획 대비 변경/결정:
- 다음 작업:

### Phase 7 — 반응형/접근성/QA  ⬜
- [ ] 태블릿/모바일 대응(Sheet/Drawer)
- [ ] `aria-*`/키보드 접근성
- [ ] 회귀 테스트(ICON 탭 포함)
- 완료 기준: 주요 뷰포트 정상, 접근성 확인, 회귀 없음
- 수정 파일:
- 검증:
- 계획 대비 변경/결정:
- 다음 작업:

---

## 미해결 / 결정 대기
- (없음)

## 변경 이력
| 날짜 | Phase | 요약 |
| --- | --- | --- |
| 2026-07-07 | — | Handoff 문서 생성 (Phase 0~7 스켈레톤) |
| 2026-07-07 | P0 | 의존성 추가 + 스키마(`IconPlusResource`/`IconPlusType`) 추가 + validate/generate 완료. 마이그레이션 적용은 다음 세션으로 보류 |
| 2026-07-07 | P0 | 터널 연결 확인 후 마이그레이션 `20260707120000_add_icon_plus` 적용·검증 완료 → **P0 ✅**. (diff→deploy 방식, shadow DB 미사용) |
| 2026-07-07 | P1 | 탭 골격 도입 + ICON UI를 `IconTab.tsx`로 분리, `아이콘 추가` 버튼 액션 행 이동, `?tab=plus` 동기화, ICON+ 플레이스홀더 추가 → **P1 ✅** (typecheck/lint 통과, 수동 UI 검증 대기) |
| 2026-07-07 | P1 | tsconfig에 `icon-merger` 컴파일 제외(참고 폴더 빌드 노이즈 제거), 준비사항 문서에 push 대상(`origin/2026-06-17-tiper`) 명시 |
| 2026-07-07 | P1 | 레이아웃 후속 수정: 공통 헤더를 좌측 컬럼 내부로 이동 + 속성 패널 `fixed` 전체 높이 복원(구독 버튼 가림/패널 높이 문제 해결). 사내망 브라우저 수동 검증 완료 → **P1 최종 확정** |
| 2026-07-07 | P2 | `merge-svg.ts`/`process-svg.ts` 이식(인증·Prisma·에러 교체) + `/api/icon-plus` GET/POST/DELETE, `/api/icon-plus/[id]` PATCH 구현. 단위테스트 13종 + 전체 178 통과, 무인증 401 게이팅 확인 → **P2 ✅** (실 DB 업로드는 사내망 대기) |
| 2026-07-07 | P3 | ICON+ 3영역 레이아웃(`IconPlusWorkspace`) + 타입별 목록/카드/섹션 액션/상호배타 선택 구현(신규 컴포넌트 5종). tsc/lint 0, `?tab=plus` 200 → **P3 ✅** (실 데이터 표시는 사내망 대기) |
