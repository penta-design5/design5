# ICON+ 구현 Handoff (진행 상태)

> 스펙 문서: [ICON_PLUS_개발계획.md](./ICON_PLUS_개발계획.md)
> **구현 진행 상태의 단일 원본(source of truth)은 이 문서다.** 계획서는 스펙으로 고정하고, 단계 진행/완료 시 이 문서만 갱신한다.

- 대상: SOURCE > ICON 페이지에 ICON+ 탭 추가
- 최종 업데이트: 2026-07-08

범례: ⬜ 대기 · 🟡 진행중 · ✅ 완료 · ⛔ 블록

---

## 진행 현황 요약

| Phase | 내용 | 상태 | 브랜치/커밋 | 검증 |
| --- | --- | --- | --- | --- |
| P0 | 사전 준비 (의존성·스키마·마이그레이션) | ✅ 완료 | `refactor/phase2-api-layer` | validate/generate + `migrate deploy` 적용 + 테이블 조회 검증 ✅ |
| P1 | 탭 골격 & ICON 탭 정리 | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` | typecheck/lint 통과 + 사내망 브라우저 수동 검증 완료 ✅ |
| P2 | 데이터/전처리/API | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` | tsc/lint 0 + 단위테스트 13종 통과 + 라우트 인증 게이팅(401) 확인. 관리자 업로드/DB 검증은 사내망 대기 |
| P3 | ICON+ 레이아웃 & 목록 | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` | tsc/lint 0 + `?tab=plus` 컴파일·200 + 사내망 UI 피드백(폰트/미리보기 배경/간격) 반영 완료. 실 데이터 표시는 사내망 대기 |
| P4 | 업로드 다이얼로그 & anchor 입력 | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` | tsc/lint 0 + 단위테스트 178 통과 + `?tab=plus` 컴파일·200. 실 업로드/anchor 저장은 사내망(로그인+DB) 대기 |
| P5 | 병합 미리보기 | ✅ 완료 | `refactor/phase2-api-layer` | tsc/lint 0 + 단위테스트 186 통과 + `?tab=plus` 컴파일·200. 실 병합 렌더는 사내망 대기 |
| P6 | 속성 조정 & 다운로드 | ✅ 완료 | `refactor/phase2-api-layer` | tsc/lint 0 + 단위테스트 186 통과(신규 8종) + `?tab=plus` 컴파일·200. 실 다운로드/다크모드 육안은 사내망 대기 |
| P7 | 반응형/접근성/QA | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` | tsc/lint 0 + 단위테스트 190 통과 + `?tab=plus`·`/chart-generator` 컴파일·200. 모바일 속성 시트(하단 슬라이딩)·플로팅 버튼 + close 버튼 겹침 해결(전역) + ICON 탭 버튼 줄바꿈. **사내망 모바일 QA 확인 완료(2026-07-08)** ✅ |

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

### Phase 4 — 업로드 다이얼로그 & anchor 입력  ✅
- [x] SVG 드래그앤드롭 업로드(Design5 `Dialog`/`Button`/`Input`/`Label` 기반)
- [x] MAIN 단건 + anchor 클릭/드래그 지정(미리보기 위 십자선 마커, 좌표 직접 입력 병행)
- [x] 병합용 아이콘/텍스트 다중 업로드
- 완료 기준: 검증/sanitize 통과, MAIN anchor 저장, 위험 SVG 차단 → **코드/게이팅 충족** (실 업로드는 사내망 검증 대기)
- 수정 파일:
  - `components/category-pages/IconCategory/iconplus/IconPlusUploadDialog.tsx` (신규 — 타입별 업로드 다이얼로그. MERGE_*는 다중, MAIN은 단건+anchor. 미리보기는 object URL+`<img>`(sanitize 전이므로 dangerouslySetInnerHTML 미사용). anchor 좌표 계산 헬퍼(clamp/getContainedRect/readClientSvgSize/formatCoordinate/isClientSvgFile) icon-merger에서 순수 함수로 이식)
  - `app/_category-pages/icon/IconPlusWorkspace.tsx` (`handleAdd` 토스트 → `uploadType` 상태 + 섹션별 `onAdd`로 다이얼로그 오픈, 업로드 성공 시 `refresh(type)`)
- 검증:
  - `npx tsc --noEmit` → 0, `npx next lint`(신규/수정 2파일) → 0
  - `npx vitest run` → 전체 178 통과(회귀 없음)
  - 서버 게이팅(P2): POST `/api/icon-plus` 관리자 전용 + MAIN anchor 필수(400) + processSvgFile sanitize/크기/MIME 검증 — 이미 구현·테스트됨. 다이얼로그는 이 API에 FormData(type/files/anchorX/anchorY) 전송
  - 실 업로드/anchor 저장/위험 SVG 차단 육안 확인은 사내망(로그인+DB)에서 최종 검증 예정
- 계획 대비 변경/결정:
  - 미리보기 렌더: icon-merger와 동일하게 **object URL + `<img>`** 방식(SVG를 이미지로 로드 → 스크립트 실행 불가). 업로드 전 파일은 아직 서버 sanitize 전이므로 `dangerouslySetInnerHTML` 사용 안 함.
  - 하드코딩 색/폰트(`#1E6FFF` 등) → Design5 토큰(`primary`/`border`/`muted`/`destructive`)으로 치환.
  - **범위 결정**: 기존 MAIN 카드의 anchor 재편집(§3.3 "카드 마우스 오버 시 anchor 편집" + PATCH `/api/icon-plus/[id]`)은 Phase 4 완료 기준(업로드 시 anchor 저장)에 포함되지 않아 **후속 작업으로 이연**. 카드가 `<button>`이라 중첩 버튼 회피 위해 카드 래퍼/오버레이 구조 필요 → P5/P6 UI 손볼 때 함께 처리 권장. (PATCH 라우트는 P2에서 구현되어 대기 중)
- 다음 작업:
  - Phase 5 착수 (병합 미리보기 — 선택 조합 → `mergeSvgsByAnchor` 실시간 렌더)

### Phase 5 — 병합 미리보기  ✅
- [x] 선택 조합 → `mergeSvgsByAnchor` 실시간 미리보기(`메인 + 리소스 = 결과`) — 속성 패널 "결과" 슬롯에 렌더
- [x] **다운로드(결과) 크기 표시** `다운로드 크기 W x H` — 병합 결과(속성 적용 후) viewBox 크기 기준
- [x] 미선택/anchor 없음 상태 안내 + (P6) 다운로드 비활성
- 완료 기준: 절단 영역 상단/좌측 정렬(merge 함수가 이미 처리), 결과 viewBox 재계산, 미선택 시 다운로드 비활성 → **충족**
- 수정 파일:
  - `components/category-pages/IconCategory/iconplus/IconPlusPropertyPanel.tsx` (결과 슬롯 placeholder → `mergeSvgsByAnchor` 실시간 렌더 + 상태 분기(미선택/anchor 없음/크기 표시))
- 검증:
  - `?tab=plus` 컴파일 클린 + HTTP 200. 실 병합 렌더는 사내망(로그인 + MAIN anchor 포함 실 데이터)에서 최종 검증 예정
- 계획 대비 변경/결정:
  - P6와 동시 구현(P6 속성 컨트롤이 결과 렌더를 구동하므로 분리 불가). 결과 슬롯은 P6의 `applyIconPlusProperties`(preview 모드) 출력을 렌더.
  - anchor 좌표 데이터: GET 응답이 전체 레코드를 반환하므로 `IconPlusResource`가 `anchorX/anchorY/width/height/viewBox`를 그대로 보유 → 별도 API 변경 불필요.
- 다음 작업:
  - Phase 7 착수 (반응형/접근성/QA)

### Phase 6 — 속성 조정 & 다운로드  ✅
- [x] 색상 10종(흰색 예외) / 선 두께(0.5~3) / 크기(16~256) / 포맷(SVG·PNG·JPG) / 초기화
- [x] SVG/PNG/JPG 다운로드(병합 결과 기준, `lib/svg/*` 재사용)
- 완료 기준: 속성 변경이 미리보기·다운로드에 반영, 3포맷 정상 저장 → **코드 충족** (실 다운로드 파일 육안은 사내망 대기)
- 수정 파일:
  - `lib/svg/icon-plus-properties.ts` (신규 — 순수: `applyIconPlusProperties`. 병합 결과에 색상/두께/크기를 **각 요소 presentation 속성으로 bake**. `changeAllSvgColors` 재사용 + 라인 획에만 stroke-width. preview/download 모드 분리. 단위테스트 12종, XML 유효성 포함)
  - `lib/svg/icon-plus-download.ts` (신규 — 클라이언트: `createDownloadBlob`/`downloadBlob`/`createMergedFilename`. SVG Blob + PNG/JPG Canvas 래스터화(JPG 흰 배경))
  - `lib/svg/icon-plus-properties.test.ts` (신규 — 단위 8종)
  - `components/category-pages/IconCategory/iconplus/IconPlusPropertyPanel.tsx` (색상/두께/크기/포맷/초기화 컨트롤 + 다운로드 버튼/에러 + 결과 미리보기 구동)
- 검증:
  - `npx tsc --noEmit` → 0, `npx next lint`(신규/수정 4파일) → 0
  - `npx vitest run` → 전체 186 통과(신규 icon-plus-properties 8종 포함, 회귀 없음)
  - `?tab=plus` 컴파일 클린 + HTTP 200. 실 다운로드(3포맷)/다크 모드 육안은 사내망(로그인+실 데이터)에서 최종 검증 예정
- **선결 요구(사내망 피드백 2026-07-08) 처리 결과**:
  - (a) ✅ **선 두께는 라인 획에만**: `applyIconPlusProperties`가 라인(`[data-layer] [stroke]:not([fill])`)에만 `stroke-width`를 주입하고, fill 요소(`[fill]:not([fill="none"])`)에는 색상만 적용. Design5 `.svg-line-preview` 조건부 규칙과 정합. (icon-merger처럼 전체를 fill:none 강제하지 않고 채움 보존)
  - (b) ✅ **다크 모드 가시성**: 미리보기/결과 타일에 밝은 배경(`bg-white`)을 고정해 원본 검정 획·글자도 라이트/다크 모두 가시. 흰색 색상 선택 시에만 결과 타일 배경을 검정(`bg-neutral-900`)으로 반전. 색상 컨트롤 선택 시 결과는 선택 색으로 재렌더.
    - **남은 항목**: 섹션 카드(`ResourceSection`/`IconPlusCard`)의 다크 모드 배경은 P6 컨트롤이 구동하지 않는 영역이라 이번 범위 밖. 필요 시 P7에서 카드 배경/획 색을 라이트 고정 또는 테마 대응으로 별도 처리.
  - (c) ✅ **선 두께 미리보기 연동**: 결과 미리보기 stroke를 컨트롤 값(기본 1px)으로 구동(preview 모드). 소형 타일 대비 `non-scaling-stroke` + 최소 표시 두께 플로어(기본 1px)로 끊김 방지. 다운로드는 출력 높이 기준 절대 두께로 스케일.
    - **결정**: 입력 미리보기(메인/리소스) 타일과 **섹션 카드**의 `.svg-line-preview` 하드코딩 `stroke-width:1.25px`는 **유지**(제거 시 카드 정규화 회귀). 컨트롤이 구동하는 대상은 "결과" 슬롯과 다운로드 결과물에 한정. (핸드오프 원안의 "하드코딩 CSS 제거"는 카드 회귀 위험으로 미채택)
- 다음 작업:
  - Phase 7 착수 (반응형/접근성/QA)

### Phase 7 — 반응형/접근성/QA  ✅
- [x] 태블릿/모바일 대응(모바일 속성 시트 — 하단에서 슬라이딩)
- [x] 조합 선택 시 하단 플로팅 버튼 "메인 + 아이콘/텍스트 : 결과 조정하기"
- [x] `aria-*`/키보드 접근성(플로팅 버튼 aria-label, Sheet=Radix Dialog 포커스 트랩/ESC/오버레이 닫기, `sr-only` 제목)
- [x] 회귀 테스트(tsc/lint 0 + 단위테스트 190 통과, ICON 탭 포함)
- 완료 기준: 주요 뷰포트 정상, 접근성 확인, 회귀 없음 → **코드 충족** (실기기 육안은 사내망 대기)
- 수정 파일:
  - `app/_category-pages/icon/IconPlusWorkspace.tsx` (모바일 뷰포트 감지(`useIsMobileViewport`) + 플로팅 버튼(md:hidden, 메인+리소스 모두 선택 시) + 하단 슬라이딩 `Sheet`(side="bottom", `h-[70vh]`) 안에 속성 패널 `variant="sheet"` 렌더. 선택 조합 해제 시 시트 자동 닫힘)
  - `components/category-pages/IconCategory/iconplus/IconPlusPropertyPanel.tsx` (`variant?: 'sidebar' | 'sheet'` prop 추가 — sheet 모드는 `fixed` 대신 부모 Sheet가 위치/애니메이션 담당, 폭만 채움)
  - `tailwind.config.ts` (**전역 수정**: `tailwindcss-animate` 플러그인 등록. 미등록이라 `animate-in`/`slide-in-from-*`/`fade-in`/`zoom-in` 클래스가 no-op → 모든 `Sheet`/`Dialog`가 슬라이딩 없이 즉시 표시되던 문제 해결)
- 검증:
  - `npx tsc --noEmit` → 0, `npx next lint`(수정 파일) → 0
  - `npx vitest run` → 전체 190 통과(회귀 없음)
  - `next dev`: `/icon?tab=plus` 컴파일 클린 + HTTP 200. 생성 CSS에 `@keyframes enter/exit`·`.animate-in`·`--tw-enter-translate-y` 방출 확인(플러그인 활성 검증, 이전엔 부재)
- 계획 대비 변경/결정:
  - **패턴 통일**: 이미 반응형이 끝난 ICON 탭(`IconTab`)의 모바일 패턴(`useIsMobileViewport` + `Sheet` + 패널 `variant`)을 그대로 채택해 두 탭 UX/구현 일관성 유지. icon-merger의 UX(조합 선택 → 하단 플로팅 버튼 → 슬라이딩 패널)를 Design5 컴포넌트로 이식.
  - **슬라이딩 방향**: 최초 우측(`side="right"`)으로 구현했으나, 사용자 피드백으로 **하단(`side="bottom"`, `h-[70vh]`)** 으로 변경 — ICON 탭 및 다른 메뉴 페이지(gallery/character/chart-generator/ci-bi/ppt/design-request/pdf-extractor/GenericListPage 등)와 방향 일관.
  - **슬라이딩 미동작 근본 원인 해결(전역)**: `tailwindcss-animate`가 `package.json` 의존성엔 있으나 `tailwind.config.ts` `plugins`에 **미등록** → shadcn 컴포넌트가 참조하는 애니메이션 유틸리티 클래스가 전부 무효였음. 플러그인 등록으로 **모든 페이지의 하단 시트가 부드럽게 슬라이딩**(및 Dialog/Dropdown/Tooltip 등 shadcn 기본 페이드·줌 애니메이션 동시 활성 — 사용자 승인). `require` 대신 `import tailwindcssAnimate from 'tailwindcss-animate'`로 등록(TS/lint 정합).
  - **버튼 노출 조건**: 메인 + 병합용 리소스를 **모두** 선택했을 때만 노출(`canOpenMobileProperties`). anchor 미존재 등 병합 불가 상태는 패널 내부 안내문으로 처리(데스크톱 패널과 동일 동작).
  - **기본 레이아웃**: 워크스페이스 좌측 컬럼은 이미 `pr-0 md:pr-[410px]` + `grid-cols-1 lg:grid-cols-[...]`로 반응형이 되어 있어 추가 변경 없음. 다크 모드는 미지원 확정이므로 범위 제외.
- 다음 작업:
  - (없음) — P7 완료. 전역 애니메이션 활성화에 따른 타 페이지 시트/다이얼로그 동작은 운영 배포 시 참고.

---

## 구현 완료 (2026-07-08)
- **ICON+ 전 단계(P0~P7) 코드 구현 완료.** 모든 계획서(§) 항목이 반영되었으며, tsc/lint 0 + 단위테스트 190 통과 + `?tab=plus` 컴파일·200으로 검증됨. 브랜치 `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` push 완료.
- 남은 것은 **코드 작업이 아니라 운영(사내망) 육안 확인 항목**뿐 — 아래 잔여 목록 참고.

## 미해결 / 결정 대기
- (없음) — 다크 모드는 **미지원 확정**(2026-07-08, 관련 UI 아이콘도 이미 숨김). 선결요건 b의 카드 다크 대응 잔여 항목은 방침에 따라 종료.

## 사내망 운영 확인 잔여 (구현 완료, 코드 작업 아님)
- **개발망 확인 완료(2026-07-08)**: P5 병합 미리보기, P6 다운로드(SVG/PNG/JPG)·색상/두께/크기·JPG 품질·미리보기 가변 크기, 포맷 버튼 스타일, anchor 편집 아이콘, 업로드 파일명 줄바꿈, **P7 모바일 QA(하단 슬라이딩 시트·플로팅 버튼·close 버튼·버튼 줄바꿈)**.
- **잔여 운영 확인**: P2 관리자 업로드/삭제/anchor·비관리자 403(API), P3 실 데이터 카드 표시·선택·삭제, P4 위험 SVG 차단, MAIN anchor 재편집(hover 편집→PATCH→미리보기 갱신) 운영 환경 최종 확인. (P1 검증 완료)
- 브랜치: 모든 작업 `refactor/phase2-api-layer` 로컬 → `origin/2026-06-17-tiper` push.

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
| 2026-07-07 | P3 | 사내망 UI 피드백 반영: ICON+ 우측 속성 패널을 ICON 탭과 동일하게 화면 전체 높이 `fixed` + 테두리 제거(배경색 차이로 구분). 워크스페이스를 좌측 스크롤 컬럼(헤더 포함, `pr-[410px]`) + 우측 고정 패널 구조로 재편(두 탭 레이아웃 일관) |
| 2026-07-08 | P3 | 사내망 UI 피드백 2차: "아이콘 속성" 폰트 20px(ICON 탭과 통일), 대표 미리보기 컨테이너 테두리 제거 + 배경을 좌측 콘텐츠 영역과 동일(`bg-neutral-50 dark:bg-neutral-900`), 미리보기 메인/리소스 슬롯 배경 흰색(`bg-background`), 탭↔카드 간격 `pt-2`→`pt-4`. ICON 탭 설명글 `mt-1` 통일 → **P3 최종 확정** |
| 2026-07-08 | P4 | 업로드 다이얼로그(`IconPlusUploadDialog`) 구현: SVG 드래그앤드롭, MAIN 단건+anchor 클릭·드래그(십자선)·좌표 입력, 병합용 다중. 워크스페이스 `추가` 버튼(토스트 → 다이얼로그 오픈, 성공 시 refresh). tsc/lint 0 + 178 통과 → **P4 ✅** (실 업로드는 사내망 대기). 기존 MAIN anchor 재편집(PATCH)은 후속 이연 |
| 2026-07-08 | P3/P4 | 사내망 카드 UI 피드백 반영(icon-merger 참고): ①MAIN·MERGE_ICON·미리보기 아이콘 라인 렌더(`svg-line-preview` 전역 CSS, 텍스트는 채움 유지) ②병합용 텍스트 카드 높이 고정+종횡비 가로 확장(`getTextCardWidth`, flex-wrap) ③선택 개수 뱃지화(penta-sky) ④선택 해제 버튼 `secondary`(배경) ⑤카드 우상단 체크 아이콘 제거 ⑥hover/선택 시 연한 포인트 배경+포인트 테두리(penta-sky/blue) ⑦카드 hover 툴팁으로 파일명 표시 |
| 2026-07-08 | P3/P4 | 라인 렌더 방식 조정: 전체 강제(fill:none/stroke:currentColor) → **조건부**(`[stroke]:not([fill])`만 fill:none)로 변경해 fill이 지정된 부분은 채움 보존. 선 두께-vs-fill 요구는 Phase 6 선결 항목으로 문서화 |
| 2026-07-08 | P3/P4 | 사내망 피드백: ①라인 요소(`[stroke]:not([fill])`) stroke 두께 정규화(`stroke-width:1.25px` + `non-scaling-stroke`)로 메인/리소스 굵기 일치(fill 부분 제외) ②대표 미리보기에 선택 아이콘 이름(`메인+리소스`) 표시. 다운로드 크기 표시는 병합 계산 필요 → Phase 5로 이관 |
| 2026-07-08 | P5/P6 | 병합 미리보기(`mergeSvgsByAnchor` 실시간 렌더) + 속성 컨트롤(색상 10종/선 두께/크기/포맷/초기화) + SVG·PNG·JPG 다운로드 구현. 신규 `lib/svg/icon-plus-properties.ts`(속성 주입, 순수) / `icon-plus-download.ts`(Blob 렌더, 클라이언트) + 단위 8종. 선결요건 a(선 두께 라인 획 한정, fill 채움 보존)·b(미리보기 밝은 배경 고정+흰색 반전)·c(결과 stroke를 컨트롤값 구동, 카드 하드코딩 CSS는 회귀 방지 위해 유지) 처리. tsc/lint 0 + 186 통과 + `?tab=plus` 200 → **P5·P6 ✅** (실 다운로드/다크 육안은 사내망 대기) |
| 2026-07-08 | 이연항목 | **기존 MAIN anchor 재편집 구현**(P4 이연 항목 해소). 카드 우상단 hover 편집 버튼(선택 `<button>`과 형제로 배치해 중첩 회피) → `IconPlusAnchorDialog`(저장된 svgContent를 sanitize 완료 값으로 렌더, 십자선 클릭·드래그 + 좌표 입력) → `PATCH /api/icon-plus/[id]` → `refresh('MAIN')`. anchor 헬퍼(clamp/formatCoordinate/getContainedRect)를 `anchor-utils.ts`로 추출해 업로드/편집 다이얼로그 공용화. 다크 모드 미지원 확정 반영(관련 항목 종료). tsc/lint 0 + 190 통과 + `?tab=plus` 200 |
| 2026-07-08 | P6 | 사내망 테스트 피드백 3건 반영: ①**다운로드 SVG 색상 미적용/채움 잔존** → `<style>` 주입은 macOS 미리보기 등에서 내부 CSS(`:not()`/속성 선택자) 미적용이 원인. `applyIconPlusProperties`를 **presentation 속성 bake 방식**(ICON 탭과 동일, `changeAllSvgColors` 재사용, 라인 획에만 stroke-width)으로 재작성 → 뷰어 독립. 래스터 대비 XML 유효성 테스트 추가. ②**JPG 화질** → `toBlob` 품질 0.92→1.0(PNG 무손실이라 무관). ③**미리보기 크기 미반영** → 결과 슬롯을 꽉 채움 대신 크기 컨트롤 기반 표시 높이(`size*1.5`, 24~64px)로 렌더(icon-merger `PreviewTile` 방식). tsc/lint 0 + 190 통과 |
| 2026-07-08 | UI | 포맷 선택 버튼(SVG/PNG/JPG) 스타일을 ICON 탭 속성 패널(`IconPropertyPanel`)과 통일(hover/선택/테두리/크기 `h-8 flex-1`). anchor 편집 버튼 아이콘 `Pencil`→`Crosshair`(target). 업로드 다이얼로그 선택 파일명 길이 초과 시 잘림 → 줄바꿈(`whitespace-normal break-words`). **개발망 확인 완료** |
| 2026-07-08 | P7 | 모바일 반응형: `useIsMobileViewport` + 슬라이딩 `Sheet`로 속성 패널 접근. 메인+리소스 모두 선택 시 하단 플로팅 버튼("메인 + 아이콘/텍스트 : 결과 조정하기") → 시트 오픈, 선택 해제 시 자동 닫힘. `IconPlusPropertyPanel`에 `variant='sheet'` 추가. ICON 탭 모바일 패턴 채택(두 탭 일관), icon-merger UX 이식. tsc/lint 0 + 190 통과 + `?tab=plus` 200 → **P7 🟡** (실기기 육안은 사내망 대기) |
| 2026-07-08 | P7 | 사용자 피드백 반영: ①ICON+ 모바일 시트를 우측→**하단(`side="bottom"`)** 으로 변경(ICON 탭·타 페이지와 방향 일관). ②**슬라이딩 미동작 근본 원인 해결**: `tailwind.config.ts`에 `tailwindcss-animate` 플러그인 미등록 → 모든 `Sheet`/`Dialog` 애니메이션 클래스가 no-op이던 문제. 플러그인 등록으로 전 페이지 하단 시트 부드러운 슬라이딩 활성(gallery/character/chart-generator/ci-bi/ppt/design-request/pdf-extractor/GenericListPage/ICON 탭 등 공용 `Sheet` 사용처 전부). 생성 CSS에 `@keyframes enter/exit` 방출 확인. tsc/lint 0 + 190 통과 |
| 2026-07-08 | P7 | 사내망 1차 QA 피드백 4건: ①ICON+ 플로팅 버튼 좌측 아이콘 제거. ②**시트 close 버튼 겹침 해결(전역)**: 공용 `sheet.tsx` close를 둥근 아이콘 버튼(rounded-full+border+bg)으로 재스타일 + 모바일 시트 속성 패널 상단 패딩 `pt-6`→`pt-14`(초기화 버튼 위로 close 배치, 겹침 제거). 적용: Icon/IconPlus/Character/CiBi/Ppt/Generic PropertyPanel + ChartSettingsPanel. ③ICON 탭 액션 버튼 행 `flex-wrap`(폭 초과 시 줄바꿈, 검색창 `min-w-[200px]`). ④ICON 탭 "속성 패널 열기" 버튼 제거(아이콘 선택 시 시트 자동 오픈으로 불필요). tsc 0 + 190 통과 + `/icon?tab=plus`·`/chart-generator` 200 |
| 2026-07-08 | P7 | **사내망 모바일 QA 확인 완료** → P7 ✅. ICON+ 전 단계(P0~P7) 구현 완료 확정. 잔여는 코드 작업이 아닌 운영 육안 확인 항목(P2 관리자 API/P3 실 데이터 카드/P4 위험 SVG 차단/anchor 재편집)뿐. 문서 상태 갱신 |
