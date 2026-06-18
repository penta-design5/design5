# 기능 추가·업데이트 핸드오프 (Feature Handoff)

> 리팩토링(`REFACTORING_HANDOFF.md`) **종료 이후**, 새 기능 추가·기존 기능 수정 작업을 이어가기 위한 인수인계 문서.
> 작성일: 2026-06-18 · 작성: Claude Code 세션
> 리팩토링 단계 기록은 `REFACTORING_HANDOFF.md`, 본 문서는 **그 이후의 기능 작업** 단일 출처.

---

## 0. 한눈에 보기 (TL;DR)

- **성격**: Layerary(Next.js 14 + Prisma + NextAuth 사내 디자인 자산 포털)에 대한 **기능 단위 작업 로그 + 작업 규칙**.
- **선행 문서**: 구조/인프라/운영 제약은 [`REFACTORING_HANDOFF.md`](./REFACTORING_HANDOFF.md)에 있음. 본 문서는
  그 **§2.6~2.8(사내망 운영 메모)·§4(작업 규칙)** 를 그대로 계승한다 — 아래 §3에 요점 재정리.
- **현재 브랜치**: 로컬 `refactor/phase2-api-layer`. **GitHub 푸시 대상은 `2026-06-17-tiper` 브랜치**(main 아님).
  푸시: `git push`(이미 upstream 설정됨).
- **검증/반영 흐름**: design6(개발 사내망)에서 테스트 → 통과 시 design5(운영망) 반영. design5는 추후 외부 공개 예정.

### ⚠️ 핵심 제약 (리팩토링 핸드오프에서 계승 — 반드시 기억)
- 이 프로젝트의 **DB·오브젝트 스토리지는 사내망 개발 서버에 있고 외부에서 접근 불가**.
- 따라서 **테스트/CI는 DB·네트워크 비의존**(순수 단위 테스트만), **빌드/런타임 검증은 사용자가 사내망에서** 수행.
- **DB 스키마 변경 없이** 코드 레벨에서 해결할 수 있으면 우선 그렇게 한다(Claude 환경에서 DB 접근 불가).

---

## 1. 작업 로그

### 1.1 Penta Design System 메뉴 추가 ✅ (2026-06-18, 로컬 확인 완료)
- **요구**: WORK 카테고리의 **Penta Design ↔ 디자인 의뢰 사이**에 "Penta Design System" 메뉴를 추가하고,
  클릭 시 `public/penta-design-system/penta-design-system.html`(635KB 자체 완결형 디자인시스템 가이드 문서)을
  **그대로** 페이지로 표시.
- **설계 판단**:
  - DB·스토리지 사내망 제약상 **DB 카테고리로 추가하지 않음**(DB 변경 필요·접근 불가). 대신 eDM/PDF Extractor/
    Chart Generator와 동일한 **하드코딩 정적 메뉴 패턴**을 채택 → DB 스키마/데이터 무변경.
  - 자체 CSS 토큰·`data-theme`·스크립트를 가진 독립 HTML이라 인라인 시 스타일/스크립트 충돌·하이드레이션 위험 →
    **`iframe`으로 "그대로" 렌더링**(가장 충실·견고).
- **변경 파일(3)**:
  - [components/category-pages/layout/Sidebar.tsx](../components/category-pages/layout/Sidebar.tsx):
    `renderStaticLink(slug, label)` 헬퍼 추가(기존 leaf 메뉴와 동일 스타일·활성표시·세션 가드) +
    WORK 맵에서 `category.slug === 'penta-design'` 뒤에 `Fragment`로 정적 링크 삽입.
  - [components/category-pages/layout/MainLayout.tsx](../components/category-pages/layout/MainLayout.tsx):
    `isPentaDesignSystemPage` 감지 → `isCardPageOrSimilar`에 포함해 본문 풀-블리드(`p-0 overflow-hidden`).
    전역 헤더(테마 토글·모바일 메뉴)는 유지.
  - [app/(dashboard)/penta-design-system/page.tsx](<../app/(dashboard)/penta-design-system/page.tsx>):
    신규 라우트. `/penta-design-system/penta-design-system.html`을 가리키는 `iframe`(`w-full h-full border-0`).
  - 정적 자산: `public/penta-design-system/penta-design-system.html`.
- **게이트**: `typecheck` 클린 / `lint` 신규 경고 0 / `test` 165 통과.
- **재사용 패턴**: "DB 게시물이 없는 정적 문서/도구 페이지를 메뉴로 추가" 시 위 3-파일 패턴을 그대로 복제하면 됨
  (Sidebar 정적 링크 + MainLayout 풀-블리드 분기 + `(dashboard)/<slug>/page.tsx`).
- **라우트 충돌 주의**: 라우트 `/penta-design-system`(page.tsx)과 정적 파일 `/penta-design-system/penta-design-system.html`은
  경로가 달라 충돌하지 않음. 정적 메뉴 slug를 정할 때 `public/` 하위 파일 경로와 동일 세그먼트로 겹치지 않게 할 것.

---

## 2. 사내망 dev 검증 체크리스트 (코드 완료분)
> 빌드/런타임/UI는 사용자가 design6에서 확인. ▣ = 확인 완료, □ = 미확인.

### 2.1 Penta Design System 메뉴
- [x] 사이드바 WORK 섹션 순서: **Penta Design → Penta Design System → 디자인 의뢰** (로컬 확인 완료).
- [x] 메뉴 클릭 시 `/penta-design-system`에서 문서가 iframe으로 전체 표시(헤더 아래 영역 채움, 데스크톱/모바일).
- [x] 미로그인 클릭 시 `/login` 이동, 활성 메뉴 하이라이트 정상.

---

## 3. 작업 규칙 (REFACTORING_HANDOFF §2.6~2.8 + §4 계승)

### 3.1 런타임·인프라 (§2.6~2.8)
- **스토리지 URL은 버킷 인식형** `{base}/{버킷}/{키}`. 이미지/파일 URL을 만들 땐 반드시
  [lib/s3/config.ts](../lib/s3/config.ts)의 `publicUrlFor*Key`를 경유 — 직접 문자열 조합 금지.
- `S3_PUBLIC_BASE_URL`은 **버킷 경로 미포함 순수 도메인** 전제(`/edms` 등 접미사 금지).
- 업로드는 **presigned 직접 PUT**. nginx가 `Host $host`로 전달해야 SigV4 서명 일치(서버 설정 의존, 코드에서 호스트 가정 금지).
- eDM/이메일용 이미지 URL은 **만료·서명 없는 평문 + 익명 읽기**(`lib/edm-utils.ts` `getImageUrlForOutput`). 썸네일/에디터용만 presign.
- **레포 미반영 주의**: 서버 nginx `default.conf`가 git `deploy/rocky/nginx/app-http.conf`와 다를 수 있음. 배포 작업 시 확인.

### 3.2 작업 방식 (§4)
- 각 기능은 **독립 머지 가능**하게, 작은 커밋으로.
- **동작 보존** — 의도된 변경 외 UI 결과물·API 응답 형태는 동일하게.
- 변경 후 항상 `npm run lint && npm run typecheck && npm test` 통과 확인(`next build`는 DB 접근 가능성으로 CI 제외 — 사내망에서 사용자 검증).
- 새 코드는 주변 코드 컨벤션(주석 밀도, 네이밍, **한국어 주석 스타일**)을 따른다.
- 커밋 메시지 말미: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **DB/스토리지 접근이 필요한 검증은 사용자에게 요청**(Claude 환경에서 불가) → 변경마다 §2 형식의 검증 체크리스트를 남긴다.

---

## 4. 새 세션 시작 멘트(예시)
> "FEATURE_HANDOFF.md 기준으로 작업 이어가자. <원하는 기능/수정 설명>."

정적 문서/도구 페이지 추가라면:
> "Penta Design System 메뉴와 동일한 패턴으로(§1.1) <새 자산> 메뉴를 <위치>에 추가해줘."
