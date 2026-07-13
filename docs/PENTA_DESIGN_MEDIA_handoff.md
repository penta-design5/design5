# Penta Design 미디어 업로드 확장 Handoff (진행 상태)

> 스펙 문서: [PENTA_DESIGN_MEDIA_UPLOAD.md](./PENTA_DESIGN_MEDIA_UPLOAD.md)
> **구현 진행 상태의 단일 원본(source of truth)은 이 문서다.** 계획서는 스펙으로 고정하고, 단계 진행/완료 시 이 문서만 갱신한다.

- 대상: **Penta Design**(갤러리 카테고리 `penta-design`) 게시물에 **동영상(mp4)** + **유튜브 링크** 첨부 지원. 상세 페이지에서 다이얼로그로 재생.
- 핵심 결정: `Post.images`(JSON) 요소에 `type`(image/video/youtube) 추가(**마이그레이션 불필요**) · 동영상 공개 URL 직접 재생 · 동영상 100MB · 썸네일 1초 프레임 캡처(클라이언트) · 유튜브 썸네일 직접 참조(고→저해상도→자체 카드 폴백) · 대표 썸네일은 전 미디어 지정 가능
- 최종 업데이트: 2026-07-14 (**P0~P4 완료 ✅** · P3 개발망 업로드/썸네일 정상 확인, P4는 상세페이지 placeholder 버그 수정으로 착수)
- **다음 세션 시작점: P5 착수** (카드 ▶ 배지) — 아래 진행 현황 참조. P4(상세 렌더링 타입 분기 + 재생 다이얼로그) 코드 반영·푸시 완료, 재생/시킹/폴백은 개발망 재검증 대기

범례: ⬜ 대기 · 🟡 진행중 · ✅ 완료 · ⛔ 블록

---

## 진행 현황 요약

| Phase | 내용 | 상태 | 브랜치/커밋 | 검증 |
| --- | --- | --- | --- | --- |
| P0 | 공용 유틸: `lib/youtube.ts`(URL 파싱) + `lib/video-thumbnail.ts`(1초 프레임 캡처) + `lib/media-schemas.ts`(공통 스키마) | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` (373bc22) | tsc 0 / lint 0(신규 3파일) / `youtube.test.ts` 21건 통과 |
| P1 | 업로드 API 확장 (`app/api/posts/upload/route.ts`): video 100MB 분기 + mp4 MIME 화이트리스트 | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` (373bc22) | tsc 0 / lint 0. 라우트 단독 호출자=갤러리 폼(확인). 실 업로드는 개발망 |
| P2 | 검증 스키마 확장(POST/PUT `imageSchema`에 `type`·`videoId`) + 삭제 루프 유튜브 skip 분기 | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` (373bc22) | tsc 0 / lint 신규경고 0(기존 `any` 경고만) |
| P3 | 업로드 폼(`PostUploadDialog.tsx`): accept 확장·크기분기·유튜브 입력 UI·미리보기/대표선택/순서이동 **통합 목록** | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` (33a2383) | tsc 0 / lint 신규경고 0(기존 `any` 2건만) / youtube 21건 통과. 실 업로드/캡처는 개발망 |
| P4 | 상세 렌더링(`ImageGallery.tsx`) 타입 분기 + 재생 다이얼로그 신규 `MediaPlayerDialog.tsx` (video=`<video>`, youtube=`<iframe embed>`) | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` (3945af3) | tsc 0 / lint 신규경고 0(기존 `any` 1건만). 개발망서 상세 placeholder 재발 확인 후 재검증 |
| P5 | 카드/그리드(`PostCard.tsx`) 동영상·유튜브 ▶ 배지 오버레이 | ⬜ 대기 | - | - |
| P6 | 통합 QA + 사내망 검증 (스펙 검증 8항목) | ⬜ 대기 | - | - |

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

### P5 — 카드 배지
- [ ] 동영상/유튜브 대표 게시물 카드에 ▶ 배지

### P6 — 통합 QA
- [ ] 스펙 "검증" 8항목 사내망 확인

---

## 사내망 확인 로그

(사내망 QA 결과를 여기에 누적 기록)

---

## 주의/리스크 메모

- **유튜브 외부 접근**: 사내망에서 `img.youtube.com`(썸네일)·`youtube.com/embed`(재생) 접근 가능 여부 확인 필요. 썸네일은 onError 폴백으로 대응, 재생 iframe 불가 시 한계 있음.
- **동영상 재생**: MinIO/S3 Range 지원 전제. 시킹 문제 시 `downloadFileWithRange`(lib/b2.ts) 기반 프록시 라우트 대안.
- **100MB 업로드 프록시 제한**: 앱 코드는 100MB 허용하나, 운영/개발망 앞단 리버스 프록시(nginx 등) `client_max_body_size`가 기본 1~10MB면 413으로 차단됨. 개발망 배포 시 프록시 바디 제한을 ≥100MB로 상향해야 함(인프라 설정, 코드 밖).
- **하위 호환**: 기존 이미지 게시물은 `type` 없음 → `image` 처리. 회귀 확인 필수.
- **DB/배포**: 마이그레이션 불필요(JSON 필드). 코드 배포만으로 반영. 검증은 개발망(design6/192.168.1.43) 우선.
