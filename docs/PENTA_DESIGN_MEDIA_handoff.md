# Penta Design 미디어 업로드 확장 Handoff (진행 상태)

> 스펙 문서: [PENTA_DESIGN_MEDIA_UPLOAD.md](./PENTA_DESIGN_MEDIA_UPLOAD.md)
> **구현 진행 상태의 단일 원본(source of truth)은 이 문서다.** 계획서는 스펙으로 고정하고, 단계 진행/완료 시 이 문서만 갱신한다.

- 대상: **Penta Design**(갤러리 카테고리 `penta-design`) 게시물에 **동영상(mp4)** + **유튜브 링크** 첨부 지원. 상세 페이지에서 다이얼로그로 재생.
- 핵심 결정: `Post.images`(JSON) 요소에 `type`(image/video/youtube) 추가(**마이그레이션 불필요**) · 동영상 공개 URL 직접 재생 · 동영상 100MB · 썸네일 1초 프레임 캡처(클라이언트) · 유튜브 썸네일 직접 참조(고→저해상도→자체 카드 폴백) · 대표 썸네일은 전 미디어 지정 가능
- 최종 업데이트: 2026-07-13 (**P0~P2 완료 ✅ · 커밋/푸시 완료** · `origin/2026-06-17-tiper`)
- **다음 세션 시작점: P3 착수** (업로드 폼 통합) — 아래 진행 현황 참조. P0~P2(공용 유틸·업로드 API·검증 스키마)는 코드 반영·푸시 완료, 실제 업로드/재생은 개발망 검증 대기

범례: ⬜ 대기 · 🟡 진행중 · ✅ 완료 · ⛔ 블록

---

## 진행 현황 요약

| Phase | 내용 | 상태 | 브랜치/커밋 | 검증 |
| --- | --- | --- | --- | --- |
| P0 | 공용 유틸: `lib/youtube.ts`(URL 파싱) + `lib/video-thumbnail.ts`(1초 프레임 캡처) + `lib/media-schemas.ts`(공통 스키마) | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` (373bc22) | tsc 0 / lint 0(신규 3파일) / `youtube.test.ts` 21건 통과 |
| P1 | 업로드 API 확장 (`app/api/posts/upload/route.ts`): video 100MB 분기 + mp4 MIME 화이트리스트 | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` (373bc22) | tsc 0 / lint 0. 라우트 단독 호출자=갤러리 폼(확인). 실 업로드는 개발망 |
| P2 | 검증 스키마 확장(POST/PUT `imageSchema`에 `type`·`videoId`) + 삭제 루프 유튜브 skip 분기 | ✅ 완료 | `refactor/phase2-api-layer` → `origin/2026-06-17-tiper` (373bc22) | tsc 0 / lint 신규경고 0(기존 `any` 경고만) |
| P3 | 업로드 폼(`PostUploadDialog.tsx`): accept 확장·크기분기·유튜브 입력 UI·미리보기/대표선택/순서이동 **통합 목록** | ⬜ 대기 | - | - |
| P4 | 상세 렌더링(`ImageGallery.tsx`) 타입 분기 + 재생 다이얼로그 신규 `MediaPlayerDialog.tsx` (video=`<video>`, youtube=`<iframe embed>`) | ⬜ 대기 | - | - |
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

### P3 — 업로드 폼 UI 통합
- [ ] `accept="image/*,video/mp4"`
- [ ] 크기 검증 분기(이미지 4.5MB / mp4 100MB)
- [ ] 유튜브 링크 입력 UI(URL+추가, 여러 개 누적, 개별 삭제/순서)
- [ ] 미리보기·대표선택·순서이동을 "종류 무관 미디어 항목" 통합 목록으로 일반화 (동영상=캡처 프레임 미리보기, 항목별 타입 배지)
- [ ] onSubmit: 동영상=프레임 캡처→mp4+썸네일 각각 업로드, 유튜브=업로드 없이 메타 구성, 대표 `thumbnailUrl ?? url`
- 검증: tsc/lint (실 업로드는 개발망)

### P4 — 상세 렌더링 + 재생 다이얼로그
- [ ] `ImageGallery.tsx` 타입 분기(image 기존 / video·youtube 썸네일+▶)
- [ ] `MediaPlayerDialog.tsx` 신규: video=`<video controls autoPlay>`, youtube=`<iframe embed?autoplay=1>`, 16:9
- [ ] 유튜브 썸네일 onError 폴백(maxres→hq→자체 카드)
- 검증: 개발망에서 재생/시킹/폴백

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
