# CI/BI 원본 색상 + 업로드 브랜드 색 검사 — handoff

## 목적
- 심볼+텍스트 결합 로고(예: Cloudbric = #3948e5 심볼 + 검정 텍스트)를 **업로드한 색 그대로** 쓸 수 있게 BI 속성 패널에 "원본 색상" 버튼 추가.
- 심볼만 올린 경우 "원본" = 단일색(#3948e5) → [원본 / 검정 / 흰색] 3가지.
- 브랜드 색이 조금이라도 다르면(#3a49e4 등) **업로드 시점에 경고**(업로드는 막지 않음).

## 상태 (2026-11-04)
- [x] 구현, 로컬 typecheck·lint(신규 경고 0)·단위 테스트(`lib/ci-bi/brand-colors.test.ts` 29건) 통과
- [ ] 개발망(design6) 검증
- [ ] 운영망 반영
- DB 마이그레이션 없음

## 변경 파일
| 파일 | 내용 |
|---|---|
| `lib/ci-bi/brand-colors.ts` (신규) | 브랜드 색 상수 `CI_BI_BRAND_COLORS`, `ORIGINAL_COLOR`, 표기 통일 `normalizeSvgColor`, 브랜드 외 색 `findOffBrandColors`, 실제 보이는 색 추출 `getRenderedSvgColors` |
| `lib/ci-bi/brand-colors.test.ts` (신규) | 단위 테스트 |
| `components/category-pages/CiBiCategory/PropertyPanel.tsx` | BI 색상에 "원본" 버튼 추가(맨 앞). 견본은 원본 SVG에서 추출한 색(1색=단일, 여러 색=분할, 최대 4칸) |
| `components/category-pages/CiBiCategory/CiBiCard.tsx` | `ORIGINAL`이면 색 변환 없이 원본 SVG 표시 |
| `app/api/posts/[id]/ci-bi/download/route.ts` | `color=ORIGINAL`이면 색 변환 생략 |
| `components/category-pages/CiBiCategory/CiBiUploadDialog.tsx` | SVG 선택 시 브랜드 색 검사 → 주황 경고 박스(브랜드 외 색 hex·견본, 허용 색 목록) |

## 동작 메모
- 브랜드 색 추가: `CI_BI_BRAND_COLORS`에 `{ hex: '#xxxxxx'(소문자 6자리), name }` 추가.
- 색 추출 우선순위: 인라인 style > `<style>` 규칙(나중 규칙 우선, 명시도 미계산) > fill/stroke 속성 > 부모 상속 > 기본값(fill 검정). `defs`·`clipPath`·`mask` 등 내부와 `display:none`·`opacity:0`은 제외. 그라디언트(`url(...)`)는 검사 대상 아님.
- "원본" 버튼은 **BI만**. CI는 기존 [CI 컬러 세트 / 검정 / 흰색] 유지. Cloudbric 로고는 BI로 업로드(사용자 확인).
- 다른 제품 BI는 별도 브랜드 색 없이 검정만 사용(사용자 확인, 2026-11-04) → 현재 상수로 충분.
- BI 기본 선택 색은 기존대로 검정(`CiBiListPage.tsx`). 다운로드 파일명은 원본이면 접미사 없음.

## 개발망 검증 체크리스트
- [ ] BI 게시물 선택 → 속성 패널 첫 버튼에 원본 색 견본(Cloudbric 결합: 파랑|검정 2칸, 심볼만: 파랑 1칸)
- [ ] 원본 선택 시 카드 미리보기·PNG/JPG/SVG 다운로드가 업로드 색 그대로
- [ ] 검정/흰색 선택 시 심볼+텍스트 전체가 단색(벽돌 knockout 유지)
- [ ] 업로드 대화상자: 브랜드 색만 있는 SVG → 경고 없음 / #3a49e4 등 포함 SVG → 경고 표시, 업로드는 가능
- [ ] 일러스트레이터 export(`<style>.cls-1{fill:…}`)·피그마 export(속성) SVG 모두 견본·경고 정상
- [ ] CI 게시물 동작 변화 없음
