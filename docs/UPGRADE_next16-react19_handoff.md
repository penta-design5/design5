# Next.js 16 · React 19 업그레이드 Handoff

> 보안 점검 권고(2026-10)에 따른 프레임워크 업그레이드. 새 세션은 이 문서의 「다음 시작점」부터 이어간다.

- 배경: Next.js 14는 2025-10-26 지원 종료, 15는 2026-10 종료 예정 → **16으로 바로 올린다**(14→15 변경도 함께 처리). React 18 → 19. Node 20도 2026-04 지원 종료라 함께 올린다
- 작업 브랜치: 로컬 `upgrade/next16-react19` → 푸시는 규칙대로 `origin/2026-06-17-tiper`(개발망 검증). **운영망은 TOOLBOX 일괄 반영 규칙 그대로 — 업그레이드 → TOOLBOX 전체 QA → 운영망 반영 순서**
- 최초 작성: 2026-10-21
- **현재 상태: 🟡 U0 진행**
- **다음 시작점**: U0 개발망 확인 → U1

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
| U0 | Docker Node 22, handoff 문서 | 🟡 |
| U1 | Next 16 + React 19 + react-konva 19 + next-auth beta.32, codemod(비동기 API·lint·proxy), `build --webpack`, ESLint 9 flat config, 타입 수정 | ⬜ |
| U2 | `next/image` 설정(사설 IP·도메인 제한) + 이미지 화면 점검 | ⬜ |
| U3 | 전체 회귀(개발망): 로그인·관리자·API, 카테고리 페이지·업로드, TOOLBOX 8개 메뉴(Worker·onnxruntime·COOP/COEP), konva 화면, tiptap 에디터 | ⬜ |
| U4 (선택) | Turbopack 빌드 전환 PoC | ⬜ |

---

## 4. 진행 기록

### U0 — Docker Node 22 (🟡 2026-10-21)

- `deploy/rocky/Dockerfile`: `node:20-alpine` → `node:22-alpine`(빌드·런타임 공통 base). Next 14 그대로 Node만 바꿔 먼저 확인한다(문제 생기면 원인 분리)
- [ ] 개발망: 리빌드(`--no-deps app`) + `docker restart design5-nginx` → 기동, 로그인·목록·이미지·TOOLBOX 한두 메뉴 스모크, `docker exec design5-app node -v` = v22.x

---

## 5. 개발망 반영 메모

- 서버: `git pull` → `docker compose -f docker-compose.yml -f docker-compose.app.yml build app` → `up -d --no-deps app` → `docker restart design5-nginx`
- DB 스키마 변경 없음(`migrate deploy` 불필요). Prisma 5 유지
- base 이미지가 바뀌므로 첫 빌드는 `node:22-alpine` 내려받기로 오래 걸릴 수 있다

## 6. 변경 파일

- U0: `docs/UPGRADE_next16-react19_handoff.md`(신규), `deploy/rocky/Dockerfile`
