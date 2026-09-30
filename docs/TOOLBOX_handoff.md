# TOOLBOX Handoff (허브)

> **TOOLBOX 전체의 공통 규칙·메뉴 로드맵·진행 상태 목차 문서다.** 메뉴별 구현 기록은 **메뉴마다 별도 handoff 문서**(`docs/TOOLBOX_<slug>_handoff.md`)에 둔다(사용자 결정 2026-09-30).
> 새 세션은 이 허브에서 공통 규칙과 로드맵을 확인한 뒤, 작업할 메뉴의 문서만 읽고 이어간다.

- 대상: 사이드바 **TOOLBOX** 섹션 + 쉽고 간편한 범용 소도구를 메뉴 단위로 지속 추가
- 최초 작성: 2026-09-28 · 허브/메뉴 문서 분리: 2026-09-30
- **현재 상태**
  - ✅ 이미지 편집 완료 (2026-09-30, 개발망 확인)
  - 🟡 **이미지 분할 P0~P3 ✅ · P4 진행 중** → [TOOLBOX_image-splitter_handoff.md](TOOLBOX_image-splitter_handoff.md)
- **다음 세션 시작점**: 이미지 분할 P4(반응형·터치·접근성·QA + 메뉴 노출) — [TOOLBOX_image-splitter_handoff.md](TOOLBOX_image-splitter_handoff.md) 기준
- ⚠️ **운영망(design5) 반영은 TOOLBOX 전체 메뉴 구현이 끝난 뒤 한꺼번에** 한다(사용자 결정 2026-09-30). 개발망·운영망이 같은 브랜치(`2026-06-17-tiper`)를 pull하므로, 그 전에는 운영망에서 pull하지 않는다.

범례: ⬜ 대기 · 🟡 진행중 · ✅ 완료 · ⛔ 블록

---

## 1. 배경 및 핵심 결정 (TOOLBOX 공통)

| 항목 | 결정 | 근거 |
| --- | --- | --- |
| 카테고리 이름 | **TOOLBOX** | 이미지·QR·특수문자처럼 성격이 다른 기능이 섞여도 어색하지 않고, 지속 추가에 적합. 사이드바 섹션 제목은 CSS `uppercase`로 표시되므로 다른 섹션과 표기 일관 |
| LABS와의 관계 | **LABS는 그대로 유지**(eDM·PDF Extractor·Chart Generator·Mind5 이동 없음) | 구분 기준 — LABS: 사내 제작 실험적·특화 서비스 / TOOLBOX: 파일 하나 넣고 바로 결과를 받는 범용 소도구 |
| 구현 방식 | **방안 A — 사이드바 하드코딩 섹션** | 도구는 게시물이 없는 기능 페이지라 DB 불필요 |
| DB / 스키마 | **변경 없음** — `CategoryType` enum에 `TOOLBOX`를 **추가하지 않음**, 마이그레이션·시드 없음 | 개발망/운영망 `migrate deploy` 선행 부담 제거. LABS(`ETC`)는 enum을 쓰지만 TOOLBOX는 enum과 무관한 독립 블록으로 렌더 |
| 사이드바 위치 | **BROCHURE 다음, LABS 앞** | 사용자 결정(2026-09-28). 순서: WORK → SOURCE → TEMPLATE → BROCHURE → **TOOLBOX** → LABS → INSIGHTS → ADMIN |
| 메뉴 아이콘 | **없음** | 기존 카테고리·메뉴도 아이콘 미사용 — 텍스트 메뉴로 통일 |
| 접근 권한 | **로그인 사용자만** | 사용자 결정. eDM 패턴 적용 — 서버 `auth()` 확인 후 비로그인 시 `redirect('/login')`. `app/(dashboard)/toolbox/layout.tsx` 한 곳에서 `/toolbox/*` 전체를 막는다. 사이드바 메뉴는 eDM처럼 비로그인에게도 보이고, 클릭하면 로그인 페이지로 이동 |
| 처리 위치 | **브라우저(클라이언트) 처리 원칙** — 서버 업로드·Storage 저장 없음 (예외: 배경 제거는 §2-1 검토 후 결정) | 사용자 이미지가 서버로 나가지 않음(보안·개인정보), MinIO/DB 비의존 → **로컬에서도 기능 검증 가능** |
| 라우트 | `/toolbox/<tool-slug>` (예: `/toolbox/image-editor`) | 기존 LABS 도구는 최상위 경로(`/pdf-extractor`)지만, TOOLBOX는 도구 수가 계속 늘어나므로 prefix로 묶어 MainLayout 판별·미들웨어 관리를 단순화 |
| 캔버스 라이브러리 | **`konva` + `react-konva`** (이미 설치됨, `package.json`) | 도형·텍스트 객체 선택/이동/변형(Transformer), 레이어, 내보내기(`toDataURL`) 기본 제공. 기존 사용처: `components/category-pages/DiagramCategory/DiagramCanvas.tsx` |
| 다크모드 | 미지원(프로젝트 방침) | 라이트 테마 기준으로만 구현 |

---

## 2. TOOLBOX 메뉴 로드맵

> 메뉴는 **구현 완료된 것만 사이드바에 노출**한다(준비중 메뉴 비노출). 순서는 아래 표 순서를 기본으로 한다.

| # | 메뉴 | slug(안) | 주요 기능 | 처리 방식 | 상태 · 문서 |
| --- | --- | --- | --- | --- | --- |
| 1 | **이미지 편집** | `image-editor` | 회전/반전(각도 조정), 사이즈 변경(비율 유지), 자르기, 텍스트·도형(펜, 형광펜, 직선, 화살표, 사각형, 원), 워터마크 삽입 | 브라우저 (Canvas/Konva) | ✅ 완료 · [TOOLBOX_image-editor_handoff.md](TOOLBOX_image-editor_handoff.md) |
| 2 | 이미지 분할 | `image-splitter` | 2 / 4 / 8 / 16 분할(기본 4), 분할선 위치 조정, 분할 전 크기 변경 | 브라우저 (Canvas + `jszip` ZIP 다운로드) | 🟡 P3 완료 · [TOOLBOX_image-splitter_handoff.md](TOOLBOX_image-splitter_handoff.md) |
| 3 | 배경 제거 및 변경 | `background-remover` | 배경 제거, 단색/이미지 배경 교체 | ⚠️ **AI 모델 필요 — §2-1 검토 후 결정** | ⬜ 로드맵 |
| 4 | 이미지 모자이크 | `mosaic` | 격자형, 육각·삼각형, 원형, 블러, 픽셀아트 등 | 브라우저 (픽셀 연산, **AI 불필요** — §2-2) | ⬜ 로드맵 |
| 5 | QR 코드 생성 | `qr-code` | URL/텍스트 → QR, 색상·크기·로고, PNG/SVG 다운로드 | 브라우저 (QR 라이브러리, 예: `qrcode`) | ⬜ 로드맵 |
| 6 | 특수 문자 및 이모티콘 | `special-characters` | 클릭 시 클립보드 복사 | 브라우저 (Clipboard API — HTTPS 필요, 개발망·운영망 모두 HTTPS라 문제없음) | ⬜ 로드맵 |
| 7 | 파일명 일괄 변경 | `batch-rename` | 규칙 기반 일괄 변경 | 브라우저 (**제약 있음** — §2-3) | ⬜ 로드맵 |

> 공통 기반(이미지 편집 P0: 사이드바 섹션·라우팅·로그인 게이트·레이아웃)은 이후 메뉴가 **메뉴 항목 1줄 + 페이지 1개 추가**만으로 붙도록 설계되어 있다(§3).

### 2-1. 배경 제거 — 착수 전 검토 항목

배경 제거는 **AI 분할(segmentation) 모델이 필요**한 유일한 메뉴다. 브라우저에서 모델을 실행하는 방식(ONNX Runtime Web, Transformers.js, MediaPipe 등)으로도 구현할 수 있고, 이 경우 이미지가 서버로 나가지 않는다는 원칙이 유지된다. 착수 시 아래를 먼저 검토한다.

- [ ] **라이선스 (최우선)**: design5(운영망)가 **외부 공개 예정**이므로 모델·라이브러리 라이선스를 반드시 확인한다.
  - 예: `@imgly/background-removal`은 AGPL 계열, BRIA RMBG 모델은 비상업 라이선스로 알려져 있음 → **착수 시점의 최신 조건 재확인 필요**
  - 허용적 라이선스 후보: U²-Net / ISNet 계열, MediaPipe(인물 전용) — 품질 비교 필요
- [ ] **모델 용량·첫 로딩**: 모델 파일이 보통 수십 MB 이상 → 첫 사용 시 다운로드 대기(로딩 진행률 표시), 이후 브라우저 캐시
- [ ] **모델 파일 위치**: 라이브러리 기본값은 외부 CDN(Hugging Face 등)에서 받아오는 경우가 많음. 외부 의존을 피하거나 사내망에서 외부 접속이 안 되면 **모델 파일을 자체 호스팅**(`public/` 또는 MinIO)해야 함 → 이 경우 Storage는 "정적 모델 파일 보관" 용도로만 사용
- [ ] **성능**: WebGPU 지원 브라우저는 빠르고, 미지원 시 WASM으로 대체되어 느려짐(저사양 PC·모바일에서 수 초 이상). 처리 중 UI 멈춤 방지를 위해 Web Worker 실행 검토
- [ ] **대안 — 서버 처리**: 사내 서버에 모델(예: Python `rembg`)을 두고 **저장 없이 처리 후 즉시 반환**. 품질·속도 안정적이고 사용자 기기와 무관하지만, 서버 자원·운영 부담이 생기고 이미지가 서버를 거침
- **진행 방안**: 브라우저 방식으로 모델 후보 2~3개를 **품질·속도·라이선스 기준으로 PoC 비교** → 결과에 따라 브라우저/서버 방식 결정

### 2-2. 이미지 모자이크 — AI 불필요

- 격자형, 육각·삼각형, 원형, 블러, 픽셀아트는 모두 **영역별 평균색을 계산해 다시 칠하는 픽셀 연산**이라 Canvas만으로 구현한다(모델·외부 라이브러리 불필요).
- 모자이크 영역은 **사용자가 직접 지정**(브러시 칠하기 / 사각형 선택)하는 방식을 기본으로 한다.
- AI가 필요한 경우는 **얼굴·번호판 자동 감지 후 모자이크** 같은 자동화 기능뿐이며, 필요 시 후속 옵션으로 검토(이때는 §2-1과 같은 라이선스·용량 검토 적용).
- 큰 이미지에서 블러·패턴 연산이 무거우면 Web Worker / `OffscreenCanvas`로 분리 검토.

### 2-3. 파일명 일괄 변경 — 브라우저 제약

- 브라우저는 보안상 **사용자 PC에 있는 파일의 이름을 직접 바꿀 수 없다.**
- **기본 방식: 이름을 바꾼 파일들을 ZIP으로 묶어 다운로드** (`jszip` 설치됨) — 모든 브라우저에서 동작
- 선택 방식: File System Access API로 폴더에 직접 반영 — **Chrome·Edge 계열만 지원**(Safari·Firefox 미지원). 지원 브라우저에서만 버튼을 노출하는 식의 점진적 제공 검토
- 파일 수·총용량이 크면 ZIP 생성 시 메모리 부담 → 상한(예: 파일 수/총 용량) 설정 필요

---

## 3. 새 메뉴 추가 방법 · 문서 규칙

**코드**
1. 페이지: `app/(dashboard)/toolbox/<slug>/page.tsx` + `layout.tsx`(`segmentPageMetadata('<메뉴명>')`)를 만든다. 본체는 `dynamic(..., { ssr: false })`로 `components/toolbox/<slug>/`에서 불러온다.
   - 로그인 게이트는 `app/(dashboard)/toolbox/layout.tsx`가 `/toolbox/*` 전체에 이미 적용한다. 추가 작업이 없다.
2. 레이아웃: `MainLayout`의 `isToolboxPage`가 `/toolbox*` 전체를 풀-높이 + 우측 410px 패널로 처리한다. 헤더는 `rightPanelFrom='xl'`이다.
   - 우측 패널은 xl(1280px) 이상에서만 고정한다. 그 미만은 「편집 옵션」 Sheet다(모바일 하단 / 태블릿 오른쪽). 이미지 편집 `ImageEditorPage` 참고.
   - 우측 패널이 없는 도구(예: 특수 문자)를 추가하면 `hasRightPanel` 판별을 도구별로 나눠야 한다.
3. 사이드바: `lib/toolbox/menu.ts`의 `TOOLBOX_MENU`에 `{ slug, label }` 1줄을 추가한다.
   - **구현이 끝난 메뉴만 추가**한다(준비중 메뉴 비노출). 개발 중에는 라우트 URL로 직접 접근해 검증한다.
4. 처리 원칙: 브라우저에서만 처리한다(서버 업로드·Storage 저장 없음). 이미지가 서버로 나가지 않는다. DB·마이그레이션도 없다(예외는 §2 각 메뉴 검토 메모).

**문서**
- 메뉴 착수 시 `docs/TOOLBOX_<slug>_handoff.md`를 만들고 §2 로드맵 표에 링크·상태를 추가한다.
- 메뉴 문서 틀(이미지 분할 문서가 기준 틀이다):
  1. 헤더(상태·다음 시작점)
  2. 결정 사항
  3. 참고 화면·기능 명세
  4. 구조(재사용 모듈 포함)
  5. Phase별 구현·검증
  6. 수동 QA 체크리스트
  7. 변경 파일
- 큰 기능은 Phase(P0, P1…)로 나눈다. 각 Phase는 구현 → 자동 검증 → **사용자 확인** 후 다음으로 넘어간다(사용자 요청 2026-09-28).

---

## 4. 공용 모듈 (재사용)

이미지 편집에서 만든 아래 모듈은 다른 이미지 메뉴(분할·모자이크·배경 제거 등)가 그대로 쓸 수 있다. 위치는 **`lib/toolbox/common/`**이다(이미지 분할 P0에서 이동, 2026-09-30). 새 메뉴는 여기서 가져다 쓰고, 메뉴 전용 로직은 `lib/toolbox/<slug>/`에 둔다.

| 모듈 | 내용 |
| --- | --- |
| `constants.ts` | 입력 20MB · 캔버스 16,777,216px(4096², Safari 한계) · 지원 형식 · 줌 상수 |
| `load.ts` | 형식·용량·픽셀 검증(HEIC 안내, MIME 없으면 확장자), **EXIF 방향 보정 디코딩**(`decodeImageFile` → canvas), 클립보드 이미지 추출 |
| `export.ts` | 형식(PNG/JPG/WebP)·품질·파일명(`baseNameOf`·`sanitizeFileName`)·인코딩(JPG 투명 → 흰색, 미지원 형식 안내)·다운로드 |
| `canvas.ts` | `Size`·`MAX_SIDE`·`validateOutputSize`(결과 크기 상한)·`resolveResize`·`linkedDimension`(비율 유지 입력)·`createCanvas`·`resizeCanvas`(고품질 단계적 축소)·`createCheckerPattern`(투명 표시) — 새 캔버스 반환 |
| `view.ts` | 화면 맞춤·중앙 정렬·기준점 줌 |
| (이미지 편집 전용) `image-editor/history.ts` | 불변 스냅샷 undo/redo(`pushHistory`·`replacePresent`), 이미지 크기별 단계 상한 — 필요한 메뉴가 생기면 common으로 옮긴다 |
| `lib/hooks/use-media-query.ts` | 범용 미디어 쿼리 훅(xl 기준·`pointer: coarse`) |

UI 패턴 참고(`components/toolbox/image-editor/`):
- **`components/toolbox/common/ImageUploadZone`**(클릭·드롭·붙여넣기 안내 — 공용, 이미지 분할 P1에서 이동)
- `EditorSidePanel`(우측 패널 + Sheet 공용)
- **`components/toolbox/common/ZoomControls`**(캔버스 오른쪽 아래 줌 컨트롤 — 공용, 이미지 분할 P3에서 이동)·`ShortcutHint`(단축키 칩)
- 휠 줌·화면 이동·핀치 줌 처리(`EditorCanvas`, 이미지 분할 `SplitCanvas`도 같은 방식)

---

## 5. 검증 방법 (공통)

- **커밋 전 preflight**: `npm run typecheck && npm run lint`(CLAUDE.md). 푸시 대상은 항상 `git push origin HEAD:2026-06-17-tiper`.
- **테스트 분담(사용자 결정 2026-09-30)**: 간단한 것은 로컬에서, 개발망이 필요한 것(배포 빌드·실브라우저·실기기 등)은 개발망(design6)에서 테스트한다.
  - TOOLBOX 도구는 클라이언트 전용이라 로컬 `next dev`에서 기능 검증까지 가능하다.
- **사람 확인(로컬)**: `/toolbox/*`는 로그인이 필요하고, 로그인은 DB 사용자 조회가 필요하다. SSH 터널(`docs/개발망작업_준비사항.md`)을 연 상태에서 로컬 로그인 후 확인한다. 세션은 JWT라 로그인 후에는 도구 자체가 DB를 쓰지 않는다.
- **자동 검증(Claude 세션)**
  - 테스트 세션 쿠키: 세션 콜백이 DB를 조회하지 않으므로, 로컬 `.env.local`의 `NEXTAUTH_SECRET`과 `next-auth/jwt`의 `encode()`(salt `authjs.session-token`)로 테스트 쿠키를 만들면 터널 없이 실제 경로를 E2E 검증할 수 있다. **토큰 유효기간 1시간** — 만료되면 로그인 페이지로 이동하므로 다시 만든다.
  - 헤드리스 Chrome: `puppeteer-core` + 시스템 Chrome을 **세션 스크래치에만 설치**한다(프로젝트 의존성 추가 없음).
  - 내보낸 파일은 CDP `Browser.setDownloadBehavior`로 받고, 결과 **픽셀**로 검증한다.
  - 연속 다운로드는 실제 마우스 클릭(`ElementHandle.click()`)으로 해야 Chrome이 막지 않는다.
  - 터치는 CDP `Input.dispatchTouchEvent`를 쓴다.
  - 참고: dev 서버를 새로 띄운 직후 첫 페이지 로드에서는 에디터가 늦게 뜨거나 일시적 페이지 에러가 날 수 있다. 워밍업 로드 후 테스트한다.
- **vitest**: 순수 로직은 `lib/toolbox/**.test.ts`에 둔다. 전체 실행 시 `preset-storage` 관련 15건 실패는 TOOLBOX와 무관한 **기존 문제**다.

---

## 6. 배포 (공통)

- 개발망(design6) 반영: 로컬 push → 서버 `git pull` → 리빌드(`--no-deps app`) → **`docker restart design5-nginx`**(안 하면 502). 절차: [개발망작업_준비사항.md](개발망작업_준비사항.md)
- DB 변경이 없으므로 `migrate deploy`는 필요 없다(메뉴가 DB를 쓰게 되면 해당 메뉴 문서에 명시한다).
- 운영망(design5): **TOOLBOX 전체 메뉴 완료 후 한꺼번에** 반영한다. 반영 전 운영망 `.env.app`에 `DATA_ROOT`가 있는지 확인한다.
