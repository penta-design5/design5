# TOOLBOX「이미지 분할」 Handoff

> TOOLBOX 공통 규칙·로드맵·검증 방법·배포는 허브 문서 [TOOLBOX_handoff.md](TOOLBOX_handoff.md)를 본다. 이 문서는 「이미지 분할」 메뉴의 진행 상태 단일 원본이다.

- 메뉴: 이미지 분할 · slug `image-splitter` · 라우트 `/toolbox/image-splitter`
- 최초 작성: 2026-09-30
- **현재 상태: 🟡 P0 ✅ · P1 ✅(사용자 확인·푸시) — P2 착수 대기** (2026-09-30)
- **다음 세션 시작점**: P2(분할선 드래그 + 선 위치 슬라이더 + 균등 초기화 + 최소 조각 크기) — §2 「분할선 동작」·§4 계획 기준
- 운영망 반영: TOOLBOX 전체 메뉴 완료 후 한꺼번에(허브 §6). 개발 중에는 사이드바에 노출하지 않고 URL로 직접 검증한다(허브 §3).

범례: ⬜ 대기 · 🟡 진행중 · ✅ 완료 · ⛔ 블록

---

## 1. 결정 사항 (✅ 2026-09-30 확정)

| # | 항목 | 결정 |
| --- | --- | --- |
| 1 | 조각 수 | **2 / 4 / 8 / 16 분할, 기본 4분할** |
| 2 | 화면·속성 | 사용자 제공 참고 화면(§2)을 따른다 |
| 3 | 처리 위치 | 브라우저에서만 처리(서버 전송·저장 없음), DB 변경 없음 — TOOLBOX 공통 |
| 4 | 테스트 | 간단한 것은 로컬, 개발망이 필요한 것은 개발망(허브 §5) |
| D1 | 크기 상한 | **이미지 편집과 동일: 입력 20MB · 약 1,670만 px(4096²)**. 크기 변경 결과에도 같은 상한을 적용한다(한 변 최대 16,384px). 「2배·3배」 결과가 상한을 넘으면 버튼을 비활성하고 안내한다. 참고 화면의 25MB·4천만 px는 쓰지 않는다(Safari·iOS 캔버스 한계). |
| D2 | 격자 모양 | **조각 수로 고정, 항상 가로 기준**: 2분할 = 가로 2 × 세로 1(좌우), 4분할 = 2×2, 8분할 = 가로 4 × 세로 2, 16분할 = 4×4. 사진 방향(세로 사진)과 관계없이 같다. |
| D2 | 「배치」 | **번호(저장) 순서 선택**: 「가로 우선 · 좌우로」(왼쪽 위 → 오른쪽 → 다음 줄, 기본) / 「세로 우선 · 위아래로」(왼쪽 위 → 아래 → 다음 열). 2×2 기준 가로 우선은 1 2 / 3 4, 세로 우선은 1 3 / 2 4다. 캔버스 번호 배지·저장 파일 번호·안내 문구가 선택에 따라 바뀐다. |
| D3 | 저장 방식 | **ZIP 한 번에**(조각별 개별 저장은 필요 시 P4에서 검토) |
| D4 | 공용 모듈 | **`lib/toolbox/common/`으로 이동**(P0). 이미지 편집 import를 수정하고 이미지 편집 회귀 E2E로 확인한다. |

- 참고: 사용자 제공 화면은 「세로 우선 · 위아래로」 선택 상태에서 번호가 1 2 / 3 4로 표시되어 있다. 이는 D2 결정(세로 우선 = 1 3 / 2 4)과 다르며, **D2 결정을 따른다**.

---

## 2. 참고 화면·기능 명세 (사용자 제공 화면 기준)

**화면 구성** — 이미지 편집과 같은 틀: 좌측 작업 영역 + 우측 410px 옵션 패널(xl 이상), xl 미만은 「편집 옵션」 Sheet
- 작업 영역: 이미지를 화면에 맞춰 표시한다.
  - 분할선(얇은 인디고 선)과 조각 번호 배지(인디고 원 + 흰 숫자)를 겹쳐 그린다.
  - 하단 요약: 「가로 2 × 세로 2 · 4조각 · 번호·분할선은 저장되지 않습니다.」
- 불러오기: 클릭·드래그 앤 드롭·붙여넣기(이미지 편집 `ImageUploadZone` 패턴), EXIF 방향 보정, GIF는 첫 프레임(정지 이미지로 분할)

**우측 패널**
1. **사진 크기** — 분할 전에 전체 사진 크기를 바꾼다.
   - 가로·세로(px) 입력 + 「원본 비율 유지」 체크(기본 켜짐) + 「크기 적용」
   - 프리셋: 원본 크기 / 2배 / 3배
   - 안내: 「전체 사진 크기를 적용한 뒤 분할합니다.」 + 상한(D1)
   - 설계: 적용할 때마다 **항상 원본에서 다시 리사이즈**한다(누적 리사이즈로 인한 화질 저하 방지). 「원본 크기」 = 되돌리기.
2. **사진 분할**
   - 조각 수(select: 2·4·8·16, 기본 4 — 격자는 §1 D2대로 고정)
   - 배치(select: 가로 우선 · 좌우로 / 세로 우선 · 위아래로 — 번호·저장 순서, §1 D2)
   - 「균등 분할로 초기화」
   - 분할선별 위치 슬라이더: 「세로선 1 · X 204px」, 「가로선 1 · Y 208px」… (선 개수만큼, 현재 사진 크기 기준 px 표시)
3. **저장 형식** — PNG · 투명 유지(기본) / JPG(투명 → 흰색) / WebP. JPG·WebP는 품질 슬라이더(이미지 편집 `export.ts` 재사용)
4. 안내 문구
   - 「분할선을 드래그하거나 선 위치 슬라이더로 조각 크기를 조절하세요.」 + 배치에 따라 「왼쪽 위부터 오른쪽으로, 다음 줄 순서로 저장합니다.」 / 「왼쪽 위부터 아래로, 다음 열 순서로 저장합니다.」
   - 「JPG의 투명 영역은 흰색으로 저장합니다. GIF는 정지 이미지로 분할합니다.」
5. **저장 버튼**(참고 화면에는 보이지 않음 — 패널 하단에 추가): 「ZIP으로 저장」
   - 파일명 `원본명_01.png` … (2자리, 저장 순서), ZIP 이름 `원본명_split.zip`

**분할선 동작**
- 캔버스에서 선을 직접 드래그한다(가로선은 위아래, 세로선은 좌우). 마우스를 올리면 커서가 `col-resize`/`row-resize`로 바뀐다. 슬라이더와 양방향으로 동기화한다.
- 선 위치는 **비율(0~1)로 저장**한다 → 사진 크기를 바꿔도 같은 상대 위치를 유지한다. 표시·저장은 정수 px로 반올림한다.
- 인접한 선을 넘거나 붙지 않게 최소 조각 크기를 둔다(예: 결과 기준 8px 또는 선 간격 1%, 구현 시 확정).
- 조각 수를 바꾸면 균등 분할로 초기화한다. 배치(순서)를 바꾸면 선 위치는 그대로 두고 번호만 바뀐다.

---

## 3. 구조 (안)

- 공용(D4-A 시): `lib/toolbox/common/` ← `constants.ts`·`load.ts`·`export.ts`·`view.ts` + `transform.ts`의 `resizeCanvas`·`validateOutputSize`
  - 이미지 편집 전용 로직(주석·워터마크·자르기·히스토리 등)은 그대로 둔다.
- 순수 로직 `lib/toolbox/image-splitter/`
  - `grid.ts`: 조각 수 → 열×행(가로 기준 고정), 배치 → 저장 순서, 균등 선 위치, 선 이동 제한(최소 간격), 선 → 조각 사각형(정수 px, 빈틈·겹침 없음), 저장 순서
  - `split.ts`: 조각 캔버스 생성, 파일명, ZIP 생성(`jszip`, 설치됨)
  - vitest: 격자 계산·경계·반올림 후 조각 합 = 전체 크기 검증
- UI `components/toolbox/image-splitter/`
  - `ImageSplitterPage.tsx`(상태·불러오기·Sheet)
  - `SplitCanvas.tsx`(Konva — 이미지 + 분할선 드래그 + 번호 배지)
  - `SplitSidePanel.tsx`(사진 크기·사진 분할·저장 형식·저장)
- 라우트 `app/(dashboard)/toolbox/image-splitter/page.tsx`·`layout.tsx`. 메뉴(`TOOLBOX_MENU`) 등록은 마지막 Phase에서 한다.

---

## 4. Phase 계획

| Phase | 내용 | 상태 |
| --- | --- | --- |
| P0 | 공용 모듈 이동(D4) + 이미지 편집 회귀 확인 + 라우트·페이지 골격(메뉴 미노출) | ✅ |
| P1 | 불러오기 + 캔버스 표시 + 균등 분할(조각 수) + 배치(번호 순서) + 번호·하단 요약 + **ZIP 저장(PNG)** — 최소 사용 가능 | ✅ |
| P2 | 분할선 드래그 + 선 위치 슬라이더 + 균등 초기화 + 최소 조각 크기 | ⬜ |
| P3 | 사진 크기(분할 전 리사이즈·비율·프리셋·상한) + 저장 형식(JPG/WebP·품질) | ⬜ |
| P4 | 반응형(Sheet)·터치 드래그·접근성·QA + **사이드바 메뉴 노출** + 개발망 확인 | ⬜ |

각 Phase: 구현 → typecheck·lint·vitest·로컬 E2E(결과 ZIP 안의 조각 크기·픽셀 확인) → 사용자 확인 → 다음 Phase

### P0 — 공용 모듈 이동 + 라우트 골격 (✅ 2026-09-30)

**공용 모듈 이동(D4)**: `lib/toolbox/image-editor/` → `lib/toolbox/common/`
- 통째로 이동(`git mv`): `load.ts`(검증·EXIF 보정 디코딩·클립보드), `export.ts`(형식·파일명·인코딩·다운로드), `view.ts`(화면 맞춤·줌)
- `constants.ts` → `common/constants.ts`(입력 형식·20MB·16,777,216px·줌). **히스토리 상수만** `image-editor/constants.ts`에 남긴다.
- 신규 `common/canvas.ts`: `transform.ts`에서 공용 부분을 분리했다.
  - `Size`·`MAX_SIDE`·`validateOutputSize`
  - `ResizeUnit`·`resolveResize`·`linkedDimension`(px 입력 + 비율 유지 계산 — 분할 「사진 크기」에 사용)
  - `createCanvas`·`resizeCanvas`
  - `image-editor/transform.ts`에는 회전·반전·자르기만 남는다.
- 테스트도 나눴다: 공용 테스트는 `common/common.test.ts`(15건), 히스토리는 `image-editor/image-editor.test.ts`, 회전은 `image-editor/transform.test.ts`. 총 68건은 그대로다.
- 이미지 편집 컴포넌트 7개와 `crop.ts`의 import를 새 경로로 바꿨다(동작 변경 없음).
- 이미지 편집 전용으로 남는 것: 주석·워터마크·자르기·히스토리·단축키·회전/반전

**라우트 골격**
- `app/(dashboard)/toolbox/image-splitter/page.tsx`(dynamic, ssr false) + `layout.tsx`(`segmentPageMetadata('이미지 분할')`)
- `components/toolbox/image-splitter/ImageSplitterPage.tsx`: 좌측 작업 영역 + 우측 410px 패널 골격, 「준비 중」 표시
- 사이드바(`TOOLBOX_MENU`)에는 **등록하지 않는다**(P4에서 등록). URL로 직접 접근해 검증한다.

**검증**
- [x] typecheck 0 / lint 0 / vitest 68건 통과
- [x] 분할 라우트 E2E **8/8**
  - 비로그인 → /login, 로그인 시 페이지 표시, 탭 제목 「이미지 분할 | Design5」
  - 우측 패널 골격, 헤더가 410px을 피함
  - **사이드바에는 이미지 편집만**(분할 미노출), `/toolbox` → 이미지 편집
  - 콘솔 에러 없음
- [x] **이미지 편집 회귀 전체 138/138**(P1~P4 39 · P5 37 · P6-1 27 · P6-2 28 · 단축키 칩 7) — 공용 모듈 이동 후에도 동작 동일

### P1 — 불러오기·균등 분할·배치 번호·ZIP 저장 (✅ 2026-09-30)

**구조**
- 순수 로직 `lib/toolbox/image-splitter/grid.ts`
  - `GRID_SHAPES`(가로 기준 고정), `equalLines`(균등 비율)
  - `edgesOf`: 비율 → 정수 경계. 반올림 후에도 오름차순이고 조각은 최소 1px이다.
  - `computePieces`: 저장 순서대로 index를 매긴다(가로 우선 / 세로 우선).
  - `pieceFileName`(최소 2자리), `gridSummary`
- `lib/toolbox/image-splitter/split.ts`
  - `cropPiece`
  - `buildSplitZip`: 조각을 하나씩 인코딩해 ZIP(`jszip`, STORE)으로 묶는다. 큰 이미지에서도 조각 캔버스가 한꺼번에 쌓이지 않는다.
  - 인코딩은 공용 `encodeCanvas`를 쓴다 → P3에서 JPG·WebP를 추가해도 그대로 동작한다.
- 공용화(이번 Phase)
  - `ImageUploadZone` → `components/toolbox/common/`
  - 체크무늬 패턴 `createCheckerPattern` → `lib/toolbox/common/canvas.ts`
  - `common/export.ts`에 `baseNameOf`·`sanitizeFileName` 추가
  - 이미지 편집도 이 공용 모듈을 쓴다.
- UI `components/toolbox/image-splitter/`
  - `ImageSplitterPage`(불러오기: 클릭·드롭·붙여넣기, 상태, 1280px 미만 Sheet)
  - `SplitCanvas`(Konva)
    - 이미지는 원본 좌표 Group(배율 적용)에, 분할선·번호 배지는 화면 좌표 레이어에 그린다 → 굵기·크기가 배율과 관계없이 일정하다.
    - 조각이 화면에서 작으면 배지도 줄어든다.
  - `SplitSidePanel`: 사진 분할(조각 수·배치 + 순서 안내) / 저장(형식 PNG 고정 표시·파일명·미리보기·「ZIP으로 저장 (N조각)」) / 이미지 정보 + 「다른 이미지 열기」
- 동작 규칙
  - 조각 수를 바꾸면 균등 분할로 초기화한다.
  - 배치(번호 순서)를 바꾸면 번호만 바뀐다.
  - 새 이미지를 열어도 조각 수·배치는 유지한다.
  - 파일명 기본값은 원본명(확장자 제외)이고, 금지 문자는 `_`로 바꾼다.
- 반응형: P4 예정이었으나, 1280px 미만에서 옵션을 쓸 수 없게 되는 것을 막으려고 이미지 편집과 같은 Sheet(모바일 하단 / 태블릿 오른쪽)를 먼저 적용했다. 세부 다듬기는 P4에서 한다.

**검증**
- [x] typecheck 0 / lint 0 / vitest 신규 12건(총 80건)
  - 격자 모양, 균등 비율
  - **2·4·8·16분할 모두 홀수 크기(409×416)에서 빈틈·겹침 없이 전체를 덮음**
  - 4분할 409×416 → 205/204 · 208/208
  - 가로 우선 1 2 / 3 4 · 세로 우선 1 3 / 2 4, 8분할 세로 우선
  - `edgesOf` 최소 1px 보장, 파일명·요약
- [x] 로컬 헤드리스 Chrome E2E **24/24** — 받은 ZIP을 `jszip`으로 풀어 조각 파일명·크기·**픽셀**로 확인
  - 업로드 영역, .txt 거부 / 크기 표시, 기본 4분할 요약, 번호 배지 가로 우선 1 2 / 3 4, 파일명 기본값
  - **ZIP `quad_split.zip` · `quad_01~04.png` · 각 200×150 · 01 빨강 / 02 초록 / 03 파랑 / 04 투명(PNG 투명 유지)**
  - **세로 우선: 배지 1 3 / 2 4, 안내 문구 변경, ZIP 01 빨강 / 02 파랑 / 03 초록**
  - 2분할 200×300 두 장
  - 8분할 409×416 8장·넓이 합 = 전체 / 16분할 16장·파일명 금지 문자 치환(`조각/테스트` → `조각_테스트_01.png`)·배지 16개
  - 1024px 오른쪽 Sheet, 사이드바 미노출, 콘솔 에러 없음
- [x] 이미지 편집 회귀 138/138(업로드 영역·체크무늬 공용화 후)
- [x] **사용자 확인 ✅ 2026-09-30**: `/toolbox/image-splitter`에서 실제 사진으로 조각 수·배치 변경, ZIP 저장 결과

---

## 5. 수동 QA 체크리스트 (P4에서 구체화)

- [ ] 실제 사진(세로 사진 포함)으로 2·4·8·16분할 저장 → ZIP 안 조각 수·크기 확인, 가로 우선 / 세로 우선 번호 순서 확인
- [ ] 분할선 드래그·슬라이더 결과가 저장 조각과 일치
- [ ] 크기 변경(2배·3배·직접 입력) 후 분할
- [ ] PNG 투명 유지 / JPG 흰색 / WebP
- [ ] Safari·Edge, 모바일·태블릿(Sheet·터치 드래그)

---

## 6. 변경 파일 (진행하며 기록)

- P0 신규: `lib/toolbox/common/canvas.ts`, `lib/toolbox/common/common.test.ts`, `app/(dashboard)/toolbox/image-splitter/page.tsx`·`layout.tsx`, `components/toolbox/image-splitter/ImageSplitterPage.tsx`
- P0 이동: `lib/toolbox/image-editor/{load,export,view,constants}.ts` → `lib/toolbox/common/`
- P0 수정: `lib/toolbox/image-editor/{constants,transform,crop}.ts`, 테스트 2개, `components/toolbox/image-editor/*` 7개(import 경로만)
- P1 신규: `lib/toolbox/image-splitter/{grid,split,grid.test}.ts`, `components/toolbox/image-splitter/{SplitCanvas,SplitSidePanel}.tsx`
- P1 이동: `components/toolbox/image-editor/ImageUploadZone.tsx` → `components/toolbox/common/`
- P1 수정: `components/toolbox/image-splitter/ImageSplitterPage.tsx`(골격 → 본 구현), `lib/toolbox/common/{canvas,export}.ts`(체크무늬·파일명 헬퍼), `components/toolbox/image-editor/{ImageEditorPage,EditorCanvas}.tsx`(공용 import)
