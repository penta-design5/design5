# 사이드바 섹션 접기/펴기 + 접힌 섹션 플라이아웃 Handoff

> **진행 상태의 단일 원본은 이 문서다.** 단계를 진행하거나 완료할 때 이 문서를 갱신한다.

- **목표**
  - 사이드바 메뉴가 많아져 스크롤이 길어졌다. 섹션(BROCHURE, TOOLBOX, LABS 등)을 **섹션 제목 클릭으로 접고 펼 수 있게** 한다.
  - 접힌 섹션에 마우스를 올리면 **오른쪽 플라이아웃(작은 메뉴 패널)으로 메뉴 목록을 보여주고, 클릭해서 바로 이동**할 수 있게 한다.
- **결정 사항 (2026-11-04, 사용자 확인)**
  1. UI는 "섹션 제목 토글 + 마우스를 올리면 보이는 화살표" 방식(A안)으로 한다. Linear·Notion 계열이다.
  2. 현재 메뉴가 들어 있는 섹션은 자동으로 펼친다.
  3. 접기/펴기 상태를 저장하고, 기본값은 모두 펼침으로 한다.
  4. 접힌 섹션에는 항목 수를 표시한다.
  5. 접힌 섹션에 마우스를 올리면 **클릭 가능한 플라이아웃**을 연다. 툴팁이 아니라 Radix HoverCard를 쓴다.
  6. (2026-11-04) 메뉴 관리와의 관계: 접힌 섹션에 메뉴를 추가해도 자동으로 펼치지 않는다. 항목 수만 바뀌고, 사용자가 펼치거나 플라이아웃에서 확인한다. 섹션의 메뉴가 모두 숨겨져 섹션이 사라져도 저장된 접힘 상태는 그대로 둔다.
- **최종 업데이트:** 2026-11-04 — P1 구현·로컬 검증 완료(커밋·개발망 확인 대기)
- **작업 브랜치:** 로컬 브랜치는 자유. 푸시는 항상 `git push origin HEAD:2026-06-17-tiper`
- **선행 커밋:** `448b2ef` (사이드바 상하 그라데이션 + 현재 메뉴 자동 스크롤)
- **다음 세션 시작점:** P1 커밋·푸시 → 개발망 확인 → **P2**

범례: ⬜ 대기 · 🟡 진행중 · ✅ 완료 · ⛔ 블록

---

## 진행 현황 요약

| Phase | 내용 | 상태 | 커밋 | 검증 |
|---|---|---|---|---|
| P1 | 섹션별 메뉴를 데이터 목록으로 정리 (화면 변화 없음) | 🟡 | | 로컬 ✅(픽셀 비교 0) · 개발망 ⬜ |
| P2 | 섹션 접기/펴기 (제목 토글, 상태 저장, 현재 섹션 자동 펼침, 항목 수) | ⬜ | | |
| P3 | 접힌 섹션 플라이아웃 (HoverCard, 클릭 이동) | ⬜ | | |
| (선택) | Alt/Option + 섹션 제목 클릭으로 전체 접기/펴기 | ⬜ | | 사용자가 원하면 P2에 포함 |

각 Phase가 끝날 때마다 다음을 거친다.
1. 로컬 `npm run typecheck && npm run lint`
2. 커밋·푸시 (푸시 전 사용자 확인)
3. 개발망(design6) 확인

DB 변경은 없다.

---

## 현재 구조 (2026-11-04, `448b2ef` 기준)

파일: `components/category-pages/layout/Sidebar.tsx`

- **섹션 순서:** `categoryOrder` (약 271행)
  - `WORK → SOURCE → TEMPLATE → BROCHURE → TOOLBOX → ETC(LABs) → INSIGHTS → ADMIN`
  - 섹션 제목은 `getCategoryLabel()`이 정한다. ETC는 `LABs`로 표시한다.
- **섹션 렌더링이 4가지로 흩어져 있음:**
  - **일반 카테고리** (WORK·SOURCE·TEMPLATE·BROCHURE·INSIGHTS, 약 530행~)
    - DB `categories`를 type별로 묶어 `renderCategory()`로 그린다.
    - `isHidden`은 필터한다.
    - 하위 카테고리가 있으면 **왼쪽 화살표**로 펼친다(`expandedCategories`, 카테고리 단위).
  - **TOOLBOX** (약 349행): `lib/toolbox/menu.ts`의 `TOOLBOX_MENU`를 `renderStaticLink()`로 그린다. OCR은 `fullReload`(문서 새로고침 이동)를 쓴다.
  - **ETC/LABs** (약 369행): eDM·PDF Extractor·Chart Generator·Mind5(외부 링크, 새 탭)가 하드코딩되어 있다.
  - **ADMIN** (약 433행)
    - `session.user.role === 'ADMIN'`일 때만 보인다.
    - 대시보드·회원 관리·공지사항 관리·메뉴 관리가 하드코딩되어 있다.
    - 디자인 시스템은 `canAccessDesignSystem(email)`일 때만 보인다.
- **링크 동작 규칙** (사이드바와 플라이아웃이 반드시 같아야 함)
  - 로그아웃 상태에서 클릭하면 `/login`으로 보낸다(`router.push`). 일반 카테고리, static link, ADMIN이 해당한다.
  - `onLinkClick()`: 모바일 시트를 닫는다.
  - TOOLBOX OCR은 `fullReload`로 이동한다. 일반 클릭은 `window.location.assign`, 수정키를 누른 클릭은 기본 동작에 맡긴다.
  - Mind5는 `target="_blank"`이고 ↗ 아이콘을 붙인다.
- **활성 표시**
  - 활성 링크에 `aria-current="page"`가 붙어 있다(`448b2ef`).
  - 자동 스크롤은 이 속성으로 현재 메뉴를 찾는다(약 56행 `useEffect`). 접기 기능을 넣어도 반드시 유지한다.
- **스크롤 영역**
  - `ScrollEdgeFades` (`components/ui/scroll-edge-fades.tsx`, 세로)
  - 내용 크기 변화를 ResizeObserver로 감지하므로, 섹션을 접어 스크롤이 필요 없어지면 그라데이션 막이 자동으로 사라진다.
  - 단, 관찰 대상은 스크롤 영역의 **직계 자식**이다. 그 자식 안에서 높이가 바뀌어도 자식 자체의 크기가 바뀌므로 감지된다.
- **사이드바가 2곳에 마운트됨** (`components/category-pages/layout/MainLayout.tsx`)
  - 데스크톱 `<aside>`, 모바일 `<Sheet>`.
  - 접기 상태를 localStorage로 공유하면 두 곳이 같은 값을 읽는다. 동시에 보이는 일은 없다.
- **쓸 수 있는 부품**
  - `@radix-ui/react-accordion`이 설치되어 있다(`components/ui/accordion.tsx`).
  - tailwind에 `accordion-down/up` 애니메이션(0.2s)이 설정되어 있다.
  - `@radix-ui/react-hover-card`는 **미설치**다. P3에서 추가한다.
- ⚠️ **제목 없는 그룹 확인 필요**
  - 사용자 스크린샷의 맨 위 그룹(바탕화면·웰컴보드·감사/연말 카드)은 스크롤 상태라 섹션 제목이 보이지 않았다.
  - `getCategoryLabel(WORK)`는 `'WORK'`를 반환하므로 제목이 있는 것으로 추정된다. P1에서 실제 화면으로 확인한다.
  - 제목이 없는 그룹은 접기 대상에서 제외하고 항상 펼친다.

---

## P1 — 섹션별 메뉴를 데이터 목록으로 정리 (화면 변화 없음)

**목적:** 사이드바와 플라이아웃(P3)이 같은 메뉴를 같은 규칙으로 그리려면, 4가지로 흩어진 렌더링을 하나의 데이터 모델로 모아야 한다. 화면과 동작은 그대로 둔다.

### 구현 결과 (2026-11-04)
- **파일**
  - `lib/menus/sidebar-sections.ts` — `SidebarItem`·`SidebarSection` 모델, `SIDEBAR_SECTION_ORDER`, `buildSidebarSections({ categories, isAdmin, showDesignSystem })`
    - 계획의 `session`·`canAccessDesignSystem` 인자 대신 **불리언 2개**를 받는다(순수 함수 유지, 테스트 간단). Sidebar에서 `userRole === 'ADMIN'`, `canAccessDesignSystem(email)`을 넘긴다.
    - `CategoryType`은 `import type`만 쓴다(테스트에서 Prisma 클라이언트 불필요).
  - `components/category-pages/layout/SidebarLink.tsx`
    - `<SidebarLink>`: 하위 항목 없는 링크 한 줄. 로그인 가드·fullReload·외부 링크(↗)·`aria-current`를 처리한다. **P3 플라이아웃에서 이것을 재사용**한다.
    - `<SidebarItemNode>`: 항목 래퍼(`div.pr-4`) + 하위 카테고리 왼쪽 화살표 펼침. 펼침 상태는 `expandedKeys`·`onToggle`로 받는다.
  - `components/category-pages/layout/Sidebar.tsx` — 4가지 렌더링 분기를 `sections.map` 하나로 교체. 섹션 제목 마크업은 그대로 Sidebar에 있다(P2에서 토글 버튼으로 바꿀 자리).
  - `lib/__tests__/sidebar-sections.test.ts` — 11개 테스트
- **기존과 달라진 점 (화면은 동일)**
  - 행 스타일(`px-3 py-1`, 활성·hover 색)을 바깥 `div`가 아니라 **링크/버튼 자체**에 붙였다. 일반 카테고리·TOOLBOX 링크의 클릭 영역이 행 여백까지 넓어졌다(LABs·ADMIN은 원래 이 방식).
  - 하위 카테고리 토글 버튼에 `aria-expanded`, `type="button"` 추가.
  - 기존 판정 규칙은 그대로 유지: LABs는 로그인 가드 없음, PDF Extractor·Chart Generator는 정확히 일치, ADMIN은 `startsWith`.
- **제목 없는 그룹: 없음.** 모든 섹션이 제목을 가진다(WORK 섹션 제목은 `WORK`, 화면에서 확인). `label: null` 분기는 모델에만 남겨 둔다.
- **로컬 검증 방법** (DB 없이): 스크래치 복사본에서 `getCategories`만 가짜 카테고리(하위·숨김 포함)로 바꾸고 관리자 테스트 쿠키로 접속해, 변경 전(HEAD)·후 사이드바를 같은 조건으로 캡처해 비교했다.
  - 픽셀 비교(threshold 0): 라이트, 다크, 항목 hover, Mind5 hover(↗), 하위 카테고리 펼침, 모바일 시트 → **6장 모두 차이 0픽셀**
  - 동작 비교(전·후 동일): 메뉴 텍스트·순서, `aria-current`, Mind5 `target=_blank`, TOOLBOX SPA 이동, OCR 문서 새로고침 이동, 자동 스크롤 위치(`/admin/menus`·`/toolbox/text-extractor`), 모바일 시트 링크 클릭 후 닫힘
  - 로그아웃 상태: `/`가 `/penta-design`으로 이동하고 사이드바가 없는 화면이라, 로그아웃 클릭 가드는 로컬에서 직접 누를 수 없었다(세션 만료 시에만 해당). 코드상 기존과 같은 조건이다.
- 참고: `npx vitest run` 전체 실행 시 `preset-storage`·`card-schemas` 15건 실패는 **기존 문제**(Node 내장 localStorage와 jsdom 충돌)이며 이번 변경과 무관하다.

### 작업
- [x] **메뉴 모델 정의** (예: `lib/menus/sidebar-sections.ts` 또는 Sidebar 옆 파일)
  ```ts
  type SidebarItem = {
    key: string            // 고유 키 (slug 등)
    label: string
    href: string           // '/wallpaper', '/toolbox/ocr', 'https://…'
    icon?: LucideIcon      // ADMIN 항목
    external?: boolean     // Mind5 (새 탭 + ↗)
    fullReload?: boolean   // TOOLBOX OCR
    requiresAuth?: boolean // 로그아웃이면 /login
    isActive: (pathname: string) => boolean
    children?: SidebarItem[] // 하위 카테고리
  }
  type SidebarSection = {
    id: string             // 'WORK' | 'BROCHURE' | 'TOOLBOX' | 'ETC' | 'ADMIN' …  (상태 저장 키로도 사용)
    label: string | null   // null이면 제목 없는 그룹 → 접기 대상 아님
    items: SidebarItem[]
  }
  ```
- [x] **`buildSidebarSections({ categories, session, canAccessDesignSystem })` 순수 함수**
  - 지금의 `categoryOrder`, isHidden 필터, 빈 섹션 제외, ADMIN 권한 조건을 그대로 옮긴다.
- [x] **공용 렌더러 `<SidebarLink item>`** 하나로 일반·static·LABs·ADMIN 링크를 통일한다.
  - 클래스와 동작을 기존과 똑같이 맞춘다. 클래스는 `px-3 py-1`, 활성·hover 색, 외부 링크 아이콘 hover 노출 등이다.
  - `aria-current`, 로그인 가드, `onLinkClick`, fullReload 처리를 포함한다.
- [x] 하위 카테고리 펼침(`expandedCategories`, 왼쪽 화살표)도 기존 동작 그대로 유지한다.
- [x] **단위 테스트:** `buildSidebarSections` (`lib/**/*.test.ts`, vitest·jsdom)
  - 섹션 순서
  - isHidden 제외, 빈 섹션 제외
  - ADMIN은 role이 ADMIN일 때만, 디자인 시스템은 권한이 있을 때만
  - TOOLBOX OCR `fullReload`
  - 활성 판정 (`/`일 때 비활성, 하위 경로 포함)

### 검증 체크리스트
- [x] (로컬) 사이드바가 **변경 전과 픽셀 단위로 같음**: 섹션 순서, 간격, 색, 아이콘 (데스크톱·모바일 시트·다크 모드)
- [ ] 로그아웃 상태 클릭 → `/login` (로컬 직접 확인 불가, 위 참고) · [x] OCR 새로고침 이동, Mind5 새 탭 (로컬)
- [x] (로컬) 활성 메뉴 강조와 자동 스크롤(OCR·ADMIN 새로고침)이 그대로 동작
- [x] (로컬) 하위 카테고리 왼쪽 화살표 펼침 그대로
- [x] 제목 없는 그룹이 있는지 확인하고 결과를 이 문서에 기록 → 없음
- [ ] **개발망(design6)** 실제 DB 메뉴로 위 항목 육안 확인

---

## P2 — 섹션 접기/펴기

### UI 스펙
```
 BROCHURE              ˅   ← 마우스를 올리거나 포커스가 가면 화살표 표시, 제목 줄 전체가 버튼
   WAPPLES
   ...
 TOOLBOX  8            ›   ← 접힘: 화살표 항상 표시(오른쪽, -90° 회전), 항목 수를 흐리게 표시
 LABS                  ˅
```
- **섹션 제목**
  - `<button aria-expanded aria-controls>`로 만든다.
  - 지금 제목 스타일(`px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground`)을 유지한다.
  - hover하면 글자색을 `text-foreground` 쪽으로 살짝 진하게 한다.
- **화살표**
  - **오른쪽 끝**에 둔다. 하위 카테고리 화살표가 왼쪽이라 구분이 필요하다.
  - 펼침 상태에서는 hover나 `focus-visible`일 때만 보이고(`opacity` 전환), 접힘 상태에서는 항상 보인다.
  - 회전은 `transition-transform` 150ms로 한다.
- **항목 수:** 접혔을 때만 제목 옆에 `text-muted-foreground/60`으로 표시한다. 하위 카테고리는 세지 않고 최상위 항목만 센다.
- **높이 애니메이션**
  - Radix Accordion `type="multiple"`을 쓰고 tailwind `animate-accordion-down/up`(0.2s)을 적용한다.
  - `prefers-reduced-motion`이면 애니메이션을 끈다(`motion-reduce:animate-none`).
  - `components/ui/accordion.tsx`의 기본 스타일(테두리, 큰 글씨 트리거)은 사이드바와 맞지 않는다. Radix primitive를 직접 쓰거나 사이드바 전용 래퍼를 만든다.

### 동작 스펙
- **상태 저장**
  - localStorage 키 예: `design5:sidebar:collapsed-sections`. 값은 **접힌 섹션 id 배열**로 한다.
  - 펼침을 기본으로 두고 접힌 것만 저장하면, 새 섹션이 생겨도 기본적으로 펼쳐진다.
  - 모든 읽기·쓰기를 `try/catch`로 감싼다. 시크릿 모드나 저장소 차단 환경에서도 동작해야 한다.
- **첫 화면 깜빡임 방지**
  - 저장된 값은 마운트 후에 읽는다(SSR과 hydration 불일치를 피하기 위해).
  - **값을 읽기 전까지 높이 애니메이션을 끄고** 바로 반영한다. 첫 렌더에서 저장값을 적용할 때는 애니메이션 없이 즉시 바꾼다.
  - 깜빡임이 여전히 거슬리면 쿠키 저장으로 바꾸고 서버(`MainLayout` 상위)에서 초기값을 넘기는 방안을 검토한다. 작업량이 늘어나므로 필요할 때만 한다.
- **현재 섹션 자동 펼침**
  - pathname이 바뀌었을 때 활성 항목이 든 섹션이 접혀 있으면 펼친다.
  - 이 자동 펼침은 **저장 상태를 바꾸지 않는 "일시 펼침"으로 할지, 저장 상태도 펼침으로 바꿀지** 구현 시 결정한다. 권장은 **일시 펼침**이다. 다른 페이지로 가면 사용자가 접어 둔 상태로 돌아간다.
  - 자동 스크롤 effect(`aria-current` 탐색)는 섹션이 펼쳐진 **뒤에** 실행되어야 한다. 애니메이션 중에는 높이가 계속 바뀌므로, 펼침 애니메이션이 끝난 뒤(`onAnimationEnd`)나 일시 펼침을 애니메이션 없이 즉시 적용한 상태에서 스크롤 위치를 계산한다.
- **제목 없는 그룹:** 접기 대상이 아니며 항상 펼친다.
- **(선택) Alt/Option + 클릭:** 모든 섹션을 접거나 펼친다. 클릭한 섹션의 새 상태를 전체에 적용한다.
- **모바일 시트:** 같은 컴포넌트·같은 저장값을 쓴다. 탭하면 토글한다.

### 검증 체크리스트
- [ ] 제목 클릭과 키보드(Tab → Enter/Space)로 접고 펼침, 스크린리더가 `aria-expanded`를 읽음
- [ ] 화살표: 펼침 상태는 hover·포커스일 때만, 접힘 상태는 항상 표시, 회전 애니메이션
- [ ] 접힌 섹션 항목 수 표시
- [ ] 새로고침해도 상태 유지, 첫 화면에서 펼쳐졌다 접히는 깜빡임이 거슬리지 않음
- [ ] 접힌 섹션의 메뉴 페이지로 들어오면(예: TOOLBOX를 접은 채 `/toolbox/ocr` 새로고침) 해당 섹션이 펼쳐지고 현재 메뉴로 자동 스크롤
- [ ] 섹션을 접어 스크롤이 필요 없어지면 그라데이션 막이 사라지고, 다시 펼치면 나타남
- [ ] 모션 줄이기 설정에서 애니메이션 없음
- [ ] 모바일 시트, 다크 모드, localStorage 차단(시크릿 모드)에서도 정상

---

## P3 — 접힌 섹션 플라이아웃

### 준비
- [ ] `npm i @radix-ui/react-hover-card`
- [ ] `components/ui/hover-card.tsx` 래퍼를 추가한다(shadcn 형식). Portal, `z-50`, 테마 토큰을 사용한다.

### UI·동작 스펙
```
 TOOLBOX  8         ›  ┌────────────────────┐
                       │ TOOLBOX            │
                       │ 이미지 편집         │
                       │ ...                │
                       │ 텍스트추출(OCR)     │ ← 현재 메뉴면 활성 색
                       └────────────────────┘
```
- **열리는 조건:** **접힌 섹션** 제목에 마우스를 올렸을 때만 연다. 펼쳐진 섹션에서는 열지 않는다(`open` 제어 또는 비활성).
- **지연:** `openDelay` 약 300ms, `closeDelay` 약 150ms. 사이드바를 지나가기만 할 때 패널이 번쩍이는 것을 막고, 패널로 마우스를 옮기는 동안 유지한다.
- **위치:** `side="right" align="start" sideOffset={8}`이며 화면 가장자리에서는 자동 보정한다. Portal을 쓰므로 `ScrollEdgeFades` 스크롤 영역에 잘리지 않는다.
- **내용**
  - 섹션 이름(작은 제목)과 항목 목록을 보여준다. **P1의 `<SidebarLink>`를 재사용**한다.
  - 현재 메뉴는 강조하고, 하위 카테고리는 들여쓰기로 보여준다. Mind5에는 ↗를 붙인다.
  - 항목이 많으면 `max-h`와 내부 스크롤로 처리한다.
- **클릭:** 사이드바 링크와 동일하게 동작한다(로그인 가드, OCR fullReload, 외부 링크 새 탭). 이동 후 패널을 닫고, **섹션은 접힌 상태 그대로** 둔다.
- **제목 클릭:** 패널을 즉시 닫고 섹션을 펼친다.
- **모바일·터치:** 플라이아웃을 띄우지 않는다. HoverCard는 터치에서 열리지 않지만, 시트 안에서는 명시적으로 비활성화하는 편이 안전하다.
- **키보드:** HoverCard는 마우스 사용자를 위한 보조 기능이다. 키보드 사용자는 제목에서 Enter로 섹션을 펼쳐 같은 메뉴에 접근한다.

### 검증 체크리스트
- [ ] 접힌 섹션 hover → 약 0.3초 뒤 패널 표시, 펼친 섹션에서는 표시 안 됨
- [ ] 패널로 마우스를 옮겨도 유지, 벗어나면 닫힘, 섹션 제목을 빠르게 훑을 때 깜빡이지 않음
- [ ] 패널 링크 클릭 이동(로그아웃 → `/login`, OCR 새로고침, Mind5 새 탭), 이동 후 패널 닫힘·섹션 접힘 유지
- [ ] 현재 메뉴 강조, 화면 아래쪽 섹션(ADMIN)에서 패널 위치 자동 보정
- [ ] 다크 모드, 모바일 시트에서는 미표시

---

## 주의 사항

- **`aria-current="page"` 유지:** 자동 스크롤과 접근성이 이 속성에 의존한다. P1에서 링크를 통일할 때 빠뜨리지 않는다.
- **링크 동작 일치:** 사이드바와 플라이아웃은 반드시 같은 `<SidebarLink>`를 쓴다. 로그인 가드나 fullReload가 어긋나면 OCR 교차 출처 격리(응답 헤더) 문제가 다시 생긴다.
- **메뉴 관리(`/admin/menus`)와의 관계:** 일반 카테고리 섹션은 DB 값(이름·순서·숨김)을 따른다. 섹션 id는 **CategoryType 값**(`WORK` 등)과 하드코딩 섹션 id(`TOOLBOX`)를 써서, 메뉴 이름이 바뀌어도 저장 상태가 유지되게 한다.
- **로컬 확인 한계:** 사이드바 메뉴는 DB 카테고리로 그려진다. 로컬에서는 개발망 터널이 필요하다. 터널이 없으면 개발망에서 확인한다.
- **preflight:** `npm run typecheck && npm run lint`. `npm run build`는 로컬 DB가 없어 prerender 단계에서 항상 실패하므로 게이트로 쓰지 않는다.
