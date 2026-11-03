# 사이드 메뉴 관리(HTML 메뉴) 구현 계획

> 진행 상태는 [MENU_ADMIN_handoff.md](./MENU_ADMIN_handoff.md)에서 관리한다. 이 문서는 스펙으로 고정한다.
> 작성: 2026-11-03

## 1. 목표

관리자가 **WORK · SOURCE · TEMPLATE · BROCHURE · INSIGHTS** 섹션의 사이드 메뉴를 관리 화면에서 추가·수정·삭제한다.
새 메뉴는 **HTML 파일 1개를 첨부**하면 그 HTML이 메뉴 페이지로 표시된다(현재 Penta Design System과 같은 방식).

### 확정 사항 (2026-11-03)

| # | 결정 |
|---|---|
| 1 | 기존 메뉴(PPT·아이콘·WAPPLES 등)는 **숨김만** 허용한다. 삭제·slug 변경은 불가. |
| 2 | HTML 메뉴는 **로그인한 사용자만** 볼 수 있다. |
| 3 | **Penta Design System을 HTML 메뉴로 전환**하는 작업(P3)을 이번 범위에 포함한다. |

### 범위 밖

- TOOLBOX · LABs · ADMIN 섹션: 코드 하드코딩을 그대로 유지한다.
- 섹션 자체의 추가·수정·삭제: `CategoryType` enum을 그대로 유지한다.
- ZIP 업로드(이미지 등 별도 파일 포함): 자기완결형 단일 `.html`만 지원한다.

---

## 2. 현재 구조 요약

- 다섯 섹션의 메뉴는 DB `Category` 행이다. 사이드바는 `type`으로 묶고 `order`로 정렬한다([Sidebar.tsx](../components/category-pages/layout/Sidebar.tsx)).
- `/[slug]`([app/(dashboard)/[slug]/page.tsx](../app/(dashboard)/[slug]/page.tsx))는 `Category.pageType`으로 화면 컴포넌트를 고른다.
- 하드코딩 예외:
  - eDM·다이어그램 메뉴는 slug로 숨긴다.
  - TEMPLATE 순서는 `templateMenuSlugOrder` 배열로 고정한다.
  - WORK에는 Penta Design System 정적 링크를 끼워 넣는다.
- Penta Design System:
  - `public/penta-design-system/penta-design-system.html`을 `app/(dashboard)/penta-design-system/page.tsx`가 iframe으로 표시한다(sandbox 없음).
  - 전체 화면 레이아웃은 `MainLayout`의 경로 하드코딩(`isPentaDesignSystemPage`)으로 처리한다.
  - `public/` 경로라 **로그인 없이 파일 주소로 직접 접근할 수 있다.**
- 재사용할 기존 기능(INSIGHTS):
  - HTML 검증: `assertValidHtmlFile`([lib/insights-storage.ts](../lib/insights-storage.ts))
  - Storage 업로드: `uploadFile` / `downloadFile` / `deleteFileByUrl`([lib/b2.ts](../lib/b2.ts))
  - 로그인 전용 HTML 스트리밍 API: [app/api/insights/posts/[id]/view/route.ts](../app/api/insights/posts/[id]/view/route.ts)
  - sandbox iframe 뷰어: `InsightPostDetailPage`
- 카테고리 캐시: `getCategories` / `getCategoryBySlug`가 `unstable_cache`로 5분 캐시한다(tag `categories`). **지금은 무효화하는 코드가 없다.**

---

## 3. 설계

### 3.1 데이터

**스키마 변경은 컬럼 1개만 추가한다.**

```prisma
model Category {
  // ...
  isHidden Boolean @default(false) // 관리자 숨김 — 사이드바·검색·사이트맵 제외, 일반 사용자 404
}
```

HTML 메뉴는 기존 컬럼으로 표현한다.

| 컬럼 | 값 |
|---|---|
| `pageType` | `'html'` |
| `type` | WORK / SOURCE / TEMPLATE / BROCHURE / INSIGHTS 중 하나 |
| `config` | `{ html: { url, fileName, size, updatedAt } }` (zod로 검증) |
| `order` | 섹션 안 순서 |

`isBuiltin` 같은 플래그는 두지 않고, **`pageType === 'html'`이면 관리자 메뉴, 아니면 기존 메뉴**로 판별한다.

### 3.2 메뉴별 허용 작업

| 작업 | HTML 메뉴 | 기존 메뉴 |
|---|---|---|
| 이름 변경 | ⭕ | ⭕ |
| 순서 변경 (같은 섹션 안) | ⭕ | ⭕ |
| 다른 섹션으로 이동 | ⭕ | ❌ (`type`이 구독·기본 화면 판별에 쓰임) |
| HTML 교체 | ⭕ | — |
| 숨김 / 표시 | ⭕ | ⭕ |
| 삭제 | ⭕ (DB 행 + Storage 파일) | ❌ |
| slug 변경 | ❌ (삭제 후 다시 만들기) | ❌ |

### 3.3 숨김(`isHidden`) 동작

- 사이드바, 헤더 통합검색의 카테고리 필터, `sitemap.ts`에서 제외한다.
- `/[slug]`(및 `/[slug]/[id]`)는 **관리자만 접근**할 수 있고, 일반 사용자에게는 404를 반환한다. 관리자에게는 "숨김 상태" 안내 띠를 보여준다(HTML 메뉴 뷰어에만 표시하고, 기존 메뉴 화면은 레이아웃이 제각각이라 띠를 넣지 않는다).
- 숨긴 메뉴의 게시물은 통합검색 결과와 홈 최신 목록에서 제외한다(`category.isHidden = false` 조건).
- eDM·다이어그램 slug 하드코딩 필터는 P0 데이터 마이그레이션으로 `isHidden = true`를 설정해 대체한다. `/edm`은 정적 라우트, `/diagram`은 proxy 차단이라 기존 동작에는 영향이 없다.

### 3.4 HTML 저장·제공

- **업로드:** `menus/<slug>/<uuid>.html` 키로 Storage(posts 버킷)에 `text/html; charset=utf-8`로 저장한다. 크기 상한은 8MB이며(Next 16 proxy 요청 본문 기본 상한 10MB보다 여유 있게), 검증 규칙은 공용 모듈(`lib/html-document.ts`)로 추출해 INSIGHTS와 함께 쓴다.
- **교체:** 새 파일을 업로드한 뒤 DB를 갱신하고, 마지막에 기존 파일을 삭제한다. 기존 파일 삭제가 실패하면 로그만 남긴다.
- **제공 API:** `GET /api/menu-pages/[slug]/view`
  - `requireAuth()`로 로그인을 확인하고, 숨김 메뉴는 관리자만 접근하게 한다.
  - `pageType !== 'html'`이면 404를 반환한다.
  - 응답 헤더:
    - `Content-Type: text/html; charset=utf-8`
    - `Cache-Control: private, max-age=300`. iframe 주소에 `?v=<updatedAt>`를 붙여, HTML을 교체하면 즉시 새 파일을 받는다.
    - `Content-Security-Policy: sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox allow-downloads`. 파일 주소로 직접 열어도 격리되게 한다.
    - `X-Content-Type-Options: nosniff`
- Storage 주소는 브라우저에 노출하지 않는다. 클라이언트에 내려가는 카테고리 데이터에서 `config.html.url`을 제거한다.

### 3.5 페이지 표시

- `[slug]/page.tsx`에 `case 'html'`을 추가한다.
  - 서버에서 `auth()`로 로그인을 확인한다. 비로그인이면 `/login`으로 리다이렉트한다(로그인 후 돌아오는 기능은 현재 없음).
  - `HtmlMenuViewer`(신규)가 iframe으로 표시한다.
    - `sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-downloads"`
    - `allow="clipboard-write"`
    - `allow-same-origin`은 **주지 않는다.** 업로드한 스크립트가 사이트 쿠키와 API에 접근하지 못하게 하기 위해서다.
- `[slug]/[id]/page.tsx`는 html 메뉴면 404를 반환한다.
- **전체 화면 레이아웃:** `MainLayout`의 `isPentaDesignSystemPage` 경로 하드코딩을 "현재 첫 경로 세그먼트의 카테고리 `pageType === 'html'`"로 일반화한다. 기존 `isGalleryDetailPage`와 같은 패턴이다.

### 3.6 slug 규칙

- 정규식 `^[a-z0-9]+(-[a-z0-9]+)*$`, 최대 50자
- **예약어:** `app/(dashboard)`·`app` 최상위 고정 경로(`admin`, `api`, `toolbox`, `edm`, `diagram`, `pdf-extractor`, `chart-generator`, `profile`, `notice`, `login`, `register`, `error`, `penta-design-system`(P3에서 제거) 등)
  - `lib/menus/reserved-slugs.ts`에 목록을 두고, **vitest가 `app/(dashboard)` 디렉터리 목록과 대조**해 누락을 막는다(DB 비의존).
- 기존 slug와 중복되면 거부한다(`slug` unique 제약 + 사전 검사).

### 3.7 관리자 API (`requireAdmin`)

| 메서드 · 경로 | 내용 |
|---|---|
| `GET /api/admin/menus` | 다섯 섹션의 메뉴 전체(숨김 포함), 섹션별 `order` 순 |
| `POST /api/admin/menus` | multipart: `name`, `slug`, `type`, `file`. 업로드 → 생성(`order` = 섹션 최댓값 + 1). DB 실패 시 업로드한 파일 삭제 |
| `PATCH /api/admin/menus/[id]` | JSON: `name?`, `type?`(html만, 옮긴 섹션 맨 아래로), `isHidden?` |
| `PUT /api/admin/menus/[id]/html` | multipart `file` — HTML 교체(html만) |
| `PUT /api/admin/menus/order` | `{ type, ids[] }` → 트랜잭션으로 `order` 재부여 |
| `DELETE /api/admin/menus/[id]` | html만 허용(기존 메뉴는 400). DB 삭제 → Storage 파일 삭제 |

- 모든 변경 후 카테고리 캐시(tag `categories`)를 **즉시 무효화**한다.
  - Next 16 시그니처를 따른다. 라우트 핸들러에서는 `revalidateTag('categories', { expire: 0 })` 형태이며, 구현할 때 문서를 확인한다.
- 입력은 zod로 검증한다(`lib/menus/schemas.ts`).

### 3.8 관리자 화면 `/admin/menus`

- 사이드바 ADMIN 섹션에 **"메뉴 관리"** 링크를 추가한다.
- 섹션 탭(WORK~INSIGHTS) → 메뉴 목록(이름, slug, 형식, 표시 상태)
- **[메뉴 추가]** 다이얼로그: 섹션, 이름, slug, HTML 파일
- 행별 작업:
  - 위·아래 이동
  - 숨김 스위치
  - [수정]: 이름, 섹션(html), HTML 교체
  - [삭제]: html만, 확인 다이얼로그
  - [열기]: 새 탭으로 미리보기
- 기존 메뉴는 "기존" 배지를 달고 삭제·섹션 이동 버튼을 표시하지 않는다.

### 3.9 함께 정리할 곳

| 위치 | 변경 |
|---|---|
| `Sidebar.tsx` | `isHidden` 필터로 대체(eDM·다이어그램 하드코딩 제거), `templateMenuSlugOrder` 제거(DB `order` 사용), "메뉴 관리" 링크 추가 |
| `Header.tsx` 검색 카테고리 옵션 | html·숨김 메뉴 제외 |
| `app/sitemap.ts` | html(로그인 전용)·숨김 메뉴 제외 |
| `lib/categories.ts` `isSubscribableCategory` | `pageType === 'html'` 제외 |
| `prisma/seed.ts` | upsert `update`에서 **관리자가 편집하는 값(`name`, `order`, `isHidden`)을 덮어쓰지 않게** 변경 |

---

## 4. 단계 (Phase)

각 단계가 끝날 때마다 개발망(design6)에서 검증한다. 로컬에서는 typecheck·lint·vitest(DB 비의존)까지 확인한다.

### P0 — 스키마·데이터 정리

- `isHidden` 컬럼 추가 마이그레이션. SQL은 직접 작성한다(shadow DB에 실제 DB를 쓰지 않는다).
- 같은 마이그레이션 안에서 아래 데이터를 갱신한다.
  - `edm` / `diagram` → `isHidden = true`
  - TEMPLATE `order` 정렬: ppt 1, wallpaper 2, welcome-board 3, card 4, edm 5
- `seed.ts`가 `name`, `order`, `isHidden`을 덮어쓰지 않도록 변경
- Sidebar의 slug 숨김 하드코딩과 TEMPLATE 순서 하드코딩을 DB 값 기반으로 대체
- **개발망:** `prisma migrate deploy` → 사이드바가 **지금과 똑같이 보이는지** 확인

### P1 — HTML 메뉴 백엔드·뷰어

- 공용 HTML 검증 모듈 추출, `lib/menus/`(스키마, 예약어, storage)
- 관리자 API(§3.7), 제공 API(§3.4)
- `[slug]` html 분기, `HtmlMenuViewer`, `MainLayout` 전체 화면 일반화
- 숨김 처리(§3.3), Header·sitemap·구독 제외(§3.9)
- vitest: slug 검증, 예약어와 디렉터리 대조, config 스키마
- **로컬:** 신규 API 비로그인 401, 일반 사용자 403
- **개발망:** 기존 메뉴 회귀 없음, 숨김 메뉴 404 확인(DB에서 임시로 숨김 지정 후 원복)

### P2 — 관리자 메뉴 관리 화면

- `/admin/menus` 화면(§3.8), ADMIN 섹션 링크
- **개발망 검증 체크리스트:**
  - [ ] 섹션별 HTML 메뉴 추가 → 사이드바 즉시 표시 → 클릭 시 HTML 전체 화면 표시
  - [ ] 이름 변경·순서 이동·섹션 이동 즉시 반영
  - [ ] HTML 교체 후 새 내용 표시(캐시 무효화 확인)
  - [ ] 삭제 → 사이드바에서 사라지고 URL 404, Storage 파일 삭제 확인
  - [ ] 기존 메뉴 숨김·표시, 일반 사용자 404, 관리자 미리보기
  - [ ] 비로그인 `/[slug]` → 로그인 페이지, view API 직접 호출 → 401
  - [ ] iframe 격리: HTML 안 스크립트에서 `document.cookie` 접근 불가, 다운로드·외부 링크 동작
  - [ ] 예약어·중복 slug 거부
  - [ ] 모바일 사이드바(Sheet)에서도 동일하게 동작
- ⚠️ 개발망 보안 장비가 외부 URL이 들어간 업로드를 차단한다([SECURITY_url-filter_handoff.md](./SECURITY_url-filter_handoff.md), 전산팀 예외 대기). 테스트 HTML은 **외부 URL이 없는 파일**로 준비한다.

### P3 — Penta Design System 전환

- 삭제할 하드코딩:
  - `app/(dashboard)/penta-design-system/` 정적 라우트
  - Sidebar `renderStaticLink('penta-design-system', ...)` 삽입부
  - `MainLayout` `isPentaDesignSystemPage`
  - 예약어 목록의 `penta-design-system`
- `public/penta-design-system/`의 파일은 공개 경로에서 제거하고, 원본은 비공개 위치(`docs/assets/penta-design-system/`)에 보관한다.
  - `.md`와 `.json`은 HTML이 참조하지 않는다(JSON은 다운로드 파일명으로만 쓰임).
- **배포 직후** 관리자가 메뉴 관리에서 등록한다.
  - 섹션 WORK, 이름 `Penta Design System`, slug `penta-design-system`, HTML 첨부
  - 순서: Penta Design 다음, 디자인 의뢰 앞
  - 배포부터 등록까지 몇 분 동안은 메뉴가 보이지 않는다.
- 이 HTML에서 따로 확인할 것:
  - 클립보드 복사 2곳(`navigator.clipboard`)이 `allow="clipboard-write"` + sandbox 환경에서 동작하는지
  - 아이콘 라이브러리·스펙 파일 다운로드(`allow-downloads`)
  - CDN 폰트 로드
- ⚠️ 이 HTML에는 CDN 주소(`cdn.jsdelivr.net`)가 들어 있어 **개발망 업로드가 차단될 가능성이 높다.**
  - 전산팀 예외 전에는 CDN 링크를 뺀 사본으로 흐름만 검증하고, 원본 등록은 예외 처리 후에 한다.

---

## 5. 배포·운영 주의

- **migrate 순서:** P0부터 `isHidden`을 참조하므로 개발망·운영망 모두 **코드 배포 전(또는 함께) `prisma migrate deploy`** 가 필요하다. 하지 않으면 categories 쿼리가 전부 실패해 사이드바 전체가 깨진다.
- **메뉴 데이터는 환경별로 따로 있다.** 개발망에서 만든 HTML 메뉴는 운영망으로 넘어가지 않는다. 운영망 반영 후 관리자가 다시 등록한다(Penta Design System 포함).
- **운영망 반영 시점:** P0~P3를 묶어 한 번에 반영하는 것을 권장한다(P3 등록 공백을 한 번으로). TOOLBOX 운영 반영 일정과 맞출지는 그때 정한다.
- **작업 브랜치:** 로컬 `upgrade/next16-react19`는 `origin/2026-06-17-tiper`보다 3커밋 뒤에 있다. `origin/2026-06-17-tiper`에서 새 로컬 브랜치(예: `feature/menu-admin`)를 만들어 시작하고, 푸시는 `git push origin HEAD:2026-06-17-tiper`로 한다.
- 리빌드 후 `docker restart design5-nginx`

## 6. 예상 변경 파일

| 구분 | 파일 |
|---|---|
| 스키마 | `prisma/schema.prisma`, `prisma/migrations/<ts>_add_category_is_hidden/migration.sql`, `prisma/seed.ts` |
| 공용 | `lib/html-document.ts`(HTML 검증 추출), `lib/insights-storage.ts`(공용 모듈 사용), `lib/menus/{schemas,reserved-slugs,storage}.ts`, `lib/categories.ts` |
| API | `app/api/admin/menus/route.ts`, `app/api/admin/menus/[id]/route.ts`, `app/api/admin/menus/[id]/html/route.ts`, `app/api/admin/menus/order/route.ts`, `app/api/menu-pages/[slug]/view/route.ts` |
| 화면 | `app/(dashboard)/[slug]/page.tsx`, `app/(dashboard)/[slug]/[id]/page.tsx`, `components/category-pages/html-menu/HtmlMenuViewer.tsx`, `app/(dashboard)/admin/menus/{layout,page}.tsx`, `components/admin/menus/*` |
| 레이아웃 | `components/category-pages/layout/{Sidebar,MainLayout,Header}.tsx`, `app/sitemap.ts`, `app/api/search/route.ts`, `lib/homepage.ts` |
| P3 삭제 | `app/(dashboard)/penta-design-system/page.tsx`, `public/penta-design-system/*` → `docs/assets/penta-design-system/` |
| 테스트 | `lib/menus/*.test.ts` |
