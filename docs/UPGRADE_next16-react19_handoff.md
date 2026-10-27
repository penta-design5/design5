# Next.js 16 · React 19 업그레이드 Handoff

> 보안 점검 권고(2026-10)에 따른 프레임워크 업그레이드. 새 세션은 이 문서의 「다음 시작점」부터 이어간다.

- 배경: Next.js 14는 2025-10-26 지원 종료, 15는 2026-10 종료 예정 → **16으로 바로 올린다**(14→15 변경도 함께 처리). React 18 → 19. Node 20도 2026-04 지원 종료라 함께 올린다
- 작업 브랜치: 로컬 `upgrade/next16-react19` → 푸시는 규칙대로 `origin/2026-06-17-tiper`(개발망 검증). **운영망은 TOOLBOX 일괄 반영 규칙 그대로 — 업그레이드 → TOOLBOX 전체 QA → 운영망 반영 순서**
- 최초 작성: 2026-10-21
- **현재 상태: 🟡 U0·U1 로컬 완료(커밋) — 개발망 확인 대기**
- **다음 시작점**: 푸시 → 개발망 리빌드 → U0·U1 개발망 확인(§4 U1 체크리스트) → U2

범례: ⬜ 대기 · 🟡 진행중 · ✅ 완료 · ⛔ 블록

---

## 1. 버전

| 항목 | 이전 | 목표 |
| --- | --- | --- |
| Next.js | 14.2.35 | 16.4.x |
| React · React DOM | 18.3.1 | 19.x |
| Node.js(Docker) | `node:20-alpine` | `node:22-alpine`(LTS, 2027-04까지). Prisma 5.22 `engines >=16.13` |
| react-konva | 18.2.10 | 19.x (konva 9 유지 — peer `^9 \|\| ^10`) |
| next-auth | 5.0.0-beta.30 | 5.0.0-beta.32 (peer: next 14~16, react 18~19) |
| eslint · eslint-config-next | 8 · 14 (`.eslintrc.json`, `next lint`) | 9 · 16 (flat config, ESLint CLI) |
| @types/react · @types/react-dom | 18 | 19 |

React 19 지원이 이미 peer 범위에 있는 것(그대로): Radix UI, tiptap 3, react-hook-form, recharts 2.15, sonner, next-themes, lucide-react, react-day-picker 9, react-pdf 10, react-colorful, react-flip-toolkit, react-masonry-css, @testing-library/react 16. React와 무관: Prisma 5, sharp, onnxruntime-web, jszip, docx-preview 등

## 2. 코드 영향 (사전 조사 2026-10-21)

| # | 변경 | 영향 | 대응 |
| --- | --- | --- | --- |
| ① | Next 16 `next build` = Turbopack 기본, **커스텀 webpack 설정이 있으면 빌드 실패** | `next.config.js` webpack(onnxruntime-web 경로·`new URL` 처리 끔, 서버 konva·canvas 제외) | U1: `next build --webpack`으로 유지. Turbopack 전환은 U4(선택, Worker·ORT PoC) |
| ② | 비동기 Request API(동기 접근 제거) | `params`를 동기로 쓰는 파일 20개(대부분 API 라우트), `searchParams` 페이지 2개(login·error) | U1: codemod `next-async-request-api` + 수동 확인 |
| ③ | `next lint` 제거, eslint-config-next 16은 ESLint 9 flat config | `npm run lint` = `next lint` → preflight 깨짐 | U1: ESLint CLI + `eslint.config.mjs`, CLAUDE.md·`/preflight`·`/ship` 확인 |
| ④ | `next/image` 사설 IP 최적화 기본 차단, `minimumCacheTTL` 60초→4시간, `qualities` 기본 `[75]` | MinIO·사내 도메인(192.168.x) 이미지 — `next/image` 20개 파일(일부 `unoptimized`) | U2: `dangerouslyAllowLocalIP` 필요 여부 확인 + `remotePatterns`(`**`) 실제 도메인으로 좁히기 검토 |
| ⑤ | React 19 타입 | 인자 없는 `useRef<T>()` 8개 파일 등 | U1: typecheck로 수정 |
| ⑥ | `middleware` → `proxy` 이름 변경(옛 이름은 경고만) | `middleware.ts`(Node 런타임, `auth()`) | U1: codemod로 이름 변경 |
| ⑦ | Node 20 지원 종료 | `deploy/rocky/Dockerfile` | U0 |

영향 없음(사용처 0건): `defaultProps`·`propTypes`·`ReactDOM.render`·`useFormState`·AMP·`next/legacy/image`·`serverRuntimeConfig`·`revalidateTag`·병렬 라우트·`request.ip/geo`. `forwardRef`(27곳, shadcn)는 React 19에서도 동작

덤: Next 16은 `next dev` 출력이 `.next/dev`로 분리돼 dev 서버와 build가 서로 덮어쓰지 않는다

## 3. 단계

| 단계 | 내용 | 상태 |
| --- | --- | --- |
| U0 | Docker Node 22, handoff 문서 | 🟡 로컬 완료·개발망 확인 대기 |
| U1 | Next 16 + React 19 + react-konva 19 + next-auth beta.32, codemod(비동기 API·lint·proxy), `build --webpack`, ESLint 9 flat config, 타입 수정 | 🟡 로컬 완료·개발망 확인 대기 |
| U2 | `next/image` 설정(사설 IP·도메인 제한) + 이미지 화면 점검 | ⬜ |
| U3 | 전체 회귀(개발망): 로그인·관리자·API, 카테고리 페이지·업로드, TOOLBOX 8개 메뉴(Worker·onnxruntime·COOP/COEP), konva 화면, tiptap 에디터 | ⬜ |
| U4 (선택) | Turbopack 빌드 전환 PoC | ⬜ |

---

## 4. 진행 기록

### U0 — Docker Node 22 (🟡 2026-10-21)

- `deploy/rocky/Dockerfile`: `node:20-alpine` → `node:22-alpine`(빌드·런타임 공통 base). Next 14 그대로 Node만 바꿔 먼저 확인한다(문제 생기면 원인 분리)
- [ ] 개발망: 리빌드(`--no-deps app`) + `docker restart design5-nginx` → 기동, 로그인·목록·이미지·TOOLBOX 한두 메뉴 스모크, `docker exec design5-app node -v` = v22.x

### U1 — Next 16 · React 19 (🟡 2026-10-21 로컬 완료)

**패키지**: next 16.4.2 · react/react-dom 19.3.1 · react-konva 19.3.2 · next-auth 5.0.0-beta.32 · eslint 9.39.5 · eslint-config-next 16.4.2 · @types/react·react-dom 19.3.0 (peer 충돌 없음)

**코드 변경**
- 비동기 `params`: codemod `next-async-request-api`(페이지·`generateMetadata` 9개 파일) + **API 라우트 11개 파일·25개 핸들러 수동 변환** — `context: { params: Promise<{…}> }` + 첫 줄 `const params = await context.params`(본문은 그대로). `withRouteHandler`는 제네릭이라 수정 없음. `npx next typegen`이 만든 `.next/types/validator.ts`로 누락 없이 확인
- `middleware.ts` → `proxy.ts`(codemod, 함수 이름 `proxy`). Node 런타임이라 동작 같음. 빌드 출력 `ƒ Proxy (Middleware)`
- React 19 타입: 인자 없는 `useRef<T>()` 9곳 → `useRef<T | undefined>(undefined)`, ref를 받는 props 4곳 `RefObject<T>` → `RefObject<T | null>`(차트 생성기 2·특수 문자 패널·파일명 툴바)
- ESLint: `.eslintrc.json` 삭제 → `eslint.config.mjs`(flat config), `npm run lint` = `eslint .`. **검사 범위를 `next lint`와 맞춤**(`public/`(pdf.js 등)·`.next`·`scripts`·`prisma`·`deploy`·`docs`·CJS 설정 파일 제외 — 안 하면 3,050건). eslint-plugin-react-hooks 7의 **새 React Compiler 규칙**(`set-state-in-effect` 138건·`refs` 129건 등)은 기존 코드 패턴이라 **경고로 낮춤**(정리는 별도 과제)
- `package.json`: `dev`·`build`에 `--webpack`(커스텀 webpack 설정 유지 — Turbopack은 U4)
- `next.config.js` `images`: Next 16 기본값 변경을 이전 동작으로 유지 — `dangerouslyAllowLocalIP: true`(사설 IP 차단 시 MinIO·사내 도메인 이미지 400), `minimumCacheTTL: 60`. **U2에서 재검토**
- `tsconfig.json`: Next가 자동 수정(`jsx: react-jsx`, `.next/dev/types` 포함)

**검증(로컬)**
- [x] typecheck 0 · `npm run lint` 종료 0(에러 0, 경고 464 — 대부분 새 react-hooks 규칙)
- [x] vitest 707건 중 692 통과 — 실패 15건은 **기존 문제**(`preset-storage`·`card-schemas` localStorage, 모자이크 handoff에 기록된 15건과 같음)
- [x] `next build --webpack` **종료 0** — 컴파일 17초, TypeScript, 정적 페이지 45/45까지 완료(이전 Next 14는 로컬 DB 부재로 prerender 실패했음)
- [x] 빌드 결과 서버 스모크(`next start`, 로컬 3100): `/login`·`/toolbox/text-extractor`·`/toolbox/image-editor` 200, `/admin` 비로그인 → `/` 리다이렉트(proxy 동작), `/api/auth/session` 200, OCR 페이지 COOP·COEP 헤더, `/_next/static` COEP, `/tool-models/ocr/*`·`/licenses/*` 200

**개발망 이슈 — Google 로그인 콜백 `ERR_CONNECTION_RESET` (2026-10-21, ⛔ 보안 장비 예외 요청 대기)**
- 증상: 로그아웃 후 Google 계정 선택 → `/api/auth/callback/google?iss=https://accounts.google.com&code=…` 요청이 연결 재설정(브라우저가 같은 URL로 자동 재시도)
- 원인 확정: **nginx 앞단 보안 장비가 매개변수에 외부 URL이 든 요청을 차단** — `?code=test`는 nginx·앱 도달(302, 앱은 `iss` 누락으로 정상 거부), `?iss=https://accounts.google.com&code=test`는 RESET·**nginx 로그 없음**. 업그레이드와 무관(앱 코드·인증 설정 변경 없음, next-auth beta.30→32 · @auth/core 0.41.1→0.41.3). `iss`는 OAuth 표준(RFC 9207)이라 앱에서 우회 불가
- 같은 장비가 `Cache-Control: no-cache` 요청 헤더도 400 거부(OCR 모델 내려받기, 같은 날) — 10-15 이후 앞단 정책 변경으로 추정
- 조치: 보안 담당에 `design6`·`design5`의 `/api/auth/callback/google` 예외(매개변수 내 URL 탐지 규칙) 요청. **운영망 확인 완료**: design5(Next 14)는 Google 로그인·로그아웃 정상, 같은 B 요청(`iss=https://…`)도 앱까지 도달(설정 오류 페이지) → **개발망 앞단에만 있는 정책으로 확정**, 운영망은 예외 요청 대상 아님(외부 공개 시 같은 정책이 붙으면 함께 반영 요청)
- 참고: 배포 직후 앱 로그 `The router state header was sent but could not be parsed`는 배포 전부터 열려 있던 탭(Next 14 클라이언트)의 요청 — 새로고침하면 사라짐, 조치 불필요

**개발망 이슈 — Penta Design 유튜브·CI/BI SVG 등록 시 `Failed to fetch` (2026-10-27, ⛔ 업그레이드와 무관)**
- 원인: Google 콜백과 같은 앞단 보안 장비가 요청 쿼리·본문(업로드 파일 포함)의 **외부 URL**을 탐지해 연결을 끊음. 전 메뉴 업로드·입력란이 영향 → 조사·조치·보안 담당 요청안은 [SECURITY_url-filter_handoff.md](SECURITY_url-filter_handoff.md)
- U3 회귀에서 이 증상(유튜브·SVG·HTML 업로드, 외부 링크 입력)은 업그레이드 실패로 보지 않는다

**개발망 이슈 — 대화상자 안 달력(제작일)에서 날짜를 누르면 팝업이 닫히고 선택 안 됨 (2026-10-27, ✅ 로컬 수정)**
- 원인: U1 재설치 때 lockfile에서 `@radix-ui/react-dialog`만 1.1.15 → **1.3.1**로 올라가(package.json `^1.1.15` 범위 안) 내부 `react-dismissable-layer`(1.2.1)·`react-focus-scope`(1.3.1)를 따로 가짐. Popover·Select·DropdownMenu·Tooltip은 1.1.11·1.1.7 → 두 벌이 서로의 레이어를 몰라, Dialog의 포커스 가두기가 Popover로 간 포커스를 되돌리고 Popover는 바깥 포커스로 보고 닫힘
- 영향: Dialog·Sheet 안의 Popover·Select·드롭다운 전체(업로드 대화상자 제작일·달력 연/월 Select, xl 미만 TOOLBOX 「편집 옵션」 Sheet의 Select 등)
- 조치: `package.json` `"@radix-ui/react-dialog": "1.1.15"` **정확히 고정**(`~1.1.15`는 1.1.23으로 풀려 여전히 두 벌) → `npm ls`로 dismissable-layer·focus-scope 한 벌 확인. 1.1.15 peer `react ^19.0` 지원, lockfile 변경은 `@radix-ui/*`만(next·react 등 그대로)
- 검증(로컬): jsdom 임시 테스트(Dialog 안 DatePicker 날짜 클릭) — 1.3.1 실패(달력이 열리자마자 닫힘) / 1.1.15 통과, typecheck·lint 통과
- 후속: Radix 패키지 일괄 최신화는 버전을 함께 맞춰 올릴 때만(한 패키지만 올리면 같은 문제 재발)

**개발망 확인(U0·U1 함께)** — 리빌드 후
- [ ] 기동·`node -v` v22, 콘솔 에러 없음
- [ ] 로그인·로그아웃·세션 유지(next-auth beta.32), 비로그인 `/admin` 차단, 관리자 화면
- [ ] 카테고리 목록·상세(동적 `params`), 게시물 등록·수정·삭제, 첨부 다운로드, 공지·인사이트·디자인 요청·사용자 권한 API
- [ ] 이미지(목록 썸네일·상세·아바타·아이콘) 정상 — `next/image` 최적화 경로
- [ ] 대화상자·Sheet 안 Popover·Select(게시물 추가 「제작일」 달력 날짜·연/월 선택, xl 미만 TOOLBOX 「편집 옵션」 Select) — react-dialog 1.1.15 고정 후
- [ ] konva 화면(이미지 편집·다이어그램·카드)·tiptap 에디터·차트 생성기
- [ ] TOOLBOX: 배경 편집(onnxruntime CDN wasm)·모자이크 얼굴/번호판·OCR(이미지·PDF, 4스레드)·특수 문자·파일명 일괄 변경

---

## 5. 개발망 반영 메모

- 서버: `git pull` → `docker compose -f docker-compose.yml -f docker-compose.app.yml build app` → `up -d --no-deps app` → `docker restart design5-nginx`
- DB 스키마 변경 없음(`migrate deploy` 불필요). Prisma 5 유지
- base 이미지가 바뀌므로 첫 빌드는 `node:22-alpine` 내려받기로 오래 걸릴 수 있다

## 6. 변경 파일

- U0: `docs/UPGRADE_next16-react19_handoff.md`(신규), `deploy/rocky/Dockerfile`
- U1 후속(react-dialog 고정): `package.json`·`package-lock.json`
- U1: `package.json`·`package-lock.json`, `next.config.js`, `tsconfig.json`, `eslint.config.mjs`(신규)·`.eslintrc.json`(삭제), `proxy.ts`(신규, `middleware.ts` 이름 변경), 페이지 4개(`app/(dashboard)/[slug]/page.tsx`·`[slug]/[id]/page.tsx`·`diagram/[id]/page.tsx`·`edm/[id]/page.tsx`), API 라우트 16개(`app/api/**/[…]/route.ts`), React 19 타입 13개 파일(`app/_category-pages/*ListPage.tsx` 6·`PostGrid.tsx`·`use-masonry-layout.ts`·`chart-generator/*` 2·`special-characters/*` 2·`RenameToolbar.tsx`)
