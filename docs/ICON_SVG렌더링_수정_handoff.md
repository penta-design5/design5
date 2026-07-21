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

---

## 9. ICON 탭 14개 그룹 필터 메뉴 + 섹션 헤더

> 상태: **구현·개발망 검증 완료(2026-07-21).**
> 작성일: 2026-07-21
> 확정 결정: (1) 저장=방식 A(`subtitle`), (2) 업로드=그룹 드롭다운, (3) ALL 화면에 그룹 **섹션 헤더** 포함.

### 9-0. 구현 요약 (완료)
- **단일 소스** [lib/icon-groups.ts](../lib/icon-groups.ts): 14그룹 순서 배열 `ICON_GROUPS`, `ICON_GROUP_ALL`, `isIconGroup()`.
- **저장(방식 A)**: 그룹 슬러그를 `Post.subtitle`에 저장. **스키마 변경 없음.**
- **업로드** [IconUploadDialog.tsx](../components/category-pages/IconCategory/IconUploadDialog.tsx): 그룹 **드롭다운(필수)** 추가 → `group`을 formData로 전송. [upload-icon/route.ts](../app/api/posts/upload-icon/route.ts)가 `isIconGroup`으로 검증 후 `subtitle`에 저장.
- **목록/필터** [IconTab.tsx](../app/_category-pages/icon/IconTab.tsx):
  - 아이콘 전량 로드(`/api/posts`를 `limit=100`으로 페이지 순회, `hasMore=false`까지) → 무한 스크롤 제거. (383개 소규모라 클라이언트에서 그룹/검색/섹션 처리.)
  - 탭·검색바 아래 **`HorizontalScrollEdgeFades`** 가로 스크롤 필터 메뉴(**ALL + 14 = 15개**, CI/BI와 동일 스타일).
  - `ALL` 선택 시 **그룹별 섹션 헤더 + 그리드**(그룹명 + 개수). 특정 그룹 선택 시 단일 그리드.
  - 그룹 미분류(subtitle이 14그룹 밖) 아이콘은 ALL 화면 맨 뒤 **"기타"** 섹션에 모아 표시(데이터 유실 방지). 백필·필수 드롭다운으로 정상적으로는 발생하지 않음.
  - 그룹 필터 + 검색어는 AND 결합.
- **백필** [scripts/backfill-icon-groups.ts](../scripts/backfill-icon-groups.ts) + [scripts/icon-group-map.json](../scripts/icon-group-map.json)(name→group, 383개): 기존 아이콘 `Post.title` 매칭해 `subtitle` 채움. npm: `db:backfill-icon-groups[:dry]`.

### 9-B. ⚠️ 배포·데이터 채우기 (권장: 그룹별 재업로드 → 백필 불필요)

**핵심: 그룹은 이제 업로드 시 드롭다운으로 자동 저장(`subtitle`)된다. 그룹별로 재업로드하면 백필이 필요 없다.**

1. 코드 배포(`git push` → 서버 `pull`) 후 **리빌드**. **스키마 변경 없어 `migrate deploy` 불필요.**
   ```bash
   cd /data/webapps/design5 && git pull
   cd deploy/rocky
   docker compose -f docker-compose.yml -f docker-compose.app.yml --env-file .env.app up -d --build app
   ```
2. **그룹별 재업로드** (권장): 리빌드 후 업로드 다이얼로그에서 **그룹 드롭다운 선택 → 해당 그룹 폴더 SVG 업로드**를 14그룹 반복. 그룹이 바로 저장되어 필터·섹션에 반영.
   - **개발망(design6)에서 이 방식으로 검증 완료.**
   - 운영망(design5)도 동일 방식 권장. (운영망은 곧 외부 공개 예정 → [ICON_이름동기화_handoff.md §5](ICON_이름동기화_handoff.md) 백업·승인 체크리스트 준수)

#### (보조) 백필 — "이미 그룹 없이 올라간 새-이름 아이콘"을 나중에 보정할 때만
- 대상 아이콘이 **새 383개 이름**(`check-circle`, `car-front-connected` …)으로 이미 업로드돼 있고 `subtitle`만 빈 경우에 사용. (옛 이름 `abs`·`car-front1` 등은 매칭 안 됨 → 재업로드로 처리.)
- ⚠️ **개발망 호스트엔 node/npm이 없고**(앱은 `output: 'standalone'` 이미지라 컨테이너에도 `tsx`/스크립트 없음), **로컬에서 DB 터널로** 실행한다:
  ```bash
  # 로컬에서 개발망 DB 터널 연결 (design6)
  ssh -N -L 15432:127.0.0.1:5432 -L 19000:127.0.0.1:9000 -p 6022 design@192.168.1.43
  # 로컬 .env의 DATABASE_URL이 127.0.0.1:15432(=개발망 DB)를 가리키는 상태에서
  npm run db:backfill-icon-groups:dry   # 미리보기(매칭/누락 확인)
  npm run db:backfill-icon-groups       # 실제 반영
  ```
  - 매핑 출처: [scripts/icon-group-map.json](../scripts/icon-group-map.json) (name→group 383개).
  - 백필 전에는 기존 아이콘이 ALL의 "기타" 섹션에 몰려 보인다(정상, 반영 후 14그룹으로 분산).

### 9-C. (참고) 아래는 최초 설계 계획 원문

> 상태: 설계 완료, 구현 착수 전(당시). 아래는 계획 원문 보존.
> 작성일: 2026-07-21

### 9-1. 목표
- ICON 탭에 **그룹 필터 메뉴**를 추가해 그룹별로 아이콘을 볼 수 있게 한다.
- 필터는 **`ALL` + 14개 그룹 = 총 15개**. 표기는 **영문 슬러그만** 사용.
- 배치·스타일은 **CI/BI 등 다른 페이지와 동일**하게 탭(헤더) 아래, 검색/액션 바 밑에 가로 스크롤 한 줄로.

### 9-2. 14개 그룹 (영문 슬러그, [ICON_이름동기화_handoff.md](ICON_이름동기화_handoff.md) §6 기준)
`ai(3) · automotive(23) · device(48) · finance(25) · general(94) · medical(3) · misc(16) · people(19) · place(21) · security(23) · server(25) · traffic(29) · vehicle(53) · weather(1)` — 합계 **383**.
- Figma 섹션명은 "한글: 영문"(예: `차량: vehicle`) 형태였고, 추출 시 콜론 뒤 **영문 슬러그**만 폴더명으로 사용했다. 필터도 이 영문 슬러그를 그대로 쓴다.

### 9-3. 가능 여부 / 핵심 전제
- **가능. DB 스키마 변경 없음.** 그룹값은 `Post`의 여유 필드에 저장한다.
- ⚠️ **핵심 전제 — 백필 필요**: 현재 업로드된 383개 `Post`에는 **그룹 정보가 저장돼 있지 않다**([upload-icon/route.ts](../app/api/posts/upload-icon/route.ts)는 title/fileUrl 등만 저장). 따라서 기존 아이콘에 그룹값을 채워 넣는 **일회성 백필 작업**이 선행돼야 한다.
- **name→group 매핑의 유일 출처**: 라이브러리 JSON에는 카테고리 정보가 없다. 매핑은 **추출 폴더 구조** `~/Downloads/Test(또는 백업)/penta-icons/<group>/<name>.svg` 또는 Figma 섹션에서만 얻는다. 백필 스크립트는 `Post.title == <name>` 기준으로 그룹을 채운다.

### 9-4. 데이터 모델 결정 (택1)
| 방식 | 저장 위치 | 서버 필터 | 장점 | 단점 |
|------|-----------|-----------|------|------|
| **A (권장)** | `Post.subtitle`에 그룹 슬러그 | `/api/posts`에 `group`(=subtitle) 필터 파라미터 소량 추가 | 태그 테이블 안 건드림, 마이그레이션 없음, 행 증가 없음 | API에 필터 1개 추가 |
| B (CI/BI 완전 동일) | `Tag` 14개 + `PostTag` 연결 | 기존 `tag` 필터 그대로 사용(**API 무변경**) | CI/BI와 동일 메커니즘, 캐시 재사용 | Tag 14 + PostTag 383행 생성, 관리 포인트 증가 |

- **권장: A.** 소규모(383개)라 여유 필드 저장이 가장 단순하고 마이그레이션·행 증가가 없다. (`concept` 재사용도 가능하나 의미 혼동을 피해 `subtitle` 권장.)
- 어느 쪽이든 `/api/posts` 응답은 이미 `subtitle`/`concept`/`tags`를 반환하므로 프론트에서 그룹값을 받는 데 추가 작업 없음.

### 9-5. 신규 업로드 시 그룹 지정 (별도 결정 필요)
현재 업로드 다이얼로그는 그룹 개념이 없다. 앞으로 올릴 아이콘의 그룹을 정하는 방법:
- **(권장) 업로드 다이얼로그에 그룹 선택 드롭다운 추가** — 한 번 업로드 배치에 그룹 1개 지정 → [upload-icon/route.ts](../app/api/posts/upload-icon/route.ts)가 `categorySlug`와 함께 `group`을 받아 `subtitle`에 저장.
- 대안: 폴더 업로드(`webkitdirectory`)로 상위 폴더명을 그룹으로 자동 인식. (구현 복잡도 ↑)

### 9-6. 구현 단계 (P 단위)
1. **P1 — 데이터 준비(백필)**: 일회성 스크립트로 폴더 `penta-icons/<group>/<name>.svg` → `Post.title` 매칭하여 `subtitle=group` 채움. 매칭 실패(폴더에 없는 title) 목록 리포트. **개발망(design6)에서 먼저, 검증 후 운영망(design5)에서 동일 실행**(데이터라 배포로 안 옮겨짐).
2. **P2 — API**: `/api/posts` GET에 `group` 파라미터 추가 → `where.subtitle = group` (방식 A). (방식 B면 이 단계 불필요.)
3. **P3 — 프론트(IconTab)**: `selectedGroup` 상태(기본 `ALL`) 추가, [IconTab.tsx](../app/_category-pages/icon/IconTab.tsx)의 검색/액션 바(현재 515~589행) 아래에 **`HorizontalScrollEdgeFades`**([components/ui/horizontal-scroll-edge-fades.tsx](../components/ui/horizontal-scroll-edge-fades.tsx)) + 버튼 15개 렌더(CI/BI [CiBiListPage.tsx](../app/_category-pages/ci-bi/CiBiListPage.tsx) 539~557행과 동일 마크업). 그룹 변경 시 `fetchPosts` 재호출(또는 클라 필터). 검색어와 AND 결합.
4. **P4 — 업로드 그룹 지정**: 업로드 다이얼로그에 그룹 드롭다운(14개) 추가 + 라우트에서 `subtitle` 저장(9-5).
5. **P5 — 개발망 검증 → 운영망 반영.**

### 9-7. 페이지네이션 주의
IconTab은 50개씩 무한 스크롤이다. 그룹 필터는 **서버 사이드**(그룹 파라미터로 재조회, CI/BI처럼 필터별 캐시)로 하는 것이 페이지네이션과 정확히 맞는다. (383개 전량 로드 후 클라 필터도 가능하나, 현재 페이지네이션 구조를 바꿔야 하므로 서버 필터 권장.)

### 9-8. 미결정 / 확인 필요
- [ ] 그룹 저장 방식 A(subtitle) vs B(tag) 최종 결정.
- [ ] 신규 업로드 그룹 지정 UX(드롭다운 vs 폴더 업로드).
- [ ] 필터 선택 시 "해당 그룹만 표시"만 할지, 추가로 그룹 **섹션 헤더**(ALL에서 그룹별 구분 표시)까지 넣을지. (이번 요청 범위는 필터 15개.)
- [ ] `misc`, `ai` 등 소수 그룹 라벨을 영문 슬러그 그대로 둘지, 표기 다듬을지.
- [ ] 백필 스크립트가 참조할 폴더 경로 확정(운영 실행 시점 기준).

### 9-9. 검증 체크리스트
- [ ] 백필 후 383개 모두 그룹값 존재, 그룹별 개수 = §9-2와 일치.
- [ ] 필터 15개 렌더·전환 정상, `ALL`은 전체.
- [ ] 그룹 필터 + 검색어 동시 적용 정상.
- [ ] 무한 스크롤이 필터 상태와 맞물려 정상 동작(중복/누락 없음).
- [ ] 신규 업로드 시 지정 그룹으로 저장·필터 반영.
