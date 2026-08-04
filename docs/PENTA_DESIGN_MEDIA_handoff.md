# Penta Design 미디어 업로드 확장 Handoff (진행 상태)

> 스펙 문서: [PENTA_DESIGN_MEDIA_UPLOAD.md](./PENTA_DESIGN_MEDIA_UPLOAD.md)
> **구현 진행 상태의 단일 원본(source of truth)은 이 문서다.** 계획서는 스펙으로 고정하고, 단계 진행/완료 시 이 문서만 갱신한다.

- 대상: **Penta Design**(갤러리 카테고리 `penta-design`) 게시물에 **동영상(mp4)** + **유튜브 링크** 첨부 지원. 상세 페이지에서 다이얼로그로 재생.
- 핵심 결정: `Post.images`(JSON) 요소에 `type`(image/video/youtube) 추가(**마이그레이션 불필요**) · 동영상 공개 URL 직접 재생 · 동영상 100MB · 썸네일 1초 프레임 캡처(클라이언트) · 유튜브 썸네일 직접 참조(고→저해상도→자체 카드 폴백) · 대표 썸네일은 전 미디어 지정 가능
- 최종 업데이트: 2026-08-04 (P0~P5 완료 · 후속 개선 P7·P8 추가 — 개발망 검증 대기)
- **상태: 코드 작업 P0~P5 완료 + 개발망 검증 통과. P6(사내망 통합 QA)은 사용자 판단으로 미진행(스킵). P7(순서 이동 최상단/최하단 버튼)·P8(대표 썸네일 선택 시인성 개선) 코드 완료, 개발망 검증 대기.**

범례: ⬜ 대기 · 🟡 진행중 · ✅ 완료 · ⛔ 블록 · ⏭️ 스킵

---

## 진행 현황 요약

| Phase | 내용 | 상태 | 브랜치/커밋 | 검증 |
| --- | --- | --- | --- | --- |
| P0 | 공용 유틸: `lib/youtube.ts`(URL 파싱) + `lib/video-thumbnail.ts`(1초 프레임 캡처) + `lib/media-schemas.ts`(공통 스키마) | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` (373bc22) | tsc 0 / lint 0(신규 3파일) / `youtube.test.ts` 21건 통과 |
| P1 | 업로드 API 확장 (`app/api/posts/upload/route.ts`): video 100MB 분기 + mp4 MIME 화이트리스트 | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` (373bc22) | tsc 0 / lint 0. 라우트 단독 호출자=갤러리 폼(확인). 실 업로드는 개발망 |
| P2 | 검증 스키마 확장(POST/PUT `imageSchema`에 `type`·`videoId`) + 삭제 루프 유튜브 skip 분기 | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` (373bc22) | tsc 0 / lint 신규경고 0(기존 `any` 경고만) |
| P3 | 업로드 폼(`PostUploadDialog.tsx`): accept 확장·크기분기·유튜브 입력 UI·미리보기/대표선택/순서이동 **통합 목록** | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` (33a2383) | tsc 0 / lint 신규경고 0(기존 `any` 2건만) / youtube 21건 통과. 실 업로드/캡처는 개발망 |
| P4 | 상세 렌더링(`ImageGallery.tsx`) 타입 분기 + 재생 다이얼로그 신규 `MediaPlayerDialog.tsx` (video=`<video>`, youtube=`<iframe embed>`) | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` (3945af3) | tsc 0 / lint 신규경고 0(기존 `any` 1건만). 개발망서 상세 placeholder 재발 확인 후 재검증 |
| P5 | 카드/그리드(`PostCard.tsx`) 동영상·유튜브 포함 배지 | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` (f178544) | tsc 0 / lint 신규경고 0(기존 `any` 3건만). 개발망 표시 확인 통과 |
| P6 | 통합 QA + 사내망 검증 (스펙 검증 8항목) | ⏭️ 스킵 | - | 사용자 판단으로 미진행 |
| P7 | 첨부 순서 이동에 **최상단/최하단 즉시 이동** 버튼 추가 (`PostUploadDialog.tsx`) | 🟡 개발망 검증 대기 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` (47ff255) | tsc 0 / lint 신규경고 0(기존 `any` 2건만). 개발망 동작 확인 필요 |
| P8 | **대표(커버) 썸네일 선택 시인성 개선** — 전용 강조색 토큰 `--cover`(#DD524C) + 테두리·디밍·라벨 확대 | 🟡 개발망 검증 대기 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` (b3deec1) | tsc 0 / lint 신규경고 0. Tailwind 실제 컴파일로 유틸 생성·`.dark` 반영 확인 |
| P9 | **재생 팝업 배경 클릭 시 목록으로 이탈하던 문제 수정** — 고스트 클릭 제거, 배경 클릭=팝업만 닫기 | 🟡 개발망 검증 대기 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` | tsc 0 / lint 0 |

> 진행 규칙: 각 Phase 착수 시 상태를 🟡, 완료 시 ✅ 로 갱신하고 브랜치/커밋·검증 결과를 채운다. 로컬은 DB 비의존(컴파일·유틸 단위테스트)까지, 실제 업로드/DB/재생은 개발망(로그인+DB+S3/MinIO) 검증으로 분리 기록한다.

---

## Phase별 상세 (착수/완료 시 이 아래에 기록)

### P0 — 공용 유틸 ✅
- [x] `lib/youtube.ts`: `parseYouTubeUrl(url)` → `{ videoId, watchUrl, embedUrl, thumbnailUrl }` / 무효 시 `null`. watch·youtu.be·shorts·embed·/v/·m.·nocookie 형식 대응. 헬퍼 `extractYouTubeId`·`youTubeEmbedUrl`·`youTubeThumbnailUrl(quality)` export
- [x] `lib/video-thumbnail.ts`(클라이언트): `captureVideoFrame(file, atSeconds=1)` → `min(1, duration/2)` 지점 캡처, 시킹 불가 시 현재 프레임 폴백. objectURL cleanup 포함
- [x] `lib/media-schemas.ts`: `mediaItemSchema`(type·videoId 추가) + `mediaArraySchema`(min 1) + `MEDIA_TYPES`/`MediaItem`/`MediaType` export. ※ 관례 `lib/*-schemas.ts`에 맞춤(당초 `lib/schemas/media.ts`에서 변경)
- 검증: `lib/__tests__/youtube.test.ts` 21건 통과(파싱·헬퍼, DB 비의존). tsc 0 / lint 0(신규 3파일)
- 커밋/푸시 완료(373bc22). 실제 프레임 캡처(브라우저 API)는 P3/개발망에서 통합 확인

### P1 — 업로드 API ✅
- [x] 형식·크기 검증 통합: 이미지 10MB / `video/mp4` 100MB, 그 외 형식(mp4 아닌 동영상 포함) 거부
- [x] 비이미지(mp4) 분기는 기존 `uploadFile`(원본만 업로드)로 처리 — 변경 없음. 동영상 썸네일은 클라이언트가 캡처 프레임을 별도 이미지 업로드로 처리(P3)
- [x] 호출자 확인: `/api/posts/upload`는 `PostUploadDialog`(갤러리)만 사용 → 형식 제한이 다른 기능에 영향 없음
- 검증: tsc 0 / lint 0. `requireAdmin` 게이팅 미변경(유지). 실제 100MB 업로드·nginx/프록시 바디 제한은 개발망 확인 필요(아래 리스크)

### P2 — 검증 스키마 & 삭제 로직 ✅
- [x] POST(`route.ts`)·PUT(`[id]/route.ts`) 모두 로컬 중복 `imageSchema` 제거 → `@/lib/media-schemas`의 `mediaArraySchema` 사용(`type`·`videoId` 포함). POST=`mediaArraySchema`, PUT=`.optional()`
- [x] PUT·DELETE 파일 삭제 루프에 `if (item.type === 'youtube') continue` 추가 — 외부 URL 삭제 시도/오류 방지. 파싱 타입 주석에도 `type?` 반영
- [x] 동영상 항목은 스토리지 파일이므로 기존 `deleteFileByUrl` 경로로 정상 삭제(원본 mp4 + 캡처 썸네일)
- 검증: tsc 0 / lint 신규 경고 0 (기존 `error: any`·`img: any` 경고 10건은 무관, 유지)

### P3 — 업로드 폼 UI 통합 ✅
- [x] `accept="image/*,video/mp4"` — 파일 선택 시 image/*·video/mp4 외 형식은 토스트로 거부(선택 단계)
- [x] 크기 검증 분기(이미지 4.5MB / mp4 100MB) — 제출 시 `source==='file'` 항목만 타입별 한도 검사
- [x] 유튜브 링크 입력 UI: URL 입력 + "유튜브 추가"(Enter 지원). `parseYouTubeUrl` 검증·중복 videoId 차단, 통합 목록에 누적/개별 삭제/순서 이동
- [x] **통합 미디어 목록으로 일반화**: 기존 `existingImages`+`selectedFiles` 2종 상태를 단일 `mediaItems: DraftMedia[]`로 통합(`source`=existing/file/youtube, `type`=image/video/youtube). 순서이동(`moveItem`)·삭제(`handleRemoveItem`)·대표선택(`selectedThumbnailIndex`)을 항목 무관 공통 처리. 항목별 타입 배지(이미지/동영상/YouTube) + 동영상·유튜브 ▶ 오버레이. 대표는 카드 클릭으로 지정(전 항목 대상)
- [x] 동영상 미리보기: 파일 선택 즉시 `captureVideoFrame`로 1초 프레임을 캡처해 objectURL 미리보기 + Blob 보관(제출 시 재사용). 캡처 완료 전엔 필름 아이콘 플레이스홀더
- [x] onSubmit: 동영상=(a)mp4 원본 업로드→`url` (b)캡처 프레임 이미지 업로드→`thumbnailUrl`/`blurDataURL` / 이미지=기존 단건 업로드 / 유튜브=업로드 없이 `{type,url:watchUrl,videoId,thumbnailUrl}` 구성. `order` 재부여, 대표 `thumbnailUrl = cover.thumbnailUrl ?? cover.url`
- [x] blob objectURL 생명주기: 삭제·닫기·언마운트·제출성공 시 해제, 캡처 완료 전 제거된 항목 누수 방지
- [x] 좌측 갤러리 미리보기 콜백(`PreviewImageItem`)에 `type`·`thumbnailUrl`·`videoId` 추가(P4 `ImageGallery` 타입 분기 대비). 파일 항목은 objectURL을 url/thumbnailUrl로 전달
- [x] open 세션당 1회 초기화 가드(`initializedRef`)로 편집 중 `post` 참조 변경에 의한 목록 덮어쓰기 방지
- 검증: tsc 0 / lint 신규경고 0(기존 `any` 2건: Post.images·catch만 유지) / `youtube.test.ts` 21건 통과. 실제 업로드·프레임 캡처·100MB·재생은 개발망(로그인+DB+S3/MinIO)에서 확인 필요

### P4 — 상세 렌더링 + 재생 다이얼로그 ✅
> 계기: 개발망 검증 중 상세페이지에서 동영상/유튜브가 **placeholder만** 표시됨. 원인=`ImageGallery`가 항목을 전부 `image.url`로 이미지 렌더 → 동영상(mp4)·유튜브(watch URL)는 이미지 로드 실패. 타입 분기로 해결.
- [x] `ImageGallery.tsx` 타입 분기: `mediaType = image.type ?? 'image'`. image=기존 렌더 유지, video·youtube=16:9 썸네일 + 중앙 ▶ 오버레이 버튼 → 클릭 시 재생 다이얼로그
- [x] 크기 프로빙 useEffect를 image 타입에만 실행(동영상/유튜브 `url`을 `new Image()`로 로드하던 헛요청 제거)
- [x] `MediaPlayerDialog.tsx` 신규: `max-w-4xl`·16:9. video=`<video src controls autoPlay playsInline>`(공개 URL 직접, 브라우저 Range), youtube=`<iframe embed?autoplay=1 allow="autoplay;fullscreen…">`. a11y용 `DialogTitle sr-only`
- [x] `MediaThumbnail` 서브컴포넌트: video=캡처 프레임(`thumbnailUrl`, 없으면 회색), youtube=maxresdefault→hqdefault→자체 유튜브풍 카드(빨간 아이콘+제목) onError 폴백. `videoId` 없으면 `extractYouTubeId(url)`로 보완
- [x] `postId` 변경 시 재생 다이얼로그 닫기. 편집 중 좌측 미리보기(P3 `previewImages`)도 동일 경로로 렌더됨
- 검증: tsc 0 / lint 신규경고 0(기존 `images as any` 1건 유지). **개발망에서 재검증 필요**: 상세 placeholder 해소·동영상 재생/시킹·유튜브 임베드 재생·사내망 썸네일 폴백(자체 카드)

### P5 — 카드 배지 ✅
> 결정: 당초 "대표 미디어에 중앙 ▶ 오버레이" 안은 **폐기**. 큰 중앙 ▶는 "카드 클릭=즉시 재생"으로 오해될 수 있는데 실제는 상세페이지 이동 후 재재생이라 어포던스 불일치. 대신 **우측 상단 소형 "영상" 배지**(재생 버튼이 아닌 "영상 포함" 종류 표시)로 구현.
- [x] `PostCard.tsx`: `getAllImages()` 항목 중 `type`이 `video`/`youtube`가 하나라도 있으면 `hasVideoMedia`=true
- [x] 배지: 우측 상단(`right-2 top-2`) 반투명 pill(`bg-black/60` + backdrop-blur), 채운 ▶ 아이콘 + "영상" 라벨. `z-10`으로 호버 오버레이 위. 대표가 이미지여도 게시물에 영상이 포함되면 표시
- [x] `PostImage`에 `type?: MediaType` 추가(판별용)
- 검증: tsc 0 / lint 신규경고 0(기존 `any` 3건 유지). 개발망 표시 확인 대기

### P6 — 통합 QA ⏭️ 스킵
- 사용자 판단으로 별도 사내망 통합 QA(스펙 검증 8항목)는 진행하지 않고 종료. 핵심 기능은 개발망(design6)에서 검증 완료(아래 로그 참조).

### P7 — 첨부 순서 최상단/최하단 즉시 이동 🟡
> 계기: 첨부 파일이 많을 때 한 칸씩(swap) 이동만 가능해 최상단·최하단으로 보내려면 클릭을 여러 번 반복해야 했다.
- [x] `moveItem(index, dir)`의 swap 로직을 **`moveItemTo(from, to)`(splice 기반)로 일반화** → 한 칸 이동·맨 처음/맨 마지막 이동을 한 함수로 처리. `moveItem`·`moveItemToStart`·`moveItemToEnd`가 모두 이를 호출
- [x] **대표(커버) 인덱스 재계산**: `selectedThumbnailIndex`가 인덱스 기반이라, 이동 구간 사이 항목이 한 칸씩 밀리는 것을 반영(`from<prev<=to → -1`, `to<=prev<from → +1`, `prev===from → to`). 인접 이동은 기존 swap과 동일 결과
- [x] UI: 카드 좌측 hover 영역을 `flex flex-col` → **`grid grid-cols-2`(2×2)** 로 변경. 배치는 `⇈ ↑` / `⇊ ↓` — **위 행=앞으로, 아래 행=뒤로**(세로 방향 의미 일치), 좌측 열=맨 끝까지, 우측 열=한 칸. 아이콘 `ChevronsUp`/`ChevronsDown` 추가, 버튼 크기 `h-6 w-6` 유지
- [x] `disabled`는 방향 단위 적용 — 첫 항목은 위쪽 2개, 마지막 항목은 아래쪽 2개 비활성. `title`: 맨 처음으로/한 칸 앞으로/맨 마지막으로/한 칸 뒤로
- [x] 목록 안내 문구에 겹화살표 동작 설명 추가
- 변경 파일: `components/category-pages/GalleryCategory/PostUploadDialog.tsx` **단 1개** (API·스키마·DB 무변경. `order`는 제출 시 배열 인덱스로 재부여, 좌측 미리보기도 `mediaItems` 파생이라 자동 반영)
- 검증: tsc 0 / lint 신규경고 0. **개발망 확인 필요**: ① 6개 이상 첨부 후 ⇈·⇊ 1클릭 이동 ② 이동 후 대표 표시가 원래 항목을 따라가는지 ③ 저장 후 상세페이지 순서 일치 ④ 편집 재진입 시 순서 유지 ⑤ 첫/마지막 항목 버튼 비활성

### P8 — 대표(커버) 썸네일 선택 시인성 개선 🟡
> 계기: 첨부가 많을 때 대표 지정 항목을 찾기 어려웠다. 원인 분석 결과 **`--primary`가 파란색이 아니라 `hsl(222.2 47.4% 11.2%)`(≈#0F172A, 거의 검정에 가까운 짙은 남색)** 이라 테두리·라벨이 썸네일 윤곽선과 구분되지 않았음. 다크모드에선 거의 흰색으로 뒤집혀 양쪽 모두 무채색.
- [x] **전용 강조색 토큰 신설** `--cover: 2 68% 58%`(#DD524C, 아이콘 프리셋·destructive와 동일 브랜드 레드) + `--cover-foreground: 0 0% 100%`. **`:root`와 `.dark`에 동일 값 고정** — `--destructive`는 다크에서 `hsl(0 62.8% 30.6%)`로 어두워져 강조 효과가 사라지므로 그대로 쓰지 않음
- [x] `tailwind.config.ts`에 색 등록. **키는 `cover`가 아니라 `cover-accent`** — `cover`로 두면 내장 유틸 `bg-cover`(`background-size`)와 클래스명이 충돌한다(현재 사용처는 없으나 향후 함정)
- [x] 대표 테두리: `border-2 border-primary` + `ring-2 ring-offset-2` → **`border-[3px] border-cover-accent` + `shadow-lg z-10`**. ring 제거 — 그리드 `gap-2`(8px)에서 `ring-offset-2`가 이웃 카드와 붙는 문제 해소. `box-sizing: border-box`라 카드 외곽 크기는 불변
- [x] **비대표 항목 `opacity-70` 디밍**(hover 시 100% 복귀) — 대비로 대표가 즉시 드러남. 항목이 많을 때 가장 효과가 큰 조치
- [x] 대표 라벨: `text-[10px]`·`py-0.5`·`bg-primary/80`(반투명 남색) → **`text-sm`(14px) `font-bold`·`py-1`·`bg-cover-accent`(불투명)·흰 글자 + `Star`(fill) 아이콘**. 반투명은 이미지가 비쳐 가독성이 떨어져 불투명으로 변경
- [x] **빨강 의미 충돌 해소**: 같은 카드의 삭제 버튼이 `variant="destructive"`(항상 빨강)여서 "빨강=대표"와 겹쳤음 → `variant="secondary"` + `hover:bg-destructive hover:text-destructive-foreground`로 변경(평상시 중립, hover 시에만 빨강)
- [x] 목록 안내 문구에 **`대표 썸네일: N번째 항목`**(강조색) 동적 표시 — 항목이 많아도 스캔 없이 위치 파악
- [x] a11y: 카드에 `aria-pressed={isCover}` + 상태별 `title`("현재 대표 썸네일" / "클릭하여 대표 썸네일로 지정")
- 변경 파일: `app/globals.css`(토큰) · `tailwind.config.ts`(색 등록) · `components/category-pages/GalleryCategory/PostUploadDialog.tsx`. 순수 스타일 변경으로 로직·API·DB 무관, 목록 카드·상세페이지 영향 없음
- 검증: tsc 0 / lint 신규경고 0. `npx tailwindcss` 실제 컴파일로 `border-cover-accent`·`bg-cover-accent`·`text-cover-accent-foreground` 생성 + `:root`/`.dark` 양쪽 `--cover` 반영 + `.bg-cover{background-size:cover}` 보존 확인. **개발망 확인 필요**: ① 첨부 다수에서 대표 항목이 한눈에 보이는지 ② 라벨 글자 크기·가독성 ③ 삭제 버튼 hover 시에만 빨강인지 ④ 안내 문구의 N번째가 실제 대표와 일치하는지(순서 이동·삭제 후에도) ⑤ 다크모드에서도 강조색 유지

### P9 — 재생 팝업 배경 클릭 시 목록 이탈 문제 수정 🟡
> 계기: 동영상/유튜브 팝업에서 배경을 무심코 클릭해 팝업만 닫으려 했는데 목록 페이지로 이동해 사용자가 당황. 이미지 확대는 다시 클릭하면 축소되어 상세에 머무는데 동영상만 이탈하는 비대칭.
- **원인은 두 가지였고 둘 다 막아야 한다.** (1차 시도에서 ①만 막아 개발망에서 증상이 그대로 재현됨 → 2차에서 ② 추가)
  - ① **고스트 클릭**: overlay에 pointerdown → Radix `onPointerDownOutside` 기본 동작으로 팝업 닫힘 → overlay 즉시 unmount → 뒤이어 도착한 click이 그 자리 아래 갤러리 배경 div(`GalleryDetailPage.tsx:315` `onClick={handleBackdropClick}`)에 떨어짐 → `router.push(목록)`
  - ② **React 트리 전파**: React 포털은 DOM 트리가 아니라 **React 트리**를 따라 이벤트를 전파한다. `MediaPlayerDialog`는 `ImageGallery.tsx:299`에 있고 그 `ImageGallery`는 `GalleryDetailPage.tsx:313` 배경 div의 자식이므로, overlay가 `body`로 포털되어도 클릭이 `handleBackdropClick`까지 **정상 전파**된다. 기존 `DialogContent`의 `stopPropagation`은 이 경로를 **콘텐츠에 대해서만** 막고 있었고 overlay에는 없었다
- [x] `MediaPlayerDialog.tsx`: `onPointerDownOutside={(e) => e.preventDefault()}` — pointerdown 기반 닫기를 끔(① 제거). overlay가 click 시점까지 살아있게 됨
- [x] `MediaPlayerDialog.tsx`: `overlayProps={{ onClick: (e) => { e.stopPropagation(); onClose() }, onPointerDown: stopPropagation }}` — 공용 `dialog.tsx`의 `overlayProps` 확장 포인트로 **click 시점에 팝업만 닫고 전파를 끊음**(② 제거)
- [x] `ImageGallery.tsx`: `MediaPlayerDialog`를 `<div className="contents" onClick/onPointerDown stopPropagation>`으로 감싸 **2차 방어**. 다이얼로그 내부 구조가 바뀌어도 이탈이 재발하지 않게 한 곳에서 차단(`GalleryDetailPage`가 `PostUploadDialog`를 감싸는 기존 패턴과 동일). `className="contents"`는 부모 flex(`space-y-4`)에 빈 박스가 끼어 여백이 생기는 것을 방지하며, `display:contents`는 CSS 박스만 없애므로 React 트리 전파 차단에는 영향 없음
- [x] 닫기 정책 주석을 실제 동작·원인에 맞게 갱신(기존 주석은 "배경 클릭은 목록 이동에 맡긴다"고 의도적 설계처럼 기술되어 있었음)
- 대안으로 검토했다가 폐기: `ImageGallery` → `GalleryDetailPage`로 재생 상태를 올려 `handleBackdropClick`에서 가드하는 방식. 고스트 클릭이 **팝업이 닫힌 뒤** 도착하므로 ref가 이미 false여서 새어나가고, "닫힌 직후 N ms 무시" 타이머 방어가 추가로 필요해 파일 3개를 건드리면서 더 취약함
- 변경 파일: `components/category-pages/GalleryCategory/MediaPlayerDialog.tsx` · `components/category-pages/GalleryCategory/ImageGallery.tsx`. 유튜브 팝업도 같은 다이얼로그를 쓰므로 함께 해결. 이미지 확대/축소는 별개 경로(`expandedIndex`)라 영향 없음
- 검증: tsc 0 / lint 0. **개발망 확인 필요**: ① 동영상 팝업 배경 클릭 → 팝업만 닫히고 상세 유지 ② 유튜브 팝업도 동일 ③ 닫기 버튼·ESC 정상 ④ 닫은 뒤 다른 영상/이미지 계속 열람 ⑤ **팝업이 없을 때 갤러리 회색 배경 클릭 → 기존대로 목록 이동(회귀 확인)** ⑥ 영상 시크바 드래그가 팝업을 닫지 않는지 ⑦ 모바일 터치 동작

---

## 사내망 확인 로그

- **2026-07-14 개발망(design6) 검증 통과**:
  - 업로드 다이얼로그: mp4·유튜브 링크 첨부, 썸네일(1초 프레임)·유튜브 썸네일 미리보기 정상. 미디어 안내 문구/배치·유튜브 placeholder 문구 수정 반영.
  - 상세페이지: 동영상/유튜브 썸네일 정상 표시(초기 placeholder 버그 → P4 타입 분기로 해결), 재생 다이얼로그에서 mp4·유튜브 재생 정상.
  - 재생 다이얼로그 닫기 UX: 배경 클릭=목록 이동, 우측 상단 닫기 버튼(기본 40% 투명, 호버 시 완전 표시)·ESC로만 팝업 닫힘. → **P9에서 배경 클릭=팝업만 닫기로 변경됨**
  - 목록 카드: 영상 포함 게시물에만 우측 상단 "영상" 배지 표시.
- 미확인(운영 배포 시 인프라 확인 필요): 100MB 실업로드 시 앞단 프록시 `client_max_body_size`, 사내망에서 `img.youtube.com`/`youtube.com/embed` 외부 접근(차단 시 썸네일은 자체 카드 폴백, 재생은 한계).

---

## 주의/리스크 메모

- **유튜브 외부 접근**: 사내망에서 `img.youtube.com`(썸네일)·`youtube.com/embed`(재생) 접근 가능 여부 확인 필요. 썸네일은 onError 폴백으로 대응, 재생 iframe 불가 시 한계 있음.
- **동영상 재생**: MinIO/S3 Range 지원 전제. 시킹 문제 시 `downloadFileWithRange`(lib/b2.ts) 기반 프록시 라우트 대안.
- **100MB 업로드 프록시 제한**: 앱 코드는 100MB 허용하나, 운영/개발망 앞단 리버스 프록시(nginx 등) `client_max_body_size`가 기본 1~10MB면 413으로 차단됨. 개발망 배포 시 프록시 바디 제한을 ≥100MB로 상향해야 함(인프라 설정, 코드 밖).
- **하위 호환**: 기존 이미지 게시물은 `type` 없음 → `image` 처리. 회귀 확인 필수.
- **DB/배포**: 마이그레이션 불필요(JSON 필드). 코드 배포만으로 반영. 검증은 개발망(design6/192.168.1.43) 우선.
