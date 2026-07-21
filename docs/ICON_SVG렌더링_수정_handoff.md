# ICON 탭 SVG 렌더링·다운로드 깨짐 수정 — handoff

> 작성일: 2026-07-21
> 대상: 레거시 **ICON 탭**(`Post` 모델 기반). ICON+ 탭(`IconPlusResource`)은 정상 동작하던 참고 레퍼런스.
> 상태: **수정·검증 완료.** (typecheck/lint 통과, SVG 유닛 테스트 25개 통과, 아이콘 383개 전수 검증 통과)
> 관련 문서: [ICON_이름동기화_handoff.md](ICON_이름동기화_handoff.md)

---

## 1. 증상

ICON 탭의 기존 아이콘을 모두 삭제하고, [이름 동기화 작업](ICON_이름동기화_handoff.md)으로 Figma에서 추출한 새 아이콘(383개)을 업로드한 뒤:

- **목록에서 일부 아이콘만 이상하게 표시**됨.
- **아이콘을 다운로드해서 열면 XML 에러**(`attributes construct error`)가 나고, **일러스트레이터에서도 열리지 않음.**

## 2. 근본 원인 (한 가지)

색상·속성을 바꾸는 **정규식이 self-closing 태그 `<path .../>`를 처리하지 못함.** `fill="none"`을 태그 끝의 `/` **뒤에** 붙여 XML을 깨뜨렸다.

```
변환 전:  <path d="..." stroke="currentColor" stroke-miterlimit="5"/>
변환 후:  <path d="..." stroke="#000000" stroke-miterlimit="5"/ fill="none" stroke-width="1">
                                                          ^^^ "/ fill=" → 깨진 XML
```

### 왜 이전 아이콘은 괜찮았나 (형식 차이)
- **옛 아이콘(일러스트레이터 export)**: 모든 `<path>`에 이미 `fill="#000000"`이 있어 `fill="none"` 추가 분기가 실행되지 않음 → 무사.
- **새 아이콘(Figma export)**: `<path>`에 fill 없이 `stroke`만 있어 분기가 발동 → 깨짐.

### 왜 ICON+ 탭은 안 깨졌나
ICON+는 업로드 시 `processSvgFile`에서 `sanitize-html`로 **재직렬화**하면서 self-closing `<path .../>`가 `<path ...></path>`로 바뀐다. → 뒤따르는 정규식이 `/`를 만날 일이 없어 안전. (ICON 탭은 원본을 그대로 저장해 self-closing이 남아 있었음.)

## 3. 두 가지 증상이 한 원인으로 설명됨
- **다운로드 실패 / 일러스트레이터 안 열림**: 다운로드는 `image/svg+xml`로 반환 → 브라우저·일러스트레이터의 **엄격한 XML 파서**가 깨진 태그에서 즉시 에러.
- **목록에서 일부만 이상하게 보임**: 렌더링도 같은 깨진 SVG를 삽입하는데 **HTML 파서는 관대**해 일부만 표시되고 일부는 깨져 보임.

---

## 4. 수정 내용

두 방향을 함께 적용했다. **DB 스키마 변경·마이그레이션 없음.**

### 방향 1 — 정규식의 self-closing 처리 교정 (근본 수정)
`<(tag)([^>]*?)>` → `<(tag)([^>]*?)(\/?)>`로 바꿔 self-closing `/`를 별도 캡처·보존하고, 새 속성은 `/` **앞**에 삽입한다. (이미 정상인 `stroke.ts`·`icon-plus-properties.ts`와 동일한 패턴.)

- [lib/svg/color.ts](../lib/svg/color.ts) — `changeAllSvgColors` 5단계
- [lib/svg/properties.ts](../lib/svg/properties.ts) — `changeIconSvgProperties` 4단계
- [components/category-pages/IconCategory/IconCard.tsx](../components/category-pages/IconCategory/IconCard.tsx) — 목록 렌더 4단계

### 방향 2 — 업로드 시 sanitize/normalize 적용 (예방 안전망, ICON+와 동일 파이프라인)
- [lib/svg/process-svg.ts](../lib/svg/process-svg.ts) — 문자열 기반 코어 `sanitizeAndNormalizeSvg(rawSvg, fileName)`를 분리 export. (기존 `processSvgFile`은 이를 호출하도록 리팩터링, ICON+ 동작 불변.)
- [app/api/posts/upload-icon/route.ts](../app/api/posts/upload-icon/route.ts) — MinIO 업로드 직전 sanitize 적용(정규화된 바이트 저장), `fileSize`를 정규화 후 크기로 기록.

업로드 시 XML 파싱 불가/루트 비-svg 파일은 **400으로 거부**되어, 문제 파일이 저장 단계에서 걸러진다. 정상 SVG는 영향 없음.

## 5. 검증 결과
- 아이콘 383개 전수: 다운로드 변환 통과 시 유효 XML — **방향1만 383/383, 방향2+1 383/383** (수정 전 4/383).
- 기존 SVG 유닛 테스트 **25개 통과**, `typecheck` 에러 0, `lint` 에러 0.

## 6. 배포 시 참고
- **스키마 변경 없음** → `prisma migrate deploy` 불필요. 코드 배포(`git push` → 서버 `pull`)만으로 반영.
- **이미 업로드된(깨져 보이던) 아이콘**: **방향 1만으로 재업로드 없이** 정상 표시·다운로드된다. MinIO 원본은 애초에 유효했고, 깨짐은 렌더/다운로드 시점 변환 때문이었기 때문.
- **앞으로 업로드하는 아이콘**: 방향 2로 self-closing이 원천 제거·검증된 형태로 저장(이중 안전망).
- 검증 순서: 개발망(design6) 확인 → 운영망(design5) 반영.

---

## 7. ⭐ 아이콘 SVG 제작·추출 규칙 (신규 아이콘 추가 시 필독)

신규 아이콘은 **Figma에서 SVG로 추출**하는 것을 기준으로 한다. 우리 업로드 파이프라인이 요구하는 조건은 아래가 전부이며, **Figma 기본 export가 이를 자연스럽게 충족**한다.

### 7-1. 통과 조건 (파이프라인 요구사항)
| 조건 | 설명 |
|------|------|
| 올바른 SVG(XML) 문법 | 태그 짝이 맞는 정상 SVG |
| 맨 바깥이 `<svg>` 태그 | 루트가 svg여야 함 |
| `viewBox` 또는 width/height 존재 | 크기 정보 필요 (Figma는 viewBox 포함) |
| 외부 URL·JavaScript 없음 | `http(s)://` 이미지 링크, 스크립트 금지 |
| 파일 크기 작음 | ≤ 1MB (라인 아이콘은 보통 수 KB) |

### 7-2. Figma에서 export할 때 (권장 흐름)
1. **단색 라인/면 아이콘**으로 디자인. 앱은 아이콘 전체를 **한 가지 색**으로 다시 칠하므로, 두 가지 색/그라데이션은 하나로 뭉개진다. (색은 무엇으로 export하든 상관없음 — 앱이 렌더 시 재색상.)
2. **텍스트는 아웃라인(윤곽선) 변환** 후 export. 폰트는 파일에 담기지 않아, 텍스트로 두면 보는 환경마다 다르게 표시된다.
3. **비트맵 이미지 넣지 않기**. SVG 안에 박은 사진(`<image>`)은 sanitize에서 제거된다. 순수 벡터(선/도형)로만.
4. **파일명 = 아이콘 이름**. 업로드 시 파일명(`.svg` 제외)이 그대로 아이콘 이름(`Post.title`)이 된다. `a-z0-9-` 위주로.
5. export → ICON 탭 관리자 업로드 다이얼로그에 그대로 드래그/선택.

> 참고: 이번 383개는 Figma 파일 `zIICDqUtkcbUx95w1WalS5`(Penta Design System)에서 REST API로 추출했다. 재현 방법은 [ICON_이름동기화_handoff.md §6](ICON_이름동기화_handoff.md) 참고.

### 7-3. ⚠️ 일러스트레이터에서 제작할 경우 주의사항
일러스트레이터는 색을 **`<style>` 블록 + `class`**(예: `.st0{fill:none;stroke:#000}`) 방식으로 내보내는 경우가 있다. 우리 sanitize는 보안상 **`<style>` 블록을 제거**하므로, 이 방식으로 저장하면 **선/색 정의가 사라져 아이콘이 안 보이거나 깨질 수 있다.**

- ✅ **해결**: 저장(Export/저장) 시 **스타일 옵션을 "프레젠테이션 속성(Presentation Attributes)"으로 지정.** 그러면 Figma처럼 각 요소에 `fill`/`stroke`가 직접 붙어 안전하다.
- ❌ 피할 것: 스타일 옵션 "내부 CSS(Internal CSS)" / "STYLE 요소" → `<style>` + class 방식 → sanitize에서 제거됨.
- 텍스트는 반드시 **윤곽선 만들기(Create Outlines)** 후 export.
- `<image>`(임베드 래스터), `<filter>`, `<use>`, `<symbol>` 등은 sanitize 허용 목록 밖 → 모양이 달라질 수 있으니 사용하지 않는다.

### 7-4. sanitize 허용 요소·속성 (참고)
- 허용 태그: `svg, g, path, rect, circle, ellipse, line, polyline, polygon, text, tspan, defs, clipPath, mask, linearGradient, radialGradient, stop, title, desc`
- 허용 속성: `d, fill, stroke, stroke-width, stroke-linecap, stroke-linejoin, stroke-miterlimit, stroke-opacity, fill-opacity, fill-rule, clip-path, clip-rule, mask, transform, viewBox, width, height, x/y, cx/cy, r, rx/ry, points, opacity, id, class, offset` 등
- 그 외 태그/속성(특히 `<style>`, `style="..."` 인라인, `<image>`, `xlink:href`)은 제거된다.
- 정확한 목록: [lib/svg/process-svg.ts](../lib/svg/process-svg.ts) `allowedSvgTags` / `allowedSvgAttributes`.

---

## 8. 한 줄 결론
- **Figma → SVG export → 그대로 업로드: OK.** 추가 가공 불필요.
- 일러스트레이터 제작 시에는 **"프레젠테이션 속성"으로 export + 텍스트 아웃라인**만 지키면 됨.
- 문제 파일은 업로드 순간 걸러지므로, 잘못 올려 나중에 깨지는 일은 없다.
