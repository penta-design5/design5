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

### 1.2 디자인 의뢰 알림 — 특정 관리자 제외 토글 ✅ (2026-06-18, 코드 완료·사내망 검증 대기)
- **요구**: 디자인 의뢰 게시물 등록 시 의뢰자+모든 관리자에게 자동 메일이 가는데, **특정 관리자는 알림 대상에서 제외**할 수 있게.
- **설계 판단**: 사용자가 **회원 관리 화면의 on/off 토글**로 직접 관리하길 원함 → User에 boolean 필드 추가 방식 채택.
  - `receiveDesignRequestMail Boolean @default(true)` — 기본 수신(기존 동작 보존). false인 관리자만 제외.
  - 의뢰자 본인은 토글과 무관하게 항상 수신(자기 의뢰 확인). 알림 자체는 관리자만 받으므로 토글 UI는 **ADMIN 행에만** 노출, MEMBER는 `—`.
  - `@radix-ui/react-switch` 미설치 → **의존성 없는 경량 Switch** 신규 컴포넌트로 구현.
- **변경 파일(6 + 마이그레이션)**:
  - [prisma/schema.prisma](../prisma/schema.prisma): User에 `receiveDesignRequestMail Boolean @default(true)`.
  - `prisma/migrations/20260618120000_add_user_receive_design_request_mail/migration.sql`: `users` 컬럼 추가(NOT NULL DEFAULT true).
    **⚠️ 사내망에서 `npx prisma migrate deploy` 실행 필요**(Claude 환경 DB 접근 불가).
  - [lib/mail/design-request-notification.ts](../lib/mail/design-request-notification.ts): 관리자 조회 `where`에 `receiveDesignRequestMail: true` 추가.
  - [app/api/admin/users/route.ts](../app/api/admin/users/route.ts): GET select에 필드 추가.
  - [app/api/admin/users/[id]/notification/route.ts](<../app/api/admin/users/[id]/notification/route.ts>): 신규 PATCH(`requireAdmin`, boolean 검증) — 기존 role 라우트 패턴 복제.
  - [components/ui/switch.tsx](../components/ui/switch.tsx): 신규 경량 토글(`role="switch"`, 무의존성).
  - [app/(dashboard)/admin/users/page.tsx](<../app/(dashboard)/admin/users/page.tsx>): "의뢰 알림" 컬럼·`handleMailToggle`·`updatingMail` 상태 추가.
    추가로 사용자 요청에 따라 **"공지사항 수" 컬럼을 UI에서 숨김**(헤더·셀만 제거, API select `_count.notices`는 유지 — 기능 보존. 복원 시 헤더/셀만 되살리면 됨).
- **게이트**: `typecheck` 클린 / `lint` 신규 경고 0 / `test` 165 통과.
- **✅ 메일 발송 이슈 해결됨(코드 무관·환경 문제, 2026-06-18)**: 검증 중 토글대로 수신자(toggle ON 관리자+의뢰자)는 정확히 계산되나 **메일이 전혀 안 가던** 증상.
  [design-request-notification.ts](../lib/mail/design-request-notification.ts)가 발송 오류를 삼키고 로그만 남겨(게시물 등록은 201 성공) "조용한 미발송"으로 나타남. 원인·교훈 2가지:
  1. **Gmail SMTP 자격증명 무효**(`535-5.7.8 Username and Password not accepted`): `GMAIL_APP_PASSWORD`가 만료/취소됨(앱 비밀번호는 기간 만료는 없고 2단계 인증 해제·비번 변경·취소·정책으로 무효화). →
     `tiper@pentasecurity.com`에서 **새 앱 비밀번호 발급**(2단계 인증 필요) 후 모든 env(`.env`/`.env.local`/사내 `.env`/`.env.app`)의 `GMAIL_APP_PASSWORD` 갱신. `nodemailer.verify()`로 250 확인.
  2. **Docker env 미반영**: `.env.app` 비번을 바꿔도 **`docker compose restart`는 기존 env 그대로 재시작**이라 새 값이 안 들어감.
     → `docker compose -f docker-compose.yml -f docker-compose.app.yml --env-file .env up -d --force-recreate app` 로 **컨테이너 재생성**해야 `.env.app` 새 값 주입(`exec app printenv GMAIL_APP_PASSWORD`로 대조).
  - 운영(`GMAIL_USER`)이 곧 수신자이기도 한 자기발송도 정상 수신 확인. **코드 변경 없이 환경 조치만으로 해결.**

### 1.3 Penta Design System .md 다운로드 버튼 + 사이드바 Mind5 메뉴 ✅ (2026-06-22, 로컬 확인 완료)
- **요구 1**: Penta Design System 페이지 상단 부제(`컬러 · 타이포그래피 … v1.0`) **바로 옆**에 `penta-design-system.md`
  다운로드 버튼 추가. (초안에서 호버 툴팁을 요청했다가 → 자체 Tooltip이 지저분하다는 피드백으로 **툴팁 전면 제거**, `title` 속성도 미사용.)
- **요구 2**: 사이드바 **LABs 카테고리 맨 아래** "Mind5" 메뉴 추가 → `https://penta-mind5.vercel.app` 외부 링크.
  메뉴 **마우스 오버 시 텍스트 우측 끝에 외부 링크 아이콘** 표시.
- **설계 판단**:
  - 디자인시스템 페이지는 **iframe으로 로드되는 자체 완결형 정적 HTML**이라 React/Radix `Tooltip`·다운로드 컴포넌트를 쓸 수 없음 →
    버튼은 **plain `<a download>`**(같은 `public/penta-design-system/` 폴더의 `.md`를 `/penta-design-system/penta-design-system.md` 경로로 받음, 별도 API/라우트 불필요).
  - Mind5는 외부 URL이라 Next.js `Link` 대신 **`<a target="_blank" rel="noopener noreferrer">`**(새 탭). 호버 아이콘은 이미 import만 돼 있던
    **미사용 `SquareArrowOutUpRight`** 활용 + `group`/`opacity-0 group-hover:opacity-100`로 평소 숨김·호버 시 페이드인. 기존 LABs 항목과 동일 색상 스타일 유지.
- **변경 파일(2 + 정적 자산)**:
  - [public/penta-design-system/penta-design-system.html](../public/penta-design-system/penta-design-system.html):
    `.sub`를 flex 레이아웃으로(텍스트-버튼 간격 `gap: 24px`) + `.download-btn` 스타일·다운로드 `<a>` 추가(브랜드 컬러 토큰·호버 채움, 라이트/다크 대응).
  - [components/category-pages/layout/Sidebar.tsx](../components/category-pages/layout/Sidebar.tsx):
    `CategoryType.ETC`(LABs) 분기 Chart Generator 아래에 Mind5 외부 링크 항목 추가(호버 시 외부 링크 아이콘).
  - 정적 자산: `public/penta-design-system/penta-design-system.md`(다운로드 대상 신규 파일).
- **게이트**: DB·네트워크 비의존 변경(정적 HTML·사이드바 마크업만). 사내망 빌드/런타임 UI 확인은 §2.3.
- **재사용 패턴**: 외부 링크 leaf 메뉴는 "`<a target=_blank>` + `group`-호버 외부아이콘" 조합으로 복제 가능. iframe 정적 문서 페이지의
  버튼/링크는 React 컴포넌트가 아닌 **순수 HTML/CSS로** 추가해야 함(스타일·하이드레이션 충돌 회피).

---

## 2. 사내망 dev 검증 체크리스트 (코드 완료분)
> 빌드/런타임/UI는 사용자가 design6에서 확인. ▣ = 확인 완료, □ = 미확인.

### 2.1 Penta Design System 메뉴
- [x] 사이드바 WORK 섹션 순서: **Penta Design → Penta Design System → 디자인 의뢰** (로컬 확인 완료).
- [x] 메뉴 클릭 시 `/penta-design-system`에서 문서가 iframe으로 전체 표시(헤더 아래 영역 채움, 데스크톱/모바일).
- [x] 미로그인 클릭 시 `/login` 이동, 활성 메뉴 하이라이트 정상.

### 2.2 디자인 의뢰 알림 — 특정 관리자 제외 토글 ✅ (design6 검증 완료)
- [x] **마이그레이션 적용**: `npx prisma migrate deploy` → `users.receiveDesignRequestMail` 컬럼 생성(기존 행 모두 true). ※ 로컬 터널(`127.0.0.1:15432`)과 design6이 같은 DB라 로컬 실행분이 그대로 적용됨.
- [x] 회원 관리(`/admin/users`)에 "의뢰 알림" 컬럼 표시, **관리자 행만 토글**·사용자 행은 `—`.
- [x] 회원 관리 테이블에서 **"공지사항 수" 컬럼 미표시**(데이터 조회는 유지, 화면만 숨김).
- [x] 토글 ON인 관리자(+의뢰자)에게만 메일 발송, OFF 관리자에게는 미발송 — design6에서 정상 확인.
- [x] **SMTP 자격증명 점검**: 새 `GMAIL_APP_PASSWORD` 갱신 + `--force-recreate`로 컨테이너 재생성 후 정상 발송 확인(§1.2 참고).

### 2.3 Penta Design System .md 다운로드 버튼 + Mind5 메뉴
- [ ] 디자인시스템 페이지 상단 부제 옆 `penta-design-system.md` 버튼 표시(부제와 24px 간격), 클릭 시 `.md` 파일 다운로드.
- [ ] 버튼 호버 시 브랜드 컬러 채움, 라이트/다크 모두 정상. **툴팁 미표시**(의도된 제거).
- [ ] 사이드바 LABs 맨 아래 "Mind5" 표시, 클릭 시 새 탭으로 `https://penta-mind5.vercel.app` 열림.
- [ ] Mind5 메뉴 **마우스 오버 시에만** 우측 끝 외부 링크 아이콘 표시.

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
