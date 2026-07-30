# ICON+ 메인 아이콘 원형 절단(마스킹) 프리셋 구현 계획

> 메인 아이콘을 **완전한 모습으로 업로드·표시**하고, 관리자가 **우측 상단 / 우측 하단 2곳**에 대해
> 마스킹 원(위치·지름)과 병합 앵커를 **프리셋으로 미리 설정**한다.
> 사용자는 완전한 메인 아이콘을 고른 뒤 속성 패널에서 **원하는 프리셋(위치)을 선택**해 병합 결과를 받는다.
> 원본 SVG는 훼손하지 않으며(비파괴), 프리셋은 언제든 수정·초기화할 수 있다.
> **본 문서는 계획서이며 구현 코드는 포함하지 않는다.**

> 📊 구현 진행 상태는 [ICON_PLUS_handoff.md](./ICON_PLUS_handoff.md)에서 관리한다(단일 원본). 본 계획은 **P8** 단계로 편성.
>
> ✅ **2026-07-30 구현·개발망 확인 완료.** 아래 §1~13은 착수 시점의 스펙이며, 구현 중 개발망 피드백으로
> **확정 변경된 사항은 §14에 정리**했다. 서로 다를 경우 **§14가 우선**한다.

- 작성일: 2026-07-29
- 선행 문서: [ICON_PLUS_개발계획.md](./ICON_PLUS_개발계획.md) (P0~P7 완료), [ICON_PLUS_handoff.md](./ICON_PLUS_handoff.md)
- 대상 페이지: SOURCE > ICON > **ICON+ 탭** (`app/_category-pages/icon/IconPlusWorkspace.tsx`)

---

## 1. 배경

현재 ICON+ 탭의 **메인 아이콘은 "이미 잘린 SVG 파일"을 업로드**하는 방식이다.
디자이너가 파일 단계에서 우측 하단을 원형으로 깎아 두고, 관리자는 업로드 시 `anchorX/anchorY` 한 쌍만 지정한다. `lib/svg/merge-svg.ts`는 그 빈 자리에 병합용 리소스를 올려놓을 뿐, **절단 자체를 코드가 수행하지 않는다.**

이로 인한 문제:

- 메인 아이콘이 목록에서 **잘린 상태로 노출**되어 아이콘 자체를 알아보기 어렵다.
- 절단 위치가 **파일에 고정**되어 우측 하단 외의 배치를 만들 수 없다. 위치별 변형을 원하면 원본 파일을 여러 개 만들어야 한다.
- 절단 크기·위치 수정에 디자이너 재작업과 재업로드가 필요하다.

---

## 2. 목표 사용 흐름 (확정)

```
[관리자]  완전한 메인 아이콘 업로드
            └─ 편집 다이얼로그에서 프리셋 설정
                 · 우측 상단 : 원(위치·지름) + 앵커
                 · 우측 하단 : 원(위치·지름) + 앵커     ← 2곳 모두 또는 한 곳만

[사용자]  ① 완전한 모습의 메인 아이콘을 보고 선택
          ② 병합용 아이콘(또는 텍스트) 선택
          ③ 속성 패널에서 마스킹 위치 프리셋 선택  [우측 상단] [우측 하단]
          ④ 색상 / 선 두께 / 크기 / 포맷 조정
          ⑤ SVG · PNG · JPG 다운로드
```

핵심은 **프리셋 = (마스킹 원 + 앵커) 한 세트**라는 점이다. 프리셋마다 배지가 놓이는 위치가 다르므로 **앵커도 프리셋마다 따로** 가진다. 마스킹은 **사용자가 프리셋을 선택한 결과물에만** 적용되고, 카드 목록과 입력 미리보기의 메인 아이콘은 **항상 완전한 모습**이다.

### 2.1 확정된 결정 사항

| # | 항목 | 결정 |
| --- | --- | --- |
| 1 | 메인 아이콘 표시 | 카드 목록·입력 미리보기 모두 **항상 완전한 모습** |
| 2 | 마스킹 적용 시점 | 사용자가 프리셋을 선택한 **병합 결과 + 다운로드**에만 |
| 3 | 프리셋 위치 | **우측 상단 / 우측 하단 2곳** (`TOP_RIGHT` / `BOTTOM_RIGHT`) |
| 4 | 프리셋 구성 | 원 중심(`cutX/cutY`) + 반경(`cutRadius`) + 앵커(`anchorX/anchorY`) |
| 5 | 저장 구조 | **자녀 테이블** `icon_plus_main_presets` + `@@unique([resourceId, position])` |
| 6 | 기존 pre-cut 아이콘 | **legacy 경로 유지** — 프리셋이 없으면 기존 anchor로 마스킹 없이 병합 (두 방식 공존) |
| 7 | 사용자 기본 프리셋 | **우측 하단 자동 선택**(없으면 우측 상단). 프리셋 0개면 컨트롤 미노출 |
| 8 | 업로드 시 anchor | **제거** — MAIN 업로드는 완전한 SVG 1개만 받는다. 앵커는 프리셋에서 설정 |
| 9 | 원 좌표 제약 | 없음. 프리셋 라벨은 **사용자에게 보이는 이름**이며, 관리자는 원을 자유롭게 드래그한다 |
| 10 | 초기화 | 프리셋 단위 삭제 = 해당 위치 초기화 |

---

## 3. 데이터 모델

### 3.1 스키마 (`prisma/schema.prisma`)

```prisma
enum IconPlusCutPosition {
  TOP_RIGHT
  BOTTOM_RIGHT
}

/// MAIN 아이콘의 마스킹 프리셋. 위치별로 (절단 원 + 병합 앵커) 한 세트를 보관한다.
model IconPlusMainPreset {
  id         String              @id @default(cuid())
  resourceId String
  position   IconPlusCutPosition
  cutX       Float // 절단 원 중심 X (viewBox 좌표계)
  cutY       Float // 절단 원 중심 Y
  cutRadius  Float // 절단 원 반경 (> 0)
  anchorX    Float // 병합 리소스 좌상단 X (음수 허용 — 아이콘 밖 오버플로)
  anchorY    Float // 병합 리소스 좌상단 Y (음수 허용)
  createdAt  DateTime            @default(now())
  updatedAt  DateTime            @updatedAt

  resource IconPlusResource @relation(fields: [resourceId], references: [id], onDelete: Cascade)

  @@unique([resourceId, position])
  @@map("icon_plus_main_presets")
}
```

`IconPlusResource`에는 관계 필드 한 줄만 추가한다.

```prisma
presets IconPlusMainPreset[]
```

기존 `anchorX/anchorY/baseWidth/baseHeight`는 **legacy 필드로 유지**한다(결정 6). 주석에 "legacy — 프리셋 없는 pre-cut 아이콘 전용"임을 명시한다.

- `onDelete: Cascade`가 **필수**다. `DELETE /api/icon-plus`는 `deleteMany`로 리소스를 일괄 삭제하므로, cascade가 없으면 프리셋을 가진 MAIN 삭제가 FK 위반으로 실패한다.
- 위치를 늘리려면 **enum 값만 추가**하면 된다(스키마 구조 변경 없음).

### 3.2 마이그레이션 (수동 SQL — 셰도우 DB 사용 안 함)

로컬에는 DB가 없고 실 DB를 셰도우로 넘기면 초기화되므로, **SQL을 직접 작성**한다.
신규 타입·신규 테이블만 만들고 **기존 테이블은 건드리지 않는다 → 무손실.**

`prisma/migrations/<timestamp>_add_icon_plus_main_presets/migration.sql`

```sql
-- CreateEnum
CREATE TYPE "IconPlusCutPosition" AS ENUM ('TOP_RIGHT', 'BOTTOM_RIGHT');

-- CreateTable
CREATE TABLE "icon_plus_main_presets" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "position" "IconPlusCutPosition" NOT NULL,
    "cutX" DOUBLE PRECISION NOT NULL,
    "cutY" DOUBLE PRECISION NOT NULL,
    "cutRadius" DOUBLE PRECISION NOT NULL,
    "anchorX" DOUBLE PRECISION NOT NULL,
    "anchorY" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "icon_plus_main_presets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "icon_plus_main_presets_resourceId_position_key"
    ON "icon_plus_main_presets"("resourceId", "position");

-- AddForeignKey
ALTER TABLE "icon_plus_main_presets"
    ADD CONSTRAINT "icon_plus_main_presets_resourceId_fkey"
    FOREIGN KEY ("resourceId") REFERENCES "icon_plus_resources"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
```

- 컬럼명은 기존 관례대로 **camelCase 그대로**(`@map` 미사용, `@@map`은 테이블명만).
- 작성 후 `npx prisma validate` + `npx prisma generate`로 스키마-SQL 정합을 확인한다.
- 개발망 반영 순서: **`npx prisma migrate deploy`를 코드 배포와 함께/먼저** (누락 시 ICON+ 쿼리 전부 실패). [PRISMA_MIGRATIONS.md](./PRISMA_MIGRATIONS.md) 정책 준수.

---

## 4. 마스크 코어 — `lib/svg/corner-cut.ts` (신규)

원본 `svgContent`는 그대로 두고, 렌더 시점에 SVG `<mask>`로 구멍을 뚫는다.

```ts
export type CornerCut = { cutX: number; cutY: number; cutRadius: number }

/** <defs><mask>…</mask></defs> 문자열과 mask 속성값을 생성 */
export function buildCutMaskDefs(params: {
  maskId: string
  cut: CornerCut
  bounds: { minX: number; minY: number; width: number; height: number }
}): { defs: string; maskAttr: string }

/** 단독 표시용(관리자 편집 미리보기): svgContent에 마스크 적용. cut이 null이면 원본 그대로 반환 */
export function applyCornerCutToSvg(
  svgContent: string, cut: CornerCut | null, maskId: string
): string
```

생성 형태:

```html
<svg …>
  <defs>
    <mask id="{maskId}" maskUnits="userSpaceOnUse" x=".." y=".." width=".." height="..">
      <rect x=".." y=".." width=".." height=".." fill="#fff"/>
      <circle cx=".." cy=".." r=".." fill="#000"/>
    </mask>
  </defs>
  <g mask="url(#{maskId})"> {원본 inner} </g>
</svg>
```

### 4.1 반드시 지켜야 하는 3가지 하드 제약 (코드 확인 완료)

**① `<defs>`는 `data-layer="main"` 그룹보다 반드시 앞(head)에 위치**

`lib/svg/icon-plus-properties.ts`는 SVG 문자열을 `head / main / merge / tail`로 잘라 main·merge 구간에만 `changeAllSvgColors`를 적용한다. 이 함수는 `lib/svg/color.ts`에서 **모든 `fill="…"` 값을 선택 색상으로 덮어쓴다**(`none`/`url()`만 예외). 마스크가 main 구간 안에 있으면 `#fff`/`#000`이 같은 색이 되어 **마스크가 완전히 깨진다.** head 구간은 그대로 통과하므로 여기 두면 안전하다.

**② 마스크 도형에 `fill`을 명시하고 `stroke`는 쓰지 않는다**

`app/globals.css`의 `.svg-line-preview svg *[stroke]:not([fill]) { fill: none !important }`가 `<defs>` 내부까지 내려간다. 선택자가 "stroke 있고 fill 없는 요소"만 잡으므로 `fill="#fff"`/`fill="#000"`을 명시하면 대상에서 제외되어 **안전**하다. fill을 생략하면(기본 black) 흰 사각형이 검게 변해 전체가 사라진다.

**③ `mask` 속성은 `transform`이 없는 래퍼 `<g>`에 부여**

`maskUnits="userSpaceOnUse"`가 요소 자신의 transform 적용 전/후 어느 좌표계로 해석되는지 렌더러 간 해석 차가 있다. 기존 `translate`는 **안쪽 `<g>`로 옮기고**, 바깥 래퍼가 mask만 담당하게 해 좌표 모호성을 제거한다.

### 4.2 부수 사항

- **마스크는 `data-layer="main"` 레이어에만 적용**한다. 구멍 안에 놓이는 병합용 배지(`data-layer="merge"`)는 영향을 받지 않으므로, 투명해지는 부분은 **메인 아이콘의 획이 잘려나간 자리 = 배지와 메인 사이의 여백**이다.
- **마스크 영역**은 viewBox를 상하좌우 25% 확장한 범위로 지정한다(기본 mask 영역은 bbox의 -10%~120%라 가장자리 획이 잘릴 수 있음).
- **`maskId`는 호출부에서 주입**한다(`iconplus-cut-${resourceId}-${position}`). 페이지에 여러 SVG가 인라인되므로 id 충돌 방지가 필수이고, 인자로 받으면 테스트에서 결정적으로 검증할 수 있다.
- sanitize 허용목록(`lib/svg/process-svg.ts`)에 `mask`/`defs`/`rect`/`circle` 태그와 `mask` 속성이 이미 있다. 마스크는 런타임 생성이라 sanitize를 거치지 않지만, 향후 저장 경로가 생길 때를 대비해 **`maskUnits`를 허용 속성에 추가**해 둔다.
- 렌더러 문제가 발견되면 동일 파일 안에서 `<clipPath clip-rule="evenodd">` 방식으로 교체 가능하도록 인터페이스를 유지한다(fallback — `clip-path`/`clip-rule`도 이미 허용목록에 있음).

---

## 5. `lib/svg/merge-svg.ts` — 상단 오버플로 지원 (오프셋 정규화)

현재 구현은 결과를 `0 0 W H`로 고정하고 `max()`로 **우/하 확장만** 계산한다. **우측 상단 프리셋은 배지가 아이콘 위쪽으로 삐져나오므로 `anchorY`가 음수가 되고, 지금 코드에서는 잘려 나간다.**

**해결: viewBox min을 음수로 만들지 않고, 두 레이어를 오버플로만큼 평행이동한다.**

```
aX = anchorX - main.minX,  aY = anchorY - main.minY
left = min(0, aX)                 right  = max(main.width,  aX + resource.width)
top  = min(0, aY)                 bottom = max(main.height, aY + resource.height)
offX = -left (≥0)                 offY   = -top (≥0)
resultWidth = right - left        resultHeight = bottom - top
viewBox = "0 0 resultWidth resultHeight"          // 형태 유지
main  : translate(offX - main.minX,           offY - main.minY)
merge : translate(offX + aX - resource.minX,  offY + aY - resource.minY)
```

- `aX, aY ≥ 0`이면 `offX = offY = 0` → **기존 출력과 완전히 동일**(기존 단위 테스트 3건 그대로 통과).
- viewBox가 음수 min을 갖지 않아 canvas 래스터화(`lib/svg/icon-plus-download.ts`)와 `applyIconPlusProperties`의 크기 재설정에 영향이 없다.
- **마스크 원 좌표**도 같은 공간으로 변환한다: `cx = cutX - main.minX + offX`, `cy = cutY - main.minY + offY`.

타입 변경 — `MainMergeSvgIcon`에 `cutX?/cutY?/cutRadius?: number | null`, `maskId?: string`를 **옵셔널로** 추가해 기존 호출부·테스트를 깨뜨리지 않는다. cut 3값이 모두 유효할 때만 마스크를 삽입한다.

---

## 6. API

### 6.1 `GET /api/icon-plus` — 프리셋 포함

`findMany`에 `include: { presets: true }`를 추가한다. MERGE_* 타입은 빈 배열이 되어 무해하므로 타입 분기 없이 항상 포함한다. 표시 순서는 클라이언트에서 고정 상수(`우측 상단 → 우측 하단`)로 정렬한다.

### 6.2 `PATCH /api/icon-plus/[id]` — 프리셋 전체 교체

```ts
{
  presets?: Array<{ position: 'TOP_RIGHT' | 'BOTTOM_RIGHT'
                    cutX: number; cutY: number; cutRadius: number
                    anchorX: number; anchorY: number }>
  anchorX?: number   // legacy pre-cut 아이콘 anchor 수정용 (하위호환)
  anchorY?: number
}
```

- **전체 교체(full replace)** 의미: 트랜잭션으로 `deleteMany({ resourceId })` → `createMany(presets)`. 배열에서 빠진 위치는 **삭제 = 초기화**(결정 10). 관리자가 두 프리셋을 한 화면에서 편집하고 한 번에 저장하는 UX와 일치한다.
- 검증: `position`은 enum 값이며 **중복 불가**, 수치 6개는 finite, `cutRadius > 0`, **anchor 음수 허용**(§5 상단 오버플로).
- `presets` 키가 없으면 프리셋을 건드리지 않는다. `anchorX/anchorY`만 오는 기존 호출도 그대로 동작한다.
- MAIN 타입만 대상으로 하고 404 처리 구조를 유지한다.

### 6.3 `POST /api/icon-plus` — MAIN anchor 필수 검증 제거

`type === MAIN && (anchorX === null || anchorY === null)` 400 분기를 **삭제**한다(결정 8). MAIN도 `anchorX/anchorY`는 `null`로 저장되고, 파일 1개 제한·SVG 검증은 그대로 유지한다.

### 6.4 변경 없는 곳

- `lib/svg/process-svg.ts` — 형상 가공 없음(`maskUnits` 허용목록 1줄 외).
- `lib/svg/icon-plus-download.ts` — 수정 불필요.
- `app/api/search/route.ts` — `IconPlusResource`를 name으로만 검색하므로 영향 없음.

---

## 7. UI

### 7.1 사용자 경로 — 속성 패널에 프리셋 선택 추가

`IconPlusPropertyPanel.tsx`에 **"마스킹 위치"** 컨트롤을 추가한다(색상/선 두께/크기/FORMAT과 같은 계층).

- 버튼 그룹 `[우측 상단] [우측 하단]` — **관리자가 설정한 프리셋만** 노출. 스타일은 기존 FORMAT 버튼(`h-8 flex-1`)과 통일한다.
- **기본 선택: 우측 하단**(없으면 우측 상단). 선택된 메인 아이콘이 바뀌면 기본값을 다시 계산한다.
- 프리셋 **0개(legacy pre-cut)** → 컨트롤 숨김 + 기존 `resource.anchorX/anchorY`로 마스킹 없이 병합(결정 6). 기존 "anchor 좌표가 없어 미리보기를 만들 수 없습니다" 안내는 이 경우에만 유지한다.
- `mergeSvgsByAnchor` 호출에 **선택된 프리셋의 `anchorX/anchorY` + `cutX/cutY/cutRadius` + `maskId`** 를 전달한다 → 결과 슬롯과 SVG/PNG/JPG 다운로드에 자동 반영된다.

**마스킹을 적용하지 않는 곳** (결정 1·2)

| 위치 | 표시 |
| --- | --- |
| `IconPlusCard.tsx` 메인 카드 | **완전한 모습** — 마스크 미적용 (렌더 로직 수정 없음) |
| `IconPlusPropertyPanel.tsx` `PreviewSlot` 메인 슬롯 | **완전한 모습** — 입력 미리보기이므로 원본 유지 |

### 7.2 관리자 경로 — 프리셋 편집 다이얼로그

`IconPlusAnchorDialog.tsx` → **`IconPlusMainEditDialog.tsx`로 개명·확장**한다(import은 `IconPlusWorkspace.tsx` 한 곳뿐, 카드 prop `onEditAnchor` → `onEdit`).

**상단: 프리셋 탭** `[우측 상단] [우측 하단]`
- 미설정 위치는 `프리셋 추가` 상태로 표시하고, 클릭 시 기본값으로 생성한다.
  - 우측 하단: 중심 `(0.85W, 0.85H)`, 반경 `min(W,H) × 0.22`
  - 우측 상단: 중심 `(0.85W, 0.15H)`, 반경 동일
- 각 탭에 `이 프리셋 삭제(초기화)` 버튼.

**좌측 스테이지**
- 아이콘 박스 주위에 **25% 여백 프레임**을 두고 아이콘 bbox 경계를 점선으로 표시 → 원과 앵커를 아이콘 **밖으로도** 끌어낼 수 있다(§5).
- 현재 탭 프리셋의 마스킹이 **실시간 적용된 모습**을 표시한다(`applyCornerCutToSvg`).
- **원형 오버레이**(빨간 실선 — 편집용 표시이며 저장 결과에는 포함되지 않음) + **십자선 앵커 마커**를 동시에 표시한다.
- **참조 오버레이**: 병합용 리소스 하나를 골라 앵커 위치에 native 크기·반투명으로 겹쳐 보여, 원 지름과 배지 크기의 정합을 그 자리에서 확인한다. 목록은 이미 워크스페이스 state(`mergeIconResources`/`mergeTextResources`)에 있으므로 **prop 전달, 추가 fetch 없음.**
- **비활성 프리셋을 연한 회색 점선 원으로 함께 표시**한다(설정되어 있을 때). 두 위치의 지름·균형을 비교하기 위한 표시이며 클릭·드래그 대상은 아니다.

**우측 컨트롤**
- **모드 토글 `[앵커 지정] / [절단 원 지정]`** — 두 대상이 같은 스테이지에서 포인터를 공유하고 서로 겹칠 수 있어 "원 안쪽만 드래그" 방식은 조작이 막힌다. 모드 분리가 안전하다.
- `anchorX`/`anchorY`, `cutX`/`cutY` 수치 입력 (**`min="0"` 제거 — 음수 허용**).
- **지름 슬라이더** — 짧은 변의 **10~100%**(= 반경 5~50%) 범위로 표시하고, 저장은 `cutRadius`(반경) 절대값.
- **`앵커를 원 좌상단에 맞추기`** 버튼 — `anchor = (cutX - r, cutY - r)`. 원 지름에 맞춰 제작된 리소스는 이 한 번으로 정합된다.
- 각 탭에 **`이 프리셋 삭제`**(해당 위치 초기화) 버튼.

좌표 계산은 `anchor-utils.ts`의 `clamp`/`formatCoordinate`/`getContainedRect`를 재사용하고, 여백 프레임용으로 **확장 범위 clamp 헬퍼 1개만 추가**한다(기존 `[0, width]` → `[-0.25W, 1.25W]`).

**편집 상태 관리 — 탭 간 draft 유지 + 저장/취소 일괄 처리**

- 두 프리셋을 **다이얼로그 로컬 state에 함께 draft로 보관**한다. 탭을 전환해도 아직 저장하지 않은 편집값이 유지된다.
- **`저장`** = 두 프리셋 draft를 **PATCH 1회**로 함께 전송(§6.2 전체 교체). 삭제한 위치는 배열에서 빠지므로 서버에서 함께 정리된다.
- **`취소`** = 두 탭에서 만진 모든 변경을 폐기하고 저장 전 상태로 되돌린다.
- 다이얼로그를 열 때 활성 탭은 **설정된 프리셋 중 우측 하단**(없으면 우측 상단, 둘 다 없으면 `우측 하단` 탭의 `추가` 상태).

**관리자 편집 절차** (구현 시 이 흐름을 만족해야 한다)

1. 메인 카드 hover → 편집 버튼(⌖) 클릭 → 다이얼로그 오픈. 설정된 탭은 값이 채워지고, 없는 탭은 `⊕ 추가` 상태.
2. `⊕ 추가` 클릭 → 위치별 기본값으로 프리셋 생성(앵커는 원 좌상단으로 자동 세팅) → 스테이지에 즉시 마스킹 미리보기 표시.
3. 편집 대상 `절단 원` 상태에서 스테이지 클릭·드래그로 원 이동(아이콘 경계 밖으로도 가능) → **지름 슬라이더**로 구멍 크기 조정.
4. 편집 대상을 `앵커`로 전환 → 십자선 드래그로 배지 위치 조정. 참조 배지가 앵커에 붙어 함께 이동한다. 대부분 **`앵커를 원 좌상단에 맞추기`** 한 번으로 정합.
5. 정밀 조정이 필요하면 우측 수치 입력칸(`cutX/cutY/anchorX/anchorY`)에 직접 입력 — 스테이지와 양방향 동기화.
6. 다른 탭으로 전환해 같은 절차를 반복. **우측 상단 프리셋은 배지가 위로 삐져나와 `anchorY`가 음수가 되는 것이 정상**이다.
7. `저장` → 목록 refresh. **카드는 여전히 완전한 모습**이고, 사용자 속성 패널에 프리셋 버튼이 노출된다.

### 7.3 타입 (`iconplus/types.ts`)

```ts
export type IconPlusCutPosition = 'TOP_RIGHT' | 'BOTTOM_RIGHT'

export interface IconPlusMainPreset {
  id: string
  position: IconPlusCutPosition
  cutX: number; cutY: number; cutRadius: number
  anchorX: number; anchorY: number
}

// IconPlusResource에 추가
presets?: IconPlusMainPreset[]
```

프리셋 라벨(`우측 상단`/`우측 하단`)과 표시 순서는 이 파일에 상수로 두어 패널·다이얼로그가 공유한다.

---

## 8. Phase 분할

각 단계 후 개발망 검증을 거친다(프로젝트 규칙).

| 단계 | 범위 | 완료 기준 |
| --- | --- | --- |
| **P8-1** 데이터·API | enum + `IconPlusMainPreset` 모델 + 수동 SQL 마이그레이션, GET include, PATCH 프리셋 전체 교체, POST anchor 필수 해제, `types.ts` | 개발망 `migrate deploy` 성공, PATCH로 프리셋 2개 저장/1개 삭제/전체 삭제 왕복 확인, MAIN 삭제 시 프리셋 cascade 삭제 확인, 비관리자 403 |
| **P8-2** 마스크 코어 | `corner-cut.ts` 신규, `merge-svg.ts` 오프셋 정규화 + 마스크 통합 | 로컬 `vitest` 신규/기존 전부 통과(기존 3건 출력 불변 회귀 포함) |
| **P8-3** 사용자 경로 | 속성 패널 프리셋 선택 컨트롤 + 결과 슬롯·다운로드 반영. 카드·입력 슬롯은 완전한 모습 유지 | 개발망: 프리셋 전환에 따라 결과가 바뀌고, 카드·입력 미리보기는 완전한 모습. SVG/PNG/JPG 일치 |
| **P8-4** 관리자 편집 다이얼로그 | 프리셋 2탭, 원 드래그·지름 슬라이더, 앵커, 프리셋 추가/삭제, 참조 오버레이, 맞추기 버튼 | 개발망에서 완전한 아이콘 1개로 **우측 상단·하단 두 프리셋을 설정하고 사용자 경로에서 전환** |

---

## 9. 테스트 (vitest, DB 비의존)

**`lib/svg/corner-cut.test.ts` (신규)**

- `cut === null` → 원본 문자열 그대로 반환
- 마스크 삽입 시 `<defs>`가 `<g mask=…>`보다 앞, 래퍼 `<g>`에 `transform` 없음
- `fill="#fff"` / `fill="#000"` 명시, 마스크 도형에 `stroke` 없음 (제약 ② 회귀 방지)
- `maskUnits="userSpaceOnUse"` + 25% 확장 bounds
- `maskId` 주입값이 `id`와 `url(#…)`에 동일 반영

**`lib/svg/merge-svg.test.ts` (추가)**

- 기존 3건 유지 + `anchor ≥ 0` 케이스 출력이 변경 전과 동일(회귀)
- **음수 `anchorY`(우측 상단 프리셋)** → `offY` 평행이동, 결과 높이 확장, 배지 잘림 없음
- cut 지정 시 `<defs>`가 `data-layer="main"`보다 앞이고, 마스크 원 좌표 = `cut - main.min + off`
- cut 3값 중 하나라도 없으면 마스크를 삽입하지 않음

**`lib/svg/icon-plus-properties.test.ts` (추가) — 가장 중요한 회귀**

- cut 포함 병합 결과에 색상 baking 후 **마스크의 `#fff`/`#000`이 보존**되는지(제약 ① 회귀 방지)

---

## 10. 검증 절차

**로컬 게이트** (커밋 전 필수)

```bash
npm run typecheck && npm run lint     # = /preflight
npx vitest run
```

**개발망** (`https://design6.pentasecurity.com`) — 순서 준수

1. `npx prisma migrate deploy` **먼저** (누락 시 ICON+ 쿼리 전부 실패)
2. **legacy 회귀** — 기존 pre-cut MAIN 아이콘: 프리셋이 없으므로 카드·병합·다운로드가 **종전과 동일**, 프리셋 컨트롤 미노출
3. 완전한 아이콘 신규 업로드 → 업로드 폼에 **anchor 입력이 없고**, 카드에 **완전한 모습** 표시
4. 편집 다이얼로그에서 **우측 하단** 프리셋 설정(원 드래그 + 지름 + 앵커) → 저장
5. 사용자 경로: 메인 + 병합 리소스 선택 → **우측 하단이 기본 선택**되고 결과에 마스킹 적용
6. **우측 상단** 프리셋 추가 → 패널에 버튼 2개 노출, 전환 시 결과가 즉시 바뀜. 특히 **배지가 위로 삐져나와도 잘리지 않는지**(§5)
7. 지름 슬라이더 최소~최대 구간에서 구멍 크기 변화 확인
8. 프리셋 **삭제(초기화)** → 해당 버튼이 사라지고, 남은 프리셋으로 기본 선택이 이동. 전부 삭제하면 legacy 동작
9. 결과 슬롯 ↔ **SVG / PNG / JPG 다운로드 파일**의 절단 모양 일치. **투명도 확인**:
   - **SVG** — 마스크가 파일에 포함되어 절단 영역이 알파 0(배경 사각형을 넣지 않음)
   - **PNG** — `renderSvgToRasterBlob`이 PNG에는 `fillRect`를 하지 않으므로 절단 영역이 **투명**
   - **JPG** — 알파 채널이 없어 흰 배경을 먼저 깔므로 절단 영역은 **흰색**(기존 `JPG: 배경불투명` 안내와 일치, 정상 동작)
10. **Safari** 확인 — 마스크 렌더 + canvas 래스터화 경로(`icon-plus-download.ts`의 `loadSvgImage`).
    마스크 미지원 시 증상은 "구멍이 검게 나온다"가 아니라 **"구멍이 아예 파이지 않는다"** 이므로, 결과 슬롯과 다운로드 파일을 나란히 비교해 판별한다.
11. 색상 10종 · 선 두께 전 구간에서 마스크가 깨지지 않는지(제약 ① 실환경 확인)
12. 프리셋을 가진 MAIN 아이콘 **삭제** → cascade로 프리셋까지 삭제되고 오류 없음
13. 비관리자 계정: 편집 버튼 미노출 + PATCH 403, 프리셋 선택은 정상 사용 가능

---

## 11. 리스크와 되돌리기

| 리스크 | 대응 |
| --- | --- |
| 색상 baking이 마스크를 덮어씀 | `<defs>`를 head에 배치(제약 ①) + `icon-plus-properties.test.ts` 회귀 테스트 |
| 미리보기 CSS가 마스크 도형 오염 | `fill` 명시·`stroke` 미사용(제약 ②) + 단위 테스트로 고정 |
| 렌더러별 mask 좌표 해석 차 | transform 없는 래퍼에 mask 부여(제약 ③), Safari 검증 항목화 |
| cascade 누락으로 MAIN 삭제 실패 | 스키마 `onDelete: Cascade` + SQL FK `ON DELETE CASCADE` 양쪽 명시, 검증 12번 |
| 수동 SQL과 스키마 불일치 | `prisma validate`/`generate` 후 개발망 `migrate deploy`로 확인(실패 시 명확히 에러). 신규 테이블이라 **기존 데이터 위험 없음** |
| 원 지름과 배지 크기 불일치 | 참조 오버레이 + `앵커 맞추기` 버튼으로 편집 중 확인 |
| 라인 아이콘 획 단면이 기존 pre-cut 파일과 미세하게 달라 보임 | 개발망 육안 확인 항목. 필요 시 지름 미세조정으로 흡수 |
| 롤백 | 코드 revert만으로 원복(신규 테이블은 남겨둬도 무해). **원본 SVG를 변형하지 않으므로 데이터 손실 없음** |

기존 pre-cut MAIN 아이콘은 프리셋 없이 계속 동작한다. 완전한 버전으로 재업로드하고 프리셋을 설정하면 새 방식으로 전환되며 **두 방식의 공존이 가능**하다(일괄 전환 시점은 운영 판단 사항).

---

## 12. 변경 파일 목록

**신규**

- `prisma/migrations/<timestamp>_add_icon_plus_main_presets/migration.sql`
- `lib/svg/corner-cut.ts`, `lib/svg/corner-cut.test.ts`
- `components/category-pages/IconCategory/iconplus/IconPlusMainEditDialog.tsx` (기존 `IconPlusAnchorDialog.tsx` 개명·확장 → 원본 파일 삭제)
- `components/category-pages/IconCategory/iconplus/CutPositionGlyph.tsx` (§14.2·14.3 — 프리셋 위치 글리프 + 카드 코너 점 버튼)

**수정**

- `prisma/schema.prisma` — `IconPlusCutPosition` enum, `IconPlusMainPreset` 모델, `IconPlusResource.presets` 관계, legacy 필드 주석
- `lib/svg/merge-svg.ts` — 오프셋 정규화 + 마스크 통합, 타입 옵셔널 확장
- `lib/svg/process-svg.ts` — 허용 속성 `maskUnits` 추가
- `app/api/icon-plus/route.ts` — GET `include: { presets: true }`, POST MAIN anchor 필수 해제
- `app/api/icon-plus/[id]/route.ts` — 프리셋 전체 교체(트랜잭션), 음수 anchor 허용, legacy anchor 하위호환
- `components/category-pages/IconCategory/iconplus/types.ts` — 프리셋 타입·라벨·표시 순서 상수
- `components/category-pages/IconCategory/iconplus/IconPlusPropertyPanel.tsx` — 마스킹 위치 프리셋 컨트롤, 기본 선택, merge 호출에 프리셋 전달
- `components/category-pages/IconCategory/iconplus/IconPlusCard.tsx` — prop `onEditAnchor` → `onEdit` (렌더는 완전한 모습 유지)
- `components/category-pages/IconCategory/iconplus/IconPlusUploadDialog.tsx` — MAIN anchor 입력 UI 제거
- `components/category-pages/IconCategory/iconplus/anchor-utils.ts` — 확장 범위 clamp 헬퍼
- `app/_category-pages/icon/IconPlusWorkspace.tsx` — 다이얼로그 개명, 병합 리소스 목록 prop 전달
- `lib/svg/merge-svg.test.ts`, `lib/svg/icon-plus-properties.test.ts` — 케이스 추가
- `docs/ICON_PLUS_handoff.md` — P8 단계·검증 체크리스트·이력 추가

**수정 없음**

- `lib/svg/icon-plus-download.ts`, `app/api/search/route.ts`

---

## 13. 커밋·배포

- 로컬 브랜치는 `refactor/phase2-api-layer`, **푸시 대상은 항상 `git push origin HEAD:2026-06-17-tiper`**.
- 푸시 전 `/preflight`(typecheck + lint) 통과 필수, **푸시 등 외부 반영은 사전 확인 후** 진행한다.
- 개발망 배포 시 `prisma migrate deploy`를 **코드 pull과 함께** 실행한다.

---

## 14. 구현 확정 변경 사항 (2026-07-30)

§1~13은 착수 시점 스펙이다. 개발망 검증 피드백으로 **다음 3가지가 확정 변경**되었다(구현·확인 완료).
단계별 상세와 이유는 [ICON_PLUS_handoff.md](./ICON_PLUS_handoff.md) "Phase 8"에 기록되어 있다.

### 14.1 위치별 앵커 기준 코너 (P8-5) — §5 보강

앵커가 병합 리소스의 **어느 코너와 맞춰지는지**를 위치별로 달리한다.

| 프리셋 | 앵커가 맞춰지는 리소스 코너 | 결과 |
| --- | --- | --- |
| 우측 하단 (`BOTTOM_RIGHT`) | 좌측 **상단** (기존과 동일) | 배지가 앵커에서 아래·오른쪽으로 놓인다 |
| 우측 상단 (`TOP_RIGHT`) | 좌측 **하단** | 배지가 앵커 위로 쌓여, **높이가 다른 리소스들의 아래쪽 변이 정렬**된다 |

- `mergeSvgsByAnchor`에 `anchorBasis?: 'TOP_LEFT' | 'BOTTOM_LEFT'`(기본 `TOP_LEFT`)를 추가했다. `BOTTOM_LEFT`면 리소스 상단 y를 `anchorY - resource.height`로 계산하며, §5의 오프셋 정규화가 위쪽 오버플로를 그대로 흡수한다.
- 위치 → 기준 코너 매핑은 **DB 컬럼 없이 코드 상수**(`CUT_POSITION_ANCHOR_BASIS`)로 결정한다. 위치를 늘릴 때 한 줄만 추가하면 되고 마이그레이션이 없다. 관리자가 코너를 직접 고르게 하려면 컬럼 추가가 필요하다(현 요구사항은 위치로 결정되므로 미채택).
- 이에 따라 §7.2의 `앵커를 원 좌상단에 맞추기` 버튼은 **기준 코너에 따라 라벨·동작이 바뀐다**(우측 상단에서는 `앵커를 원 좌하단에 맞추기` = `(cutX - r, cutY + r)`). 참조 오버레이도 아래쪽 변을 앵커에 맞춰 그린다.

### 14.2 프리셋 설정 여부 시각화 (P8-5) — §7.2 보강

- 편집 다이얼로그 탭: **미니 다이어그램**(코너에 점을 찍은 작은 사각형) + `✓`/`+` 아이콘 + 실선/점선 테두리 + 라벨(`우측 상단 추가`)의 4중 표시. 활성 탭은 ring으로 별도 구분해 "선택된 탭"과 "설정된 탭"이 섞이지 않게 한다.
- 공용 컴포넌트 `CutPositionGlyph.tsx`를 신설해 다이얼로그와 카드가 **같은 시각 언어**를 쓴다.

### 14.3 메인 카드 진입 방식 — 코너 점 클릭 (P8-6) — §7.2 대체

§7.2의 "메인 카드 hover → 편집 버튼(⌖) 클릭"을 다음으로 **대체**한다.

- **별도 편집 버튼 없음.** 카드 우측 코너의 점 2개가 유일한 편집 진입로다.
- 점을 누르면 **그 위치의 프리셋 탭으로** 다이얼로그가 열린다(`initialPosition`). **미설정 코너를 누르면 그 위치에 기본 프리셋 draft가 생성**되어 "빈 코너를 눌러 구멍을 만든다"는 흐름이 된다(저장 전이라 취소/삭제로 되돌림).
- 표시 규칙: 카드 hover/포커스 시 두 점이 함께 나타난다(설정=채운 점, 미설정=점선 빈 점). **hover가 없는 기기(터치)는 항상 표시** — 그렇지 않으면 관리자의 진입로가 사라진다.
- 클릭 표적은 8px 점이 아니라 **20px 버튼**(점은 그 안에 렌더). 점 위에서 커서가 포인터로 바뀌고 점이 확대+링으로 강조된다. **툴팁은 사용하지 않고** 접근성 이름은 `aria-label`(`우측 상단 프리셋 편집/추가`)로 제공한다.
- 편집 버튼이 없어진 만큼 메인 섹션 설명문을 **관리자에게만** `카드 우측 코너의 점을 눌러 마스킹 프리셋을 설정합니다`로 노출해 진입 방법을 안내한다.

### 14.4 그 밖의 구현 결정

- `POST /api/icon-plus`는 MAIN anchor **필수 검증만 해제**하고, 전달되면 legacy 값으로 저장한다(§6.3의 "null로 저장"을 그대로 적용하면 P8-4 이전 구간에서 기존 업로드 폼이 보낸 좌표가 유실됨). 업로드 폼의 anchor 입력은 P8-4에서 제거되었다.
- `PATCH /api/icon-plus/[id]` 응답에 최신 `presets` 배열을 함께 반환한다(기존 `{ ok: true }` 계약 유지).
- **legacy anchor 편집 UI는 제공하지 않는다.** 프리셋 없는 pre-cut 아이콘은 다이얼로그 하단 안내문으로 "프리셋 추가 시 전환됨"을 알린다. 기존 anchor 값은 DB·API에 남아 legacy 렌더에 계속 쓰인다.
- 좌표 기준은 `readViewBoxRect`로 **viewBox min까지 반영**한다(`merge-svg`가 `main.min`을 차감하므로 `viewBox="10 10 …"` 같은 SVG에서 어긋나는 것을 방지).
