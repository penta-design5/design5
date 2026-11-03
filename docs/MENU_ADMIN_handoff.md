# 사이드 메뉴 관리(HTML 메뉴) Handoff (진행 상태)

> 스펙 문서: [MENU*ADMIN*구현계획.md](./MENU_ADMIN_구현계획.md)
> **진행 상태의 단일 원본은 이 문서다.** 계획서는 스펙으로 고정하고, 단계를 진행·완료할 때 이 문서만 갱신한다.

- 대상: WORK · SOURCE · TEMPLATE · BROCHURE · INSIGHTS 섹션의 메뉴를 관리자가 추가·수정·삭제한다. 새 메뉴는 HTML 1개를 첨부하면 그 HTML이 페이지로 표시된다.
- 핵심 결정 (2026-11-03): ① 기존 메뉴는 숨김만 허용 ② HTML 메뉴는 로그인 사용자 전용 ③ Penta Design System 전환(P3) 포함
- 최종 업데이트: **2026-11-03** (P0·P1·P2 로컬 커밋, 미푸시 · P2 로컬 브라우저 확인 완료 · P3 진행)
- 작업 브랜치: 로컬 `feature/menu-admin`(`origin/2026-06-17-tiper` 기준) → 푸시 `git push origin HEAD:2026-06-17-tiper`
- 검증 방식: 개발망 로그인 문제(보안 이슈)로 **로컬 dev 서버 + 개발망 터널(DB·Storage)** 에서 먼저 확인한다. 개발망 배포 확인은 로그인이 해결된 뒤에 한다.
- **다음 세션 시작점:** **P3**(Penta Design System 전환)

범례: ⬜ 대기 · 🟡 진행중 · ✅ 완료 · ⛔ 블록

---

## 진행 현황 요약

| Phase | 내용                                                                                                                 | 상태              | 커밋               | 검증                                                                                                                              |
| ----- | -------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| P0    | `isHidden` 마이그레이션 + eDM·다이어그램 숨김·TEMPLATE 순서 데이터 정리 + seed 덮어쓰기 방지 + Sidebar 하드코딩 대체 | 🟡 로컬 확인 완료 | `21cab39` (미푸시) | **개발 DB `migrate deploy` 적용 완료(2026-11-03)** · DB 값 확인 ✅ · 로컬 dev 서버 사이드바 기존과 동일 ✅. 개발망 배포 확인 대기 |
| P1    | HTML 메뉴 백엔드·뷰어 (관리자 API, view API, `[slug]` html 분기, 숨김 처리, 검색·홈·사이트맵·구독 제외)              | 🟡 로컬 구현 완료 | `09f3551` (미푸시) | 아래 "P1 로컬 검증" 참고                                                                                                          |
| P2    | 관리자 "메뉴 관리" 화면 `/admin/menus`                                                                               | 🟡 로컬 확인 완료 | (아래 커밋)        | typecheck·lint 0 ✅ · 비로그인 `/admin/menus` → 홈 리다이렉트 ✅ · **로컬 브라우저 체크리스트 전 항목 통과(2026-11-03, iframe 격리 콘솔 확인 포함)**. 개발망 배포 확인 대기 |
| P3    | Penta Design System을 HTML 메뉴로 전환                                                                               | ⬜                |                    | 등록 후 표시·클립보드·다운로드·폰트                                                                                               |

공통 로컬 검증: typecheck 0 ✅ · lint 0 errors(변경 파일의 경고 3건은 기존 코드) ✅ · vitest 743 통과 / 15 실패 — 실패는 **기존 실패**(localStorage 프리셋 테스트 2파일, 변경 전과 동일). 신규 메뉴 테스트 39건 통과 ✅

## P0 — 변경 내용

- `prisma/schema.prisma`: `Category.isHidden Boolean @default(false)`
- `prisma/migrations/20261103120000_add_category_is_hidden/migration.sql`
    - 컬럼 추가(데이터 보존)
    - `edm`·`diagram` → `isHidden = true`
    - TEMPLATE `order`: ppt 1 · wallpaper 2 · welcome-board 3 · card 4 · edm 5
- `prisma/seed.ts`
    - upsert `update`에서 `name`·`order`를 덮어쓰지 않게 변경(관리자 편집값 보존)
    - `edm`·`diagram`은 생성 시 `isHidden: true`. 빈 DB에서 reset + seed를 해도 숨김이 유지된다.
- `components/category-pages/layout/Sidebar.tsx`
    - slug 하드코딩 숨김 → `isHidden` 필터(하위 메뉴 포함)
    - `templateMenuSlugOrder` 제거 → DB `order` 사용

## P1 — 변경 내용

| 구분     | 파일                                                                                     | 내용                                                                                                                              |
| -------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 공용     | `lib/html-document.ts` (신규)                                                            | HTML 검증(`getHtmlFileError`)·확장자·content-type. INSIGHTS와 공용                                                                |
| 공용     | `lib/insights-schemas.ts`, `lib/insights-storage.ts`                                     | 위 공용 모듈 사용(동작·메시지 동일)                                                                                               |
| 메뉴     | `lib/menus/schemas.ts` (신규)                                                            | 섹션 5종, slug·이름 규칙, 생성·수정·순서 스키마, `config.html` 스키마, `AdminMenu` 타입                                           |
| 메뉴     | `lib/menus/reserved-slugs.ts` (신규)                                                     | 예약 주소(app 고정 라우트 + public 최상위 폴더)                                                                                   |
| 메뉴     | `lib/menus/server.ts` (신규)                                                             | Storage 업로드(`menus/<slug>/<uuid>.html`)·삭제, 관리자 응답 변환                                                                 |
| 메뉴     | `lib/categories.ts`                                                                      | `invalidateCategoriesCache()`(Next 16 `revalidateTag(tag, { expire: 0 })`), `stripHtmlMenuConfig()`, 구독 대상에서 HTML 메뉴 제외 |
| API      | `app/api/admin/menus/route.ts` (신규)                                                    | GET 목록 · POST HTML 메뉴 생성(multipart)                                                                                         |
| API      | `app/api/admin/menus/[id]/route.ts` (신규)                                               | PATCH 이름·숨김·섹션 이동(html만) · DELETE(html만)                                                                                |
| API      | `app/api/admin/menus/[id]/html/route.ts` (신규)                                          | PUT HTML 교체                                                                                                                     |
| API      | `app/api/admin/menus/order/route.ts` (신규)                                              | PUT 섹션 안 순서 변경                                                                                                             |
| API      | `app/api/menu-pages/[slug]/view/route.ts` (신규)                                         | 로그인 전용 HTML 제공, CSP sandbox·nosniff 헤더                                                                                   |
| 화면     | `components/category-pages/html-menu/HtmlMenuViewer.tsx` (신규)                          | sandbox iframe(`allow-same-origin` 없음), 숨김 안내 띠                                                                            |
| 화면     | `app/(dashboard)/[slug]/page.tsx`                                                        | html 분기(비로그인 → `/login`), 숨김 메뉴 → 비관리자 404                                                                          |
| 화면     | `app/(dashboard)/[slug]/[id]/page.tsx`                                                   | 숨김 메뉴 → 비관리자 404, html 메뉴 상세 → 404                                                                                    |
| 레이아웃 | `app/(dashboard)/layout.tsx`                                                             | 클라이언트로 넘기기 전에 HTML 메뉴의 config(Storage 주소)를 제거                                                                  |
| 레이아웃 | `components/category-pages/layout/MainLayout.tsx`                                        | HTML 메뉴 페이지 본문 풀-블리드(`isHtmlMenuPage`)                                                                                 |
| 레이아웃 | `components/category-pages/layout/Header.tsx`                                            | 검색 카테고리 옵션에서 숨김·HTML 메뉴 제외                                                                                        |
| 기타     | `app/api/search/route.ts`                                                                | 숨김 메뉴의 게시물·항목 검색 제외                                                                                                 |
| 기타     | `lib/homepage.ts`                                                                        | 홈 최근 게시물에서 숨김 메뉴 제외, 캐시 tag에 `categories` 추가                                                                   |
| 기타     | `app/sitemap.ts`                                                                         | 숨김·HTML 메뉴 제외                                                                                                               |
| 테스트   | `lib/__tests__/menu-schemas.test.ts`, `lib/__tests__/menu-reserved-slugs.test.ts` (신규) | 스키마·HTML 검증 / 예약 주소를 실제 디렉터리와 대조                                                                               |

**계획서와 달라진 점** (계획서에 반영함)

- PATCH는 JSON으로 받고, HTML 교체는 별도 `PUT /api/admin/menus/[id]/html`로 분리했다.
- 숨김 안내 띠는 HTML 메뉴 뷰어에만 표시한다.

**기존 동작이 바뀌는 점** (숨김 처리의 결과)

- 통합검색에서 **다이어그램(본인 생성물)이 더 이상 검색되지 않는다.** 다이어그램은 비공개 기능이라 숨김으로 지정됐다.
- 사이트맵에서 `/edm`·`/diagram`이 빠진다. 둘 다 숨김 카테고리다(`/edm` 페이지 자체는 LABs 링크로 그대로 동작).

## P1 로컬 검증 (2026-11-03, 로컬 dev + 개발망 터널)

- [x] 비로그인 상태에서 신규 API 7개(관리자 API 6 + view API) 모두 **401**
- [x] 사이드바 렌더 회귀 없음
- [x] 스크립트로 테스트 HTML 메뉴 2개(표시·숨김)를 만들어 확인한 뒤 삭제 — Storage 업로드·다시 읽기·삭제 정상
    - 비로그인으로 HTML 메뉴 접속 → `/login` 리다이렉트
    - 숨김 메뉴 → 404
    - HTML 메뉴 상세 주소(`/<slug>/<id>`) → 404
    - 기존 `/ppt` 정상
    - 참고: `[slug]`에 `loading.tsx`가 있어 응답을 스트리밍하므로 상태 코드는 200이고, 리다이렉트·404는 본문에 담겨 온다(Next 정상 동작).
- [x] **로그인 상태 확인(P2 화면으로 진행)**:
    - HTML이 iframe으로 전체 화면 표시
    - 관리자 숨김 메뉴 미리보기와 안내 띠
    - 추가·수정·교체·삭제·순서 변경 즉시 반영(캐시 무효화)
    - iframe 격리(`document.cookie` 접근 불가)
    - 검색·홈에서 숨김 제외

> 개발망의 비밀번호 로그인은 꺼져 있다(`AppSettings.showCredentialsLogin = false`). 로그인 상태 확인은 사용자가 브라우저로 로컬에서 진행한다.

## P2 — 변경 내용

- `app/(dashboard)/admin/menus/{layout,page}.tsx` (신규)
    - 섹션 탭(WORK~INSIGHTS, 개수 표시)과 메뉴 표: 순서(위·아래 이동), 이름 + HTML/기존·숨김 배지, 주소, HTML 파일 정보, 표시 스위치, 작업(새 탭 열기·수정·삭제)
    - 삭제 버튼은 HTML 메뉴만 표시하고, 확인 다이얼로그를 거친다.
    - 변경 후 목록을 다시 불러오고 `router.refresh()`로 사이드바를 갱신한다.
- `components/admin/menus/MenuFormDialog.tsx` (신규)
    - 추가: 섹션·이름·slug·HTML 파일
    - 수정: 이름(전체), 섹션·HTML 교체(HTML 메뉴만). slug는 수정 불가
    - 클라이언트에서도 같은 zod 스키마와 HTML 검증을 먼저 수행한다.
- `components/category-pages/layout/Sidebar.tsx`: ADMIN 섹션에 "메뉴 관리" 링크(공지사항 관리 아래)
- `lib/menus/schemas.ts`: HTML 상한 **10MB → 8MB**
    - Next 16 proxy 요청 본문 기본 상한(`proxyClientMaxBodySize` 10MB)에 multipart 부가 정보가 더해지면 요청이 잘릴 수 있어 여유를 뒀다.

### P2 1차 브라우저 확인 결과와 수정 (2026-11-03)

| # | 증상 | 원인 | 수정 |
| --- | --- | --- | --- |
| 1·2 | 추가·순서 변경이 사이드바에 즉시 반영되지 않고 새로고침해야 맞음(사이드바가 "한 단계 전" 상태) | Next 16 Route Handler의 `revalidateTag`는 **응답 후(waitUntil)** 에 처리된다. 응답 직후의 `router.refresh()`가 옛 캐시를 받는 타이밍 경쟁. 숨김이 반영된 것은 우연 | `app/(dashboard)/admin/menus/actions.ts`(신규) Server Action `refreshMenuCache()` → `updateTag('categories')`. Server Action은 렌더 **전에** 만료를 끝내고 다시 그린 레이아웃을 응답에 담는다. 관리 화면은 변경 후 `router.refresh()` 대신 이 액션을 호출한다(실패 시 `router.refresh()`로 대체). API의 `revalidateTag`는 그대로 둔다 |
| 3 | HTML 메뉴 페이지에서 헤더가 오른쪽까지 이어지지 않음 | slug `cloudbric-waf`가 MainLayout의 `pathname.startsWith('/cloudbric')`에 걸려 **Cloudbric(우측 패널) 레이아웃으로 오인**됨. `icon-*`, `ppt-*`, `card-*` 같은 slug도 같은 문제 | MainLayout의 경로 판별을 `isUnderPath()`(`/base` 또는 `/base/...`만 일치)로 교체. 기존 페이지 레이아웃은 동일함을 확인(Cloudbric·PPT·아이콘 우측 패널 유지, HW·카드·Penta Design System 풀-블리드 유지) |

## P2 로컬 확인 체크리스트 (로컬 dev + 개발망 터널, 관리자 로그인)

테스트 HTML은 **외부 URL이 없는 파일**로 준비한다. 확인이 끝나면 테스트 메뉴를 삭제한다.

- [x] ADMIN 섹션에 "메뉴 관리"가 보이고, 섹션 탭별로 기존 메뉴가 사이드바와 같은 순서로 나온다.
- [x] HTML 메뉴 추가 → 사이드바에 즉시 표시 → 클릭하면 HTML이 전체 화면 iframe으로 표시된다.
- [x] 이름 변경, 위·아래 이동, 다른 섹션으로 이동이 사이드바에 즉시 반영된다.
- [x] HTML 교체 후 새 내용이 표시된다(캐시 무효화).
- [x] 숨김 → 사이드바에서 사라진다. 관리자는 주소로 열면 "숨김 상태" 띠와 함께 보이고, 일반 사용자는 404
- [x] 기존 메뉴(예: PPT) 숨김 → 사이드바·통합검색 카테고리에서 사라진다. 다시 표시하면 원래 위치로 돌아온다.
- [x] 기존 메뉴에는 삭제 버튼이 없고, 수정 다이얼로그에서 섹션·HTML 항목이 비활성이다.
- [x] 삭제 → 사이드바에서 사라지고 주소는 404
- [x] 잘못된 입력 거부: 예약 주소(`admin`, `toolbox` 등), 중복 주소, 대문자·한글 주소, .html이 아닌 파일, 8MB 초과
- [x] iframe 격리: 개발자도구 콘솔에서 iframe 컨텍스트로 `document.cookie` 접근 시 오류(SecurityError)
- [x] 모바일 폭에서 사이드바(Sheet)와 관리 화면 표가 깨지지 않는다.

## 개발망 배포 절차 (⚠️ 순서 중요)

1. 커밋 → `git push origin HEAD:2026-06-17-tiper`
2. `npx prisma migrate status`(노트북 + 개발망 터널) — P0 마이그레이션은 **2026-11-03에 적용 완료**. 새 마이그레이션이 생기면 리빌드보다 먼저 `migrate deploy`
3. 서버: `git pull` → app만 `--no-deps`로 리빌드 → `docker restart design5-nginx`

**P0 확인 체크리스트 (개발망)**

- [ ] 사이드바가 기존과 동일하다: WORK·SOURCE·TEMPLATE·BROCHURE·INSIGHTS의 메뉴 구성과 순서
- [ ] TEMPLATE 순서: PPT → 바탕화면 → 웰컴보드 → 감사/연말 카드
- [ ] SOURCE에 다이어그램이 보이지 않는다. TEMPLATE에 eDM이 보이지 않는다(LABs의 eDM 링크는 그대로).
- [ ] LABs eDM 가이드 영상 정상(`/api/categories/edm/guide-video` — 숨김과 무관)
- [ ] 모바일 사이드바(Sheet)도 동일

> 참고: 개발 DB에 seed에 없는 TEMPLATE 메뉴가 있다면, 이전에는 하드코딩 정렬 때문에 맨 아래에 붙었지만 이제는 DB `order` 값 위치에 표시된다. (2026-11-03 개발 DB 확인 결과 해당 없음)

## 잔여 리스크 / 블록

- ⛔(P3 원본 등록) 개발망 보안 장비가 외부 URL이 들어간 업로드를 차단한다. Penta Design System HTML에 CDN 주소가 있다 → [SECURITY_url-filter_handoff.md](./SECURITY_url-filter_handoff.md)의 전산팀 예외 처리를 기다린다. 로컬 + 터널 업로드는 웹 앞단을 거치지 않으므로 우회될 가능성이 있다(P3에서 확인).
- 운영망 반영 시 `prisma migrate deploy`가 필수이고, HTML 메뉴(Penta Design System 포함)를 다시 등록해야 한다.
- 개발망은 P0 마이그레이션이 적용된 상태에서 **이전 코드**로 돌아가고 있다. 컬럼을 추가만 했으므로 문제는 없다.
