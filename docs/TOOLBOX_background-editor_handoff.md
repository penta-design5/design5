# TOOLBOX「배경 편집」 Handoff

> TOOLBOX 공통 규칙·로드맵·검증 방법·배포는 허브 문서 [TOOLBOX_handoff.md](TOOLBOX_handoff.md)를 본다. 이 문서는 「배경 편집」 메뉴의 진행 상태 단일 원본이다.

- 메뉴: 배경 편집 · slug `background-editor` · 라우트 `/toolbox/background-editor`
  - 허브 로드맵의 slug 안(`background-remover`)을 메뉴 이름에 맞춰 바꿨다.
- 최초 작성: 2026-10-01
- **현재 상태: 🟡 P1 구현·로컬 검증 완료(2026-10-01) — 개발망 배포·사무용 PC 속도 측정·사용자 확인 대기**
- **다음 시작점**: 개발망(design6) 반영 → 사무용 PC에서 「처리 정보」의 실행 방식·처리 시간 확인(§6 P1 검증) → P2(배경 교체·저장 형식)
- 미결 항목(§5) Q1~Q4는 모두 확정됐다.
- 운영망 반영: TOOLBOX 전체 메뉴 완료 후 한꺼번에(허브 §6). 사이드바 메뉴 등록은 마지막 Phase에서 한다.

범례: ⬜ 대기 · 🟡 진행중 · ✅ 완료 · ⛔ 블록

---

## 1. 결정 사항

**사용자 결정 (✅ 2026-10-01)**

| # | 항목 | 결정 |
| --- | --- | --- |
| 1 | 모델 | 사물·인물 범용 → **ISNet / U²-Net 중 품질이 더 좋은 것**. PoC 결과 **ISNet**(§3) |
| 2 | 처리 위치 | **브라우저**. 서버 전송·저장이 없고 DB 변경도 없다(TOOLBOX 공통) |
| 3 | 모델 파일 위치 | **외부 CDN에서 내려받기**(자체 호스팅 안 함) |
| | | 사내 PC에서 jsDelivr(`ort-wasm-simd-threaded.jsep.wasm`)와 Hugging Face 모델 파일 다운로드를 확인했다(2026-10-01) |
| 4 | 기능 범위(MVP) | 제거 → 투명 PNG / 배경 교체(단색·이미지·투명) / 경계 부드럽게·강도 / 전·후 비교 / 원본 해상도 유지 / PNG·JPG·WebP 저장(공용 `export.ts`) |
| | | **후속 검토**: 수동 보정 브러시(지우기/복원), 일괄 처리, 배경 흐림 |
| 5 | 성능 기준 | **일반 PC에서 5초 이내**(1장 처리 기준, 모델 다운로드 제외) |
| 6 | 메뉴 이름 | **배경 편집** |
| 7 | 안내 문구 | 제안안대로 한다(§2). 예: 「이미지는 서버로 전송되지 않고 브라우저에서 처리됩니다.」, 첫 사용 시 모델 다운로드 안내 |

**PoC로 정한 기술 결정 (§3 근거)**

| # | 항목 | 결정 |
| --- | --- | --- |
| T1 | 모델 파일 | **ISNet general-use fp16**(약 90MB, 입력 1024×1024). fp32(179MB)와 결과가 같다(알파 오차 0.02% 이하). int8(44MB)은 WebGPU에서 결과가 깨져서 제외했다. |
| T1-a | fp16 파일 출처 | **공식 fp32(rembg 릴리스, SHA-256 `60920e99…d964a`)를 직접 변환**했다(2026-10-01). 사용자가 Hugging Face 저장소에 올린다(§5 Q1-A 방식). |
| | | 변환: 보조 출력 11개를 제거하고 `output_image`만 남긴 뒤 `onnxconverter-common` `convert_float_to_float16(keep_io_types=True)`로 변환 |
| | | 보조 출력을 남기면 float32로 되돌리는 Cast가 Conv 입력에 섞여 세션 생성이 실패한다 |
| | | 결과 파일 `isnet-general-use-fp16.onnx` 90,661,254바이트, SHA-256 `1e00f2f0b23dea1b687ff90652263144fdb98af942aaa0cae8630c49159b18f0` |
| | | 입력 `input_image` / 출력 `output_image` |
| | | 검증: WASM 2.4초, WebGPU(`ceil_mode` 보정) 0.40초, fp32 대비 알파 오차 0.02% 이하 |
| T2 | 실행기 | **`onnxruntime-web`**(MIT). 프로젝트 의존성이 1개 추가된다. wasm 파일은 jsDelivr에서 받는다(`ort.env.wasm.wasmPaths`). 버전은 package.json과 같게 고정한다. |
| T3 | 실행 백엔드 | **WebGPU 우선, 미지원 시 WASM으로 대체** |
| T4 | 모델 호환 보정 | ISNet의 MaxPool `ceil_mode=1`을 onnxruntime-web WebGPU가 지원하지 않는다(1.30.0 기준). 내려받은 모델 바이트에서 `ceil_mode` 속성 33곳을 1 → 0으로 바꾼 뒤 세션을 만든다. |
| | | 바꾸는 부분은 같은 길이의 바이트 패턴 `0a 09 "ceil_mode" 18 01 a0 01 02` → `18 00`이라 파일 구조가 바뀌지 않는다. |
| | | 입력 1024에서는 모든 풀링 입력 크기가 짝수여서 결과가 같다(검증 완료). 패턴 수가 33이 아니면 WASM만 쓴다. |
| T5 | 전·후처리 | rembg와 동일하다. |
| | | 전처리: 1024² 리사이즈 → 최대값으로 나누기 → −0.5 → NCHW float32 |
| | | 후처리: 출력[0]을 min-max 정규화한 뒤 마스크를 원본 크기로 확대해 알파로 쓴다. 원본 해상도는 유지한다. |
| T6 | 처리 스레드 | UI 멈춤을 막기 위해 **Web Worker**에서 추론을 실행한다(P1에서 구현). |

---

## 2. 기능 명세 (MVP)

**화면 구성**: 이미지 분할과 같은 틀을 쓴다.
- 좌측 작업 영역 + 우측 410px 옵션 패널(xl 이상)
- xl 미만은 「편집 옵션」 Sheet

**처리 흐름**
1. 불러오기: 공용 `ImageUploadZone`(클릭·드롭·붙여넣기)과 `load.ts`(EXIF 보정·20MB·픽셀 상한)를 쓴다.
2. 첫 사용 시 모델을 내려받는다(약 90MB). 진행률(MB/%)을 표시한다.
   - 이후에는 Cache Storage에 보관해 다시 받지 않는다(HTTP 캐시는 큰 파일을 지울 수 있다).
3. 배경 제거를 자동 실행한다. 처리 중 표시와 사용한 백엔드(WebGPU/WASM)를 보여 준다.
4. 결과 표시: 투명 영역은 체커 무늬로 보인다. 전·후 비교(슬라이더 또는 토글)를 제공한다.
5. 옵션
   - **배경**: 투명 / 단색(색상 선택) / 이미지(업로드, 채우기 방식)
   - **경계**: 부드럽게 강도(마스크 블러·임계값)
   - **저장 형식**: PNG(투명 유지, 기본) / JPG(투명 → 흰색 또는 선택한 배경) / WebP + 품질
6. 저장: `원본명_bg.png` 등. 공용 `export.ts`를 쓴다.

**안내 문구(안)**
- 「이미지는 서버로 전송되지 않고 브라우저에서 처리됩니다.」
- 「처음 사용할 때 AI 모델(약 90MB)을 내려받습니다. 이후에는 저장된 모델을 사용합니다.」
- 「경계가 복잡한 이미지(머리카락·털·투명한 물체)는 결과가 완벽하지 않을 수 있습니다.」

---

## 3. P0 — 모델 PoC 결과 (✅ 2026-10-01)

**방법**
- 세션 스크래치에 PoC 페이지를 만들어 헤드리스 Chrome(puppeteer-core)으로 실행했다. 프로젝트 파일은 바꾸지 않았다.
  - 실행기: onnxruntime-web 1.30.0
  - 측정 PC: Apple M2(8코어)
- 샘플 5장(사용자 제공 `public/test-img/`, §5 Q3 참고)
  - 01 고양이(털), 02 컵·숟가락(제품, 흐린 배경), 03 인물 2명(머리카락), 04 공룡 일러스트(흰 배경·그림자), 05 수박 일러스트(평면 배경)
- 처리 시간은 전처리 + 추론 + 후처리 합계로, 첫 이미지 워밍업 뒤 값이다. 모델 다운로드는 제외했다.

**후보·출처·라이선스**

| 후보 | 용량 | 라이선스 | 출처(브라우저 CORS) |
| --- | --- | --- | --- |
| ISNet general-use fp32 | 179MB | Apache-2.0(xuebinqin/DIS) | rembg GitHub 릴리스(**CORS 없음 → 브라우저 불가**) |
| | | | HF `skillsafe-ai/isnet-general-use`(CORS 허용, 공식 파일과 SHA-256 동일) |
| ISNet fp16 | 90MB | Apache-2.0 | HF `SoyJB/isnet-general-use-fp16`, `chillenow/isnet-general-use-onnx`(개인 저장소, §5 Q1) |
| ISNet int8 | 44MB | MIT 표기(변환 저장소) | HF `xrds/isnet-general-onnx-int8` |
| U²-Net | 176MB | Apache-2.0(rembg: MIT) | rembg GitHub 릴리스 / HF 미러 |

**품질**: ISNet이 우세하다.
- 고양이 털·수염, 머리카락 경계를 ISNet은 부드럽게 살린다. U²-Net은 경계를 딱딱하게 자르고 잔털·수염을 잃는다.
- 공룡 발밑 그림자를 ISNet은 거의 지운다. U²-Net은 그림자를 반쯤 남긴다.
- 컵·숟가락, 수박(접시 포함)은 둘 다 양호하다.
- 공통 과제: 고양이 귀처럼 배경색(빨간 깃발)이 경계에 번지는 **색 번짐(fringe)** → P3 경계 다듬기에서 다룬다.

**처리 시간(장당, M2)**

| 모델 | WebGPU | WASM 4스레드(교차 출처 격리) | WASM 1스레드 |
| --- | --- | --- | --- |
| ISNet fp32 | 0.53초* | 2.4초 | 7.7초 |
| **ISNet fp16** | **0.38초*** | 2.4초 | (fp32와 비슷) |
| ISNet int8 | 0.53초* — **결과 깨짐** | 2.3초 | 7.7초 |
| U²-Net | 실행 불가(Transpose 오류) | 0.85초 | 2.8초 |

\* `ceil_mode` 보정(T4) 후. 보정하지 않으면 WebGPU 세션 생성이 실패한다.
- 모델 세션 생성: 0.2~0.9초

**정확도(ISNet fp32·WASM 대비 알파 평균 오차 / 오차 32 초과 픽셀 비율)**
- fp16: WASM 0.00% / 0% · WebGPU 0.00~0.02% / 0%
- int8: WASM 0.02~0.15% / 0% · **WebGPU 13~42% / 13~43%(깨짐)**
- U²-Net: 0.2~1.3% / 0.6~3.4%(경계 차이)

**결론·주의**
- ISNet fp16 + WebGPU 우선이면 5초 기준을 여유 있게 만족한다.
- WASM 대체 경로는 **멀티스레드여야** 목표 근처가 된다(M2 기준 2.4초 — 일반 사무용 PC는 이보다 느릴 수 있다).
  - 멀티스레드는 페이지가 **교차 출처 격리**(COOP/COEP 헤더) 상태여야 동작한다. 격리가 없으면 1스레드로 떨어져 7초 이상 걸린다(§5 Q4).
- 측정은 M2 헤드리스 환경 기준이다. **실제 사무용 PC(Windows·내장 GPU) 측정은 P1 개발망 배포 후** 한다(처리 시간을 화면에 표시해 확인).

---

## 4. 구조 (P1 기준)

- 순수 로직 `lib/toolbox/background-editor/`
  - `model.ts`: ORT 버전·CDN wasm 주소, 모델 URL·SHA-256·용량 상수
    - `loadModelBytes`: Cache Storage(`toolbox-bg-model-v1`) 확인 → 없으면 진행률과 함께 내려받기 → SHA-256 확인 → 캐시 저장. 캐시가 손상되면 지우고 다시 받는다.
    - `patchCeilMode`: `ceil_mode` 바이트 보정(§1 T4)
  - `mask.ts`: 전처리 `toInputTensor`(최대값 정규화 −0.5, NCHW), 후처리 `toAlphaMask`(min-max → 0~255) — 순수 함수
  - `cutout.ts`: 캔버스 처리 — `prepareModelInput`(1024² 리사이즈 → 텐서), `applyAlphaMask`(마스크를 원본 크기로 늘려 알파 적용)
  - `inference.worker.ts` + `protocol.ts` + `engine.ts`: 추론 Worker와 메인 쪽 래퍼(`BackgroundEngine` — 요청/응답 Promise)
    - Worker 안에서 WebGPU 세션을 먼저 시도하고, 실패하면 WASM으로 만든다.
    - 멀티스레드는 교차 출처 격리가 있을 때만 켠다(현재 1스레드, §5 Q4).
  - vitest `background-editor.test.ts` 11건: ORT 버전 일치, URL 고정, 바이트 보정(개수·길이 불변·경계), SHA-256, 전·후처리 수치
- UI `components/toolbox/background-editor/`
  - `use-background-removal.ts`: 모델 상태(내려받기·확인·준비·완료·취소·오류) + 배경 제거 상태(단계·완료·오류) 훅
    - 처음 이미지를 불러올 때 모델을 준비한다. 새 이미지를 열면 이전 작업 결과는 버린다.
    - WebGPU 실행이 실패하면 CPU 세션으로 다시 만들어 한 번 재시도한다.
  - `BgProgressCard.tsx`: 작업 영역 가운데 진행 카드(§6 P1)
  - `BgPreview.tsx`: 화면 맞춤 표시(체크무늬, 처리 중 원본 흐리게). 줌·전후 비교는 P3
  - `BgSidePanel.tsx`: 처리 정보·이미지 정보·저장(PNG)
  - `BackgroundEditorPage.tsx`: 불러오기(클릭·드롭·붙여넣기)·Sheet·저장
- 라우트 `app/(dashboard)/toolbox/background-editor/page.tsx`·`layout.tsx`(`segmentPageMetadata('배경 편집')`). 사이드바 메뉴는 P4에서 등록한다.
- 의존성: `onnxruntime-web` **1.30.0 고정**(MIT). Worker에서만 import한다.
  - 버전을 올릴 때는 `model.ts`의 `ORT_VERSION`도 함께 바꾼다. 테스트가 둘의 일치를 확인한다.
- 빌드 설정(`next.config.js`, 클라이언트만)
  - `onnxruntime-web$` 별칭 → `dist/ort.min.mjs`: wasm을 번들에 넣지 않는 빌드다. 기본 진입점은 약 25MB wasm을 빌드 산출물로 복사한다.
  - ORT `.mjs`에 `parser.url: false`: ORT가 자기 위치를 `new URL('ort.min.mjs', import.meta.url)`로 구하는데, webpack이 이를 정적 자원으로 복사하면 프로덕션 Terser가 `import.meta` 오류로 실패한다.
- `tailwind.config.ts`: `animate-progress-indeterminate`(진행률을 모르는 막대)

---

## 5. 미결 항목 — ✅ 모두 확정(2026-10-01)

- Q2: **90MB 허용**
- Q3: 샘플 이미지 **`docs/test-img/`로 이동**하고 `.gitignore`에 추가했다(로컬 전용).
- Q4: **(B) 격리 없이 1스레드**로 간다. 개발망에서 CPU로 처리되는 PC가 많고 너무 느리면 (A) 헤더를 추가한다(추가해도 다시 만들 부분 없음).
  - (A)를 보류한 이유: 격리 상태는 클라이언트 이동으로 다른 메뉴에도 남는다. 그 상태에서 갤러리의 유튜브 iframe(`MediaPlayerDialog`) 같은 외부 iframe이 막힐 수 있다.
- 진행 표시: **작업 영역 가운데 진행 카드**를 쓴다. 토스트는 완료·오류 알림에만 쓴다. 모델은 처음 이미지를 불러올 때 내려받는다.

아래는 논의 기록이다.

- **Q1. 모델 파일을 올려 둘 Hugging Face 저장소 — ✅ 해결(2026-10-01, A안)**
  - 사용자 계정에 올렸다: https://huggingface.co/tiper-penta/isnet-general-use-fp16 (Public, Gated 없음, apache-2.0)
  - 커밋 `edcb78a6822640f4c2a1e6c9aa0ca6abab60a674`
  - 고정 URL: `https://huggingface.co/tiper-penta/isnet-general-use-fp16/resolve/edcb78a6822640f4c2a1e6c9aa0ca6abab60a674/isnet-general-use-fp16.onnx`
  - 확인 결과: CORS 허용(`access-control-allow-origin: *`), 90,661,254바이트, SHA-256 `1e00f2f0…159b18f0` 일치
  - (논의 기록) fp16 파일이 있는 HF 저장소 2곳은 모두 **2026-09-29에 개인이 만든 저장소**(다운로드 0회)다. 운영망에서 쓰다가 저장소가 삭제되면 기능이 멈춘다.
  - (A, 추천) **회사/팀 HF 계정에 저장소를 만들어** fp16 파일을 올린다.
    - Apache-2.0이라 재배포할 수 있다. LICENSE와 출처(DIS·rembg)를 표기한다.
    - 코드에는 커밋 해시로 고정한 URL과 SHA-256 검증을 넣는다.
  - (B) 개인 저장소 URL을 커밋 해시로 고정해 쓰고, SHA-256 검증을 넣는다. 추가 작업은 없지만 삭제 위험이 남는다.
  - (C) 공식 파일과 같은 fp32(179MB, `skillsafe-ai` 미러)를 쓴다. 첫 다운로드가 2배이고 역시 개인 미러다.
- **Q2. 첫 다운로드 용량 약 90MB 허용 여부**
  - 성능 기준 항목의 「다운로드 허용 용량」은 아직 정하지 않았다.
  - 44MB(int8)는 WebGPU에서 깨지므로 90MB가 품질을 유지하는 최소 용량이다.
- **Q3. 샘플 이미지 위치**
  - 현재 `public/test-img/`에 있고 git 미추적 상태다.
  - `public/`은 배포 시 누구나 `/test-img/…`로 열 수 있는 경로다(운영망 공개 예정). **`docs/test-img/`로 옮기고 git에는 올리지 않는 것**(`.gitignore`)을 제안한다.
- **Q4. WASM 대체 경로의 멀티스레드(교차 출처 격리)**
  - (A, 추천) 이 페이지에만 `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: credentialless` 헤더를 준다(`next.config.js` `headers()`).
    - 사이드바에서 이 메뉴로 올 때는 **전체 페이지 이동**(Next `Link` 대신 `<a>`)으로 연다. 클라이언트 이동은 헤더가 적용되지 않는다.
  - (B) 격리 없이 1스레드로 둔다. WebGPU 미지원 브라우저에서만 느리고(M2 기준 7.7초), 「느릴 수 있음」을 안내한다.

---

## 6. Phase 계획 (안)

| Phase | 내용 | 상태 |
| --- | --- | --- |
| P0 | 모델 PoC(품질·속도·용량·라이선스 비교) | ✅ 2026-10-01 |
| P1 | 라우트 골격(메뉴 미노출) + `onnxruntime-web` + 모델 다운로드(진행률·캐시·SHA-256·`ceil_mode` 보정) + Worker 추론 + **배경 제거 → 투명 PNG 저장** + 처리 시간·백엔드 표시 → **개발망에서 사무용 PC 속도 측정** | 🟡 로컬 검증 완료, 개발망 확인 대기 |
| P2 | 배경 교체(투명·단색·이미지) + 저장 형식(JPG/WebP·품질) | ⬜ |
| P3 | 경계 다듬기(부드럽게·강도, 색 번짐 완화) + 줌·화면 이동 (전·후 비교는 P1 보완에서 완료) | ⬜ |
| P4 | 반응형(Sheet)·접근성·QA + 오류 처리(다운로드 실패·메모리 부족) + **사이드바 메뉴 노출** + 개발망 확인 | ⬜ |

각 Phase: 구현 → typecheck·lint·vitest·로컬 E2E(결과 알파 픽셀 확인) → 사용자 확인 → 다음 Phase

### P1 — 모델 로딩 + 배경 제거 → 투명 PNG (🟡 2026-10-01)

**동작**
- 이미지를 불러오면 바로 배경 제거를 시작한다. 처음이면 모델부터 내려받는다.
- 진행 카드(작업 영역 가운데, 원본은 흐리게 깔아 둔다)
  - 내려받기: 실제 진행률 막대 + 「45.3 / 90.7MB (50%)」 + 「처음 한 번만 내려받고…」 + **취소**
  - 확인·준비: 「AI 모델 확인 중… / 준비 중…」 + 진행 중 막대
  - 배경 제거: 단계 ① 이미지 준비 → ② 배경 분석(AI) → ③ 결과 만들기 + 진행 중 막대 + 경과 시간(0.1초 단위)
    - **0.3초 안에 끝나면 카드를 띄우지 않는다**(WebGPU 0.4초 — 깜박임 방지).
    - CPU로 처리하면 「그래픽 가속(WebGPU)을 사용할 수 없어 CPU로 처리합니다…」를 덧붙인다.
  - 취소: 「AI 모델 내려받기를 취소했습니다」 + **다시 내려받기**. 오류: 원인 + **다시 시도**
- 결과: 체크무늬 위 투명 배경. 우측 패널 「처리 정보」에 AI 모델(내려받음/저장된 모델 사용), 실행 방식(그래픽 가속(WebGPU)/CPU), 처리 시간(초)을 표시한다.
- 저장: 「PNG로 저장」 → `원본명_bg.png`(파일명 수정 가능), 원본 해상도 그대로
- 용량은 십진 MB(90.7MB)로 표시한다. Hugging Face 표기와 같다.

**검증(로컬, 2026-10-01)**
- [x] typecheck 0 / lint 0 / vitest toolbox 106건 통과(신규 11건)
- [x] `npm run build` 성공 — 빌드 산출물에 wasm·ORT 복사본이 없음을 확인
- [x] E2E(dev, 헤드리스 Chrome + 테스트 세션 쿠키) **14/14**
  - 비로그인 → /login, 탭 제목 「배경 편집 | Design5」
  - 첫 사용: 진행 카드(MB·%) → 확인 → 준비 → 배경 제거, WebGPU 0.52초
  - 저장 PNG `bg_remove01_bg.png` 489×584(원본 크기), 배경 알파 0, 고양이 알파 255, 투명 비율 0.586
  - 새로고침 후 두 번째: 모델 요청 없음(캐시), 「저장된 모델 사용」, 0.44초 / 페이지 오류 0
- [x] E2E(production `next start`) **14/14** — WebGPU 0.46초
- [x] CPU 대체(`--disable-webgpu`): 「CPU」 표시와 안내, 결과 픽셀 동일, 장당 8.2초(M2, 1스레드)
- [x] 다운로드 취소 → 취소 카드 → 다시 내려받기 → 결과(WebGPU 0.46초)
- [x] 회귀: 이미지 편집·이미지 분할 페이지 로드·이미지 표시 오류 0
- [ ] **개발망(design6)**: 사무용 PC(Chrome·Edge)에서 실행 방식·처리 시간 확인, VDI가 있다면 VDI에서도 확인
- [x] 사용자 로컬 확인(2026-10-01): 품질 만족. 피드백 2건 → 아래 P1 보완

### P1 보완 — 「배경 제거」 버튼 + 원본·결과 비교 (🟡 2026-10-01, 사용자 결정)

이미지를 불러오자마자 배경이 바뀌는 것이 어색하다는 피드백에 따라, 원본을 먼저 보여 주고 버튼으로 실행하게 바꿨다. 원래 P3였던 전·후 비교도 앞당겼다. 확대/축소는 P3에 그대로 둔다.

**버튼(추천안 C)**
- 이미지를 불러오면 **원본만** 보여 준다. 우측 패널 맨 위 「배경 제거」 섹션의 버튼으로 실행한다.
  - xl 미만은 패널이 Sheet 안에 있으므로 작업 영역 아래 가운데에도 같은 버튼을 띄운다(결과가 나오면 숨김).
- 모델은 **처음 버튼을 누를 때** 내려받는다. 첫 사용 전에는 버튼 아래에 모델 용량을 안내한다.
- 버튼 상태(`RemoveBackgroundButton`): 「배경 제거」 → 「처리 중…」(모델 준비·제거 중, 비활성) → 「배경 제거 완료」(비활성)
  - 새 이미지를 열면 처음 상태로 돌아간다(`reset()` — 진행 중 결과는 버림, 모델 내려받기는 계속).
- **취소·오류는 진행 카드 대신 토스트로 알린다**(버튼이 다시 활성화되어 바로 재시도). 진행 카드는 진행 중일 때만 보인다.

**비교(추천 구성)**
- 결과가 나오면 작업 영역 왼쪽 위에 **「원본 | 비교 | 결과」 전환**이 나타난다(기본 「결과」, `role=radiogroup`).
- 「비교」: 왼쪽 원본(`clip-path`) · 오른쪽 결과(체크무늬), 위쪽에 「원본」「결과」 라벨
  - 세로 경계선을 끌어 위치를 바꾼다(히트 폭 24px, 마우스·터치, 이미지 밖으로 나가도 0~100%에서 멈춤).
  - 손잡이는 키보드 슬라이더다(←→ 1%, Shift 10%, Home/End). 새 결과가 나오면 가운데(50%)로 돌아간다.
  - P3에서 화면 이동을 붙일 때 겹치지 않도록, **경계선을 잡았을 때만** 비교 위치가 바뀐다.
- 「원본」: 원본만 / 「결과」: 결과만

**검증(로컬 dev, 2026-10-01)**
- [x] typecheck 0 / lint 0
- [x] E2E 기본 묶음 **23/23**
  - 불러온 직후 자동 실행 없음(원본·카드 없음·버튼 활성·전환 숨김), 버튼 → 결과·「완료」
  - 진행 카드, WebGPU 0.47초, PNG 픽셀
  - 비교 50%·라벨, 경계선 드래그 25%(밖으로 나갔다 돌아와도 정상), 방향키 +1/+10, 원본·결과 보기
  - 캐시 재사용 0.44초, 페이지 오류 0
- [x] E2E 추가 묶음 **8/8**
  - 새 이미지 → 원본 상태로 초기화(처리 시간 「-」)
  - 1024px 폭: 하단 버튼 표시 → 실행 → 결과, 완료 후 숨김
  - 다운로드 중 버튼 「처리 중」 → 취소 → 카드 닫힘·토스트·버튼 재활성 → 다시 눌러 결과
- [ ] 사용자 확인

---

## 7. 수동 QA 체크리스트 (P4에서 채움)

- [ ] 사무용 Windows PC(Chrome·Edge) WebGPU 처리 5초 이내
- [ ] WebGPU 미지원 환경 WASM 대체 동작·안내
- [ ] 첫 다운로드 진행률 → 두 번째 방문 시 다시 받지 않음
- [ ] 샘플 5장 품질(털·머리카락·그림자·일러스트)

---

## 8. 변경 파일

- P0: `docs/TOOLBOX_background-editor_handoff.md`(신규), `docs/TOOLBOX_handoff.md`(로드맵·상태 갱신). 코드 변경 없음(PoC는 세션 스크래치에서만 실행)
- P1
  - 신규 `lib/toolbox/background-editor/`: `model.ts`, `mask.ts`, `cutout.ts`, `protocol.ts`, `engine.ts`, `inference.worker.ts`, `background-editor.test.ts`
  - 신규 `components/toolbox/background-editor/`: `BackgroundEditorPage.tsx`, `BgPreview.tsx`, `BgProgressCard.tsx`, `BgSidePanel.tsx`, `use-background-removal.ts`
  - 신규 `app/(dashboard)/toolbox/background-editor/page.tsx`, `layout.tsx`
  - 수정: `package.json`·`package-lock.json`(`onnxruntime-web` 1.30.0), `next.config.js`(ORT 별칭·parser), `tailwind.config.ts`(진행 막대 애니메이션), `.gitignore`(`/docs/test-img/`)
  - 이동: `public/test-img/` → `docs/test-img/`(git 미추적)
- P1 보완: 신규 `components/toolbox/background-editor/RemoveBackgroundButton.tsx`. 수정 `BackgroundEditorPage.tsx`(버튼 실행·보기 전환·토스트), `BgPreview.tsx`(원본/비교/결과·경계선), `BgProgressCard.tsx`(진행 중만), `BgSidePanel.tsx`(배경 제거 섹션), `use-background-removal.ts`(`reset`)
