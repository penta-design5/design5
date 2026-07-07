# ICON+ 기능 개발 계획

> SOURCE 카테고리의 **ICON** 페이지에 **ICON+** 탭을 추가하여, 사용자가 메인 아이콘과
> 병합용 아이콘/텍스트를 선택해 하나의 새 아이콘으로 합성하고 색상·선 두께·크기·포맷을
> 조정해 내보낼 수 있는 기능을 구현한다. **본 문서는 계획서이며 구현 코드는 포함하지 않는다.**

> 📊 구현 진행 상태는 [ICON_PLUS_handoff.md](./ICON_PLUS_handoff.md)에서 관리한다(단일 원본). 현재 P4 ✅ 완료 · 다음 P5.

- 작성일: 2026-07-07
- 대상 페이지: SOURCE > ICON (`app/_category-pages/icon/IconListPage.tsx`, 라우트 `[slug]` pageType `list`)
- 참고 자료:
  - 레이아웃: `icon-merger/ref-image/ICON_layout_01.jpg`(ICON 탭), `icon-merger/ref-image/ICON_layout_02.jpg`(ICON+ 탭)
  - 기능 상세: `icon-merger/docs/development-plan.md`
  - 참고 소스: `icon-merger/src/**` (병합/전처리 로직 및 UI)

---

## 1. 확정된 방향 (사전 결정 사항)

| 항목 | 결정 | 비고 |
| --- | --- | --- |
| ICON+ 리소스 출처 | **ICON+ 전용 DB 라이브러리** | 관리자가 SVG를 사내망 DB에 직접 업로드/관리. 기존 294개 ICON(사내망 MinIO 오브젝트 스토리지 기반)과 완전 분리 |
| 저장 방식 | **사내망 DB에 SVG 텍스트로 저장** | 별도 오브젝트 스토리지(MinIO) 미사용. `@db.Text` 컬럼 |
| icon-merger 활용 | **핵심 로직 포팅 + UI 재구현** | 병합/sanitize/normalize 로직은 이식, UI는 Design5 컴포넌트·디자인 토큰으로 신규 구현 |
| 디자인 시스템 | **Design5 시스템 강제 준수** | 폰트/폰트 크기/색상 등은 icon-merger의 하드코딩 값(`#1E6FFF` 등)이 아니라 Design5 Tailwind 테마·shadcn 컴포넌트를 사용 |

---

## 2. 현재 상태 분석

### 2.1 기존 ICON 탭 (그대로 유지)
- 데이터: `Post` 모델 + **사내망 MinIO(S3 호환) 오브젝트 스토리지** 저장, `fileUrl`로 참조. `/api/posts?categorySlug=icon`로 조회.
  - 외부 Backblaze B2가 아니라 사내 도커 MinIO다. 설정: `S3_ENDPOINT`(예: `http://127.0.0.1:19000`, SSH 터널), 공개 URL `S3_PUBLIC_BASE_URL="https://design5.pentasecurity.com"`, 버킷 `S3_BUCKET_ICONS="icons"`. 코드: `lib/s3/config.ts`(`getS3Client`, `publicUrlForIconsKey`).
- 구성: 좌측 그리드(무한 스크롤) + 우측 `IconPropertyPanel`(색상 10종 / 선 두께 슬라이더 / 크기 슬라이더 / SVG·PNG·JPG 다운로드).
- 관련 파일:
  - `app/_category-pages/icon/IconListPage.tsx` (컨테이너)
  - `components/category-pages/IconCategory/IconCard.tsx`
  - `components/category-pages/IconCategory/IconUploadDialog.tsx`
  - `components/category-pages/IconCategory/IconPropertyPanel.tsx`
  - 다운로드: `app/api/posts/[id]/icon/download/route.ts`, 업로드: `app/api/posts/upload-icon/route.ts`
  - SVG 속성 변환: `lib/svg/*` (`changeIconSvgProperties` 등, `lib/svg-utils.ts` 배럴)
- 헤더: `SubscribeButton`(구독) + 관리자 전용 `아이콘 추가` 버튼.

### 2.2 icon-merger 참고 구현 (로직 이식 대상)
- 데이터: 자체 `Icon` 모델 (`MAIN` / `MERGE_ICON` / `MERGE_TEXT`), SVG를 `@db.Text`로 저장, 메인 아이콘은 `anchorX/anchorY/baseWidth/baseHeight` 보유.
- 병합: `src/lib/svg/merge-svg.ts` — `mergeSvgsByAnchor()` anchor 기준 확장 병합(결과 viewBox/width/height 재계산).
- 전처리: `src/lib/svg/process-svg.ts` — 크기/확장자/MIME 검증, `sanitize-html` + `fast-xml-parser`로 위험 태그·속성 제거, viewBox 정규화.
- API: `src/app/api/icons/route.ts`(GET/POST/DELETE), `src/app/api/icons/[id]/route.ts`(PATCH anchor).
- UI: `src/components/icon-workspace.tsx` — 3영역 레이아웃, 섹션 헤더 공통 액션(추가/더보기/선택 개수/선택 해제/삭제), anchor 편집 다이얼로그, 병합 미리보기.
- **이식 시 교체가 필요한 부분**: 인증(`@/lib/auth/current-user` → Design5 `lib/auth-helpers.ts`), Prisma(`@/generated/prisma` → `@/lib/prisma`), 디자인 토큰(하드코딩 색상/폰트 → Design5 Tailwind·shadcn), 컴포넌트(자체 Button/Tooltip → Design5 `components/ui/*`).

---

## 3. UI / 레이아웃 계획

### 3.1 탭 도입 (공통)
- ICON 페이지 타이틀(`ICON`) 바로 아래에 **`ICON` / `ICON+` 탭 버튼**을 추가한다.
- 탭 상태는 `IconListPage` 내부 클라이언트 상태로 관리(`activeTab: 'ICON' | 'ICON+'`). URL 쿼리(`?tab=plus`)와 동기화하여 새로고침/공유 시 유지(선택).
- `구독` 버튼은 두 탭 모두 헤더 우측에 그대로 유지.
  - **구독 단위는 탭별이 아니라 ICON 카테고리(페이지) 전체**다. ICON/ICON+는 별개 구독 서비스가 아니라 동일 카테고리 내 탭이며, 구독 버튼은 `categoryId` 하나로 ICON 페이지 전체를 구독한다(`MenuSubscription`, `userId_categoryId` 단위). 탭 전환과 무관하게 동일 구독 상태를 공유한다.
- 탭 스타일은 Design5 디자인 토큰 기준(선택 탭 강조, 하단 인디케이터 또는 언더라인). shadcn `Tabs` 또는 기존 프로젝트의 탭 패턴 재사용.

### 3.2 ICON 탭 (기존 UI 유지 + 버튼 위치 변경)
`ICON_layout_01.jpg` 기준. 기능/레이아웃은 현행 유지하되 아래 1건만 변경:
- **`아이콘 추가` 버튼을 구독 버튼 우측(헤더)에서 → 검색/액션 행의 `삭제` 버튼 우측으로 이동.**
  - 결과 행 순서(관리자): `검색창` · `전체 선택/해제` · `선택 해제(n)` · `삭제(n)` · **`아이콘 추가`**
  - 일반 사용자에게는 `아이콘 추가`/`삭제` 미노출(현행 규칙 유지).

### 3.3 ICON+ 탭 (신규)
`ICON_layout_02.jpg` 기준 3영역 레이아웃. 데스크톱 우선, 태블릿/모바일은 반응형 대응.

```
grid: [ 좌측 메인 아이콘 | 중앙 병합용 리소스 | 우측 속성 패널 ]
      minmax(196px,0.8fr)  minmax(440px,2fr)   minmax(300px,1fr)
```

- **좌측 — 메인 아이콘**
  - 제목 `메인 아이콘`, 설명 `병합 기준점이 저장되는 원본 아이콘입니다.`
  - 관리자: `메인 추가` 버튼 + 더보기 메뉴(전체 선택). 선택 시 `n개 선택됨 / 선택 해제 / 삭제`.
  - 세로 목록(좁은 2열). 카드에 마우스 오버 시 anchor 편집(십자선) 버튼(관리자).
  - 일반 사용자: 단일 선택만.
- **중앙 — 병합용 리소스 (2개 섹션)**
  - `병합용 아이콘` 섹션: 설명 `메인 아이콘의 절단 영역에 붙일 아이콘 리소스입니다.`, `아이콘 추가` 버튼.
  - `병합용 텍스트` 섹션: 설명 `문자나 라벨 형태의 SVG 리소스입니다.`, `텍스트 추가` 버튼.
  - 각 섹션 공통 헤더 액션(관리자): 추가 + 더보기(전체 선택), 선택 시 선택 개수/선택 해제/삭제.
  - **상호 배타 선택**: 병합용 아이콘과 병합용 텍스트 중 한쪽을 선택하면 다른 쪽 선택은 해제(일반 사용자 기준 각 1개).
- **우측 — 아이콘 속성 패널**
  - 상단: `대표 미리보기` (`메인 + 리소스 = 결과` 구조). 미선택 시 `선택된 대표 조합 없음` 안내.
  - `색상`: 문서 기준 10색 팔레트(아래 §7과 동일).
  - `선 두께`: 슬라이더 0.5~3, 0.5 단위.
  - `크기`: 슬라이더 16~256px, 4px 단위(다운로드 높이 기준). 목록 표시 크기는 최대 56px.
  - `다운로드 포맷`: SVG / PNG / JPG (ToggleGroup).
  - `초기화` 버튼(색상 검정 / 두께 1 / 크기 24 / 포맷 SVG), `다운로드` 버튼.

### 3.4 반응형
- 데스크톱: 3열 그리드.
- 태블릿: 메인+병합용을 상단 작업 영역, 속성 패널은 하단/Drawer.
- 모바일: 병합용 아이콘/텍스트를 탭으로 분리, 속성 패널은 하단 Sheet/Drawer(기존 ICON 탭의 `Sheet` 패턴 재사용).

---

## 4. 데이터 모델 계획

기존 `Post`(MinIO 스토리지)와 분리된 **신규 DB 모델**을 `prisma/schema.prisma`에 추가한다. SVG는 DB 텍스트로 저장.

```prisma
enum IconPlusType {
  MAIN
  MERGE_ICON
  MERGE_TEXT
}

model IconPlusResource {
  id         String       @id @default(cuid())
  type       IconPlusType
  name       String
  svgContent String       @db.Text        // 정규화·sanitize된 SVG 원본
  viewBox    String
  width      Float
  height     Float
  baseWidth  Float?                        // MAIN 전용
  baseHeight Float?                        // MAIN 전용
  anchorX    Float?                        // MAIN 전용 병합 기준 X
  anchorY    Float?                        // MAIN 전용 병합 기준 Y
  authorId   String?                       // 업로드한 관리자 추적(감사용, 선택)
  author     User?        @relation(fields: [authorId], references: [id], onDelete: SetNull)
  createdAt  DateTime     @default(now())
  updatedAt  DateTime     @updatedAt

  @@index([type, createdAt])
  @@map("icon_plus_resources")
}
```

- 공용 라이브러리 성격: 조회는 로그인 사용자 전체, 업로드/삭제/anchor 수정은 관리자만.
- `User`에 역참조 릴레이션 1줄 추가(선택). 감사 로그가 불필요하면 `authorId` 생략 가능.
- 마이그레이션은 사내 개발망 DB 기준으로 생성/적용. **주의: shadow DB에 실제 DB를 지정하지 말 것**(운영/개발 DB 보호, 메모리 정책 참조).

---

## 5. 병합 로직 (anchor 기반)

`icon-merger/src/lib/svg/merge-svg.ts`의 `mergeSvgsByAnchor()`를 `lib/svg/`로 이식한다.

- 메인 아이콘은 `anchorX/anchorY`(viewBox 좌표계)를 병합 기준점으로 가진다.
- 병합용 리소스의 좌상단을 메인의 anchor에 정렬.
- 결과 크기 재계산:
  - `resultWidth = max(mainWidth, anchorX + mergeWidth)`
  - `resultHeight = max(mainHeight, anchorY + mergeHeight)`
  - `viewBox = "0 0 resultWidth resultHeight"`
- 결과 SVG 구조: `<g data-layer="main">` + `<g data-layer="merge" transform="translate(...)">`.
- 미리보기·다운로드가 **동일 병합 함수**를 사용하도록 클라이언트 공통 유틸로 분리.
- 색상/두께 적용은 기존 `lib/svg/*`(`changeIconSvgProperties`, `changeSvgStrokeWidth` 등) 재사용 → **병합 로직과 속성 변환 로직의 중복 구현 방지**.

---

## 6. SVG 업로드 / 전처리

`icon-merger/src/lib/svg/process-svg.ts`를 `lib/svg/`로 이식(의존성: `sanitize-html`, `fast-xml-parser` — 미설치 시 추가).

- 허용 포맷: **SVG만**. 확장자 + MIME(`image/svg+xml`) + 크기(≤256KB) 검증.
- 서버 sanitize: 허용 태그/속성 화이트리스트, `script`·`foreignObject`·이벤트 핸들러·외부 URL·인라인 JS 제거.
- normalize: viewBox 없으면 width/height로 생성, 루트 태그 정규화, width/height/viewBox 메타데이터 추출.
- 타입별 업로드 정책:
  - `MAIN`: 1개씩만. **`anchorX/anchorY` 필수 입력**(업로드 다이얼로그에서 미리보기 위 클릭/드래그로 지정, 십자선 표시).
  - `MERGE_ICON` / `MERGE_TEXT`: 다중 업로드 허용, anchor 미입력.
- 업로드 다이얼로그는 Design5 `Dialog`/`Button`/`Input` 및 드래그앤드롭으로 재구현(기존 `IconUploadDialog` 패턴 참고).

---

## 7. 속성 / 색상 / 다운로드

- **색상 10종**(문서 기준): `#0060A9`, `#302BCF`, `#0C73EF`, `#2DA6FA`, `#5DD6D5`, `#DD524C`, `#FECC09`, `#999B9E`, `#000000`, `#FFFFFF`.
  - 흰색 선택 시: 카드 배경 검정 + 아이콘 흰색 + 색상 박스 테두리 `#E5E7EB` 예외 처리.
- **선 두께**: 0.5~3 (0.5 단위). **크기**: 16~256px(4px 단위, 다운로드 높이 기준), 미리보기 표시 크기 최대 56px.
- **초기화 기본값**: 색상 검정 / 두께 1 / 크기 24 / 포맷 SVG (선택 항목은 유지, 속성만 초기화).
- **다운로드**:
  - SVG: 클라이언트 Blob 생성.
  - PNG/JPG: Canvas 렌더 후 `toBlob`(JPG는 흰색 배경). 서버 변환이 필요하면 기존 `sharp` 기반 다운로드 라우트 패턴 참고.
  - 병합 결과는 비율 유지, 높이 기준으로 크기 적용.

> 색상/두께/크기/포맷의 값 정의와 SVG 변환은 **기존 `IconPropertyPanel` + `lib/svg/*`를 최대한 재사용**하고, 병합 결과 SVG에만 추가로 대응한다.

---

## 8. API 설계

신규 라우트(예: `app/api/icon-plus/`). 인증은 Design5 `requireAdmin()` / `getCurrentUser()` 사용.

| 메서드 | 경로 | 권한 | 설명 |
| --- | --- | --- | --- |
| GET | `/api/icon-plus?type=MAIN\|MERGE_ICON\|MERGE_TEXT` | 로그인 사용자 | 공용 라이브러리 타입별 조회 |
| POST | `/api/icon-plus` | 관리자 | SVG 업로드(검증·sanitize·normalize·DB 저장). MAIN은 anchor 필수 |
| DELETE | `/api/icon-plus` | 관리자 | id 배열 일괄 삭제 |
| PATCH | `/api/icon-plus/[id]` | 관리자 | MAIN 아이콘 `anchorX/anchorY` 수정 |

- 서버에서 UI 권한을 신뢰하지 않고 **관리자 권한 재검증**.
- SSR로 초기 목록을 내려주거나(서버 컴포넌트) 클라이언트에서 fetch 후 상호작용 처리. 기존 ICON 탭이 클라이언트 fetch 방식이므로 일관성을 위해 동일 방식 권장.
- 병합 자체는 MVP에서 클라이언트 처리. 서버 병합/다운로드가 필요해지면 `POST /api/icon-plus/merge` 추가 검토.

---

## 9. 권한 / 역할

- Design5 역할: `ADMIN` / `MEMBER` (`session.user.role`).
- 관리자: 업로드, 삭제, 전체 선택, anchor 수정, 병합/다운로드 전부.
- 일반 사용자(MEMBER): 조회 + 각 타입 단일 선택 + 병합 미리보기 + 속성 조정 + 다운로드. 업로드/삭제/전체 선택 미노출.
- API·서버에서 권한 재검증(클라이언트 숨김만으로 신뢰하지 않음).

---

## 10. 디자인 시스템 매핑 (필수 준수)

icon-merger의 하드코딩 값을 **Design5 시스템으로 치환**한다.

- 폰트/타이포그래피: Design5 전역 폰트·타이포 스케일 사용(자체 폰트 지정 금지).
- 색상: Tailwind 테마 토큰 / shadcn CSS 변수(`primary`, `destructive`, `muted-foreground`, `border`, `neutral-*` 등) 사용. `#1E6FFF` 등 icon-merger 하드코딩 색 제거.
  - 단, **아이콘 속성용 10색 팔레트**(§7)는 기능 사양이므로 그대로 사용.
- 컴포넌트: `components/ui/*`(`Button`, `Input`, `Dialog`, `AlertDialog`, `Sheet`, `Slider`, `ToggleGroup`, `Tooltip`, `Sonner` 등) 재사용. 없으면 shadcn로 추가.
- 선택 상태 강조/카드/여백/라운드/그림자는 기존 ICON 탭·카테고리 페이지 패턴과 일관되게.

---

## 11. 파일 구조 제안

```
app/_category-pages/icon/
  IconListPage.tsx            # 탭(ICON/ICON+) 추가, 기존 ICON UI 분리
  IconPlusWorkspace.tsx       # (신규) ICON+ 3영역 컨테이너

components/category-pages/IconCategory/
  IconCard.tsx                # 기존
  IconUploadDialog.tsx        # 기존
  IconPropertyPanel.tsx       # 기존(ICON+ 병합 결과 지원 확장 검토)
  iconplus/                   # (신규)
    MainIconPanel.tsx
    MergeResourceSection.tsx
    IconPlusCard.tsx
    IconPlusUploadDialog.tsx  # anchor 입력 포함(MAIN)
    AnchorEditDialog.tsx
    MergePreview.tsx
    IconPlusPropertyPanel.tsx

lib/svg/
  merge-svg.ts                # (신규 이식) anchor 병합
  process-svg.ts              # (신규 이식) sanitize/normalize
  (기존) color/ resize/ stroke/ properties  # 속성 변환 재사용

app/api/icon-plus/
  route.ts                    # GET/POST/DELETE
  [id]/route.ts               # PATCH(anchor)

prisma/schema.prisma          # IconPlusResource 모델 + IconPlusType enum
```

---

## 12. 단계별 개발 계획 (Phase)

**Phase 0 — 사전 준비**
- `sanitize-html`, `fast-xml-parser` 등 의존성 확인/추가.
- `prisma/schema.prisma`에 `IconPlusResource`/`IconPlusType` 추가 → 개발망 DB 마이그레이션(shadow DB 주의).

**Phase 1 — 탭 골격 & ICON 탭 정리**
- `IconListPage`에 `ICON`/`ICON+` 탭 도입, 기존 ICON UI를 `ICON` 탭으로 이동.
- `아이콘 추가` 버튼을 삭제 버튼 우측(액션 행)으로 이동.
- 완료 기준: 탭 전환 동작, ICON 탭 기존 기능 회귀 없음, 버튼 위치 변경 반영.

**Phase 2 — 데이터/전처리/API**
- `merge-svg.ts`, `process-svg.ts` 이식(인증/Prisma/토큰 교체).
- `/api/icon-plus` GET/POST/DELETE, `/api/icon-plus/[id]` PATCH 구현.
- 완료 기준: 관리자 업로드/삭제/anchor 수정, 사용자 조회, 비관리자 업로드 403.

**Phase 3 — ICON+ 레이아웃 & 목록**
- 3영역 레이아웃(`IconPlusWorkspace`), 좌측 메인/중앙 병합용 2섹션 구현.
- 섹션 공통 헤더 액션(추가/더보기 전체 선택/선택 개수/선택 해제/삭제), 상호 배타 선택.
- Design5 디자인 토큰·컴포넌트 적용.
- 완료 기준: 레이아웃이 `ICON_layout_02.jpg`와 유사, 타입별 목록 독립 표시.

**Phase 4 — 업로드 다이얼로그 & anchor 입력**
- SVG 드래그앤드롭 업로드, MAIN 단건 + anchor 클릭/드래그 지정(십자선), 병합용 다중 업로드.
- 완료 기준: 검증/ sanitize 통과, MAIN anchor 저장, 위험 SVG 차단.

**Phase 5 — 병합 미리보기**
- 선택 조합 → `mergeSvgsByAnchor` 실시간 미리보기(`메인 + 리소스 = 결과`).
- 완료 기준: 절단 영역 상단/좌측 정렬, 결과 viewBox 재계산, 미선택 시 다운로드 비활성.

**Phase 6 — 속성 조정 & 다운로드**
- 색상 10종(흰색 예외) / 선 두께 / 크기 / 포맷 / 초기화.
- SVG/PNG/JPG 다운로드(병합 결과 기준, `lib/svg/*` 재사용).
- 완료 기준: 속성 변경이 미리보기·다운로드에 반영, 3포맷 정상 저장.

**Phase 7 — 반응형/접근성/QA**
- 태블릿/모바일 대응(Sheet/Drawer), `aria-*`/키보드 접근성, 회귀 테스트.

---

## 13. 리스크 / 주의사항

- **저장소 분리**: ICON+는 반드시 DB 저장(오브젝트 스토리지 미사용). 기존 ICON 탭의 MinIO(`lib/s3/*`) 업로드/다운로드 로직을 재사용하지 말 것.
- **DB 마이그레이션**: 사내 개발망 DB는 외부 접근 불가. 마이그레이션/CI는 DB 비의존적으로. shadow DB에 실제 DB 지정 금지(리셋 위험).
- **디자인 토큰**: icon-merger의 하드코딩 색/폰트가 그대로 유입되지 않도록 코드 리뷰 시 확인.
- **SVG 보안**: 업로드 sanitize를 서버에서 반드시 수행. `dangerouslySetInnerHTML` 렌더는 sanitize된 콘텐츠에만 적용.
- **로직 중복 방지**: 색상/두께/크기 변환은 기존 `lib/svg/*` 재사용, 병합 결과에만 확장.
- **탭 상태/구독 버튼**: 두 탭 모두 구독 버튼 유지, 탭 전환 시 선택/속성 상태 처리 정책 정의(전환 시 초기화 권장).

## 14. 추후 검토 (MVP 범위 외)

- 서버 사이드 병합(`/api/icon-plus/merge`), 병합 프리셋 저장(`IconMergePreset`), 다운로드 이력.
- 중첩형/배지형 병합, 병합 위치 커스터마이징.
- ICON 탭과 ICON+ 라이브러리 연계(기존 아이콘을 병합 소스로 가져오기) — 필요 시 별도 논의.
