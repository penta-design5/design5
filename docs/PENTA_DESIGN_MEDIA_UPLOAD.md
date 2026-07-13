# Penta Design 미디어 업로드 확장 — 동영상(mp4) + 유튜브 링크 구현 계획

## Context (배경)

Penta Design(갤러리 카테고리, `slug: penta-design`)은 현재 **이미지만** 업로드 가능합니다. 사내 디자인팀에서 작업물에 **동영상(mp4)** 과 **유튜브 링크**도 함께 게시하고 싶다는 요청이 있었습니다.

- 동영상은 상세 페이지에서 썸네일을 클릭하면 다이얼로그로 재생되도록 함.
- 동영상 썸네일은 영상에서 프레임을 추출(첫 프레임은 검은 화면이 잦으므로 **1초 지점**)해 사용.
- 유튜브 링크는 여러 개 첨부 가능하고, 유튜브가 제공하는 썸네일(Open Graph)을 **직접 참조**하며, 못 불러오면 자체 카드로 대체.

### 확정된 결정사항 (사용자 확인)
1. **동영상 재생**: 스토리지(MinIO/S3) 공개 URL을 `<video>`에 직접 사용. 사내망에서 브라우저가 스토리지에 직접 Range 요청하므로 서버 부하 없음. (이미지도 동일 방식)
2. **동영상 크기 제한**: 동영상에 한해 **100MB**, 이미지는 기존 4.5MB 유지.
3. **동영상 썸네일**: 클라이언트에서 `<video>` + `canvas`로 **1초 지점** 프레임 캡처(길이가 짧으면 `min(1, duration/2)`).
4. **유튜브 썸네일**: `img.youtube.com`의 `maxresdefault → hqdefault` 순으로 시도, 모두 실패 시 유튜브풍(재생 아이콘+제목) 자체 스타일 카드로 대체.
5. **대표 썸네일 지정**: 이미지·동영상 프레임·유튜브 썸네일 모두 게시물 대표(커버)로 선택 가능.
6. **DB 마이그레이션 불필요**: `Post.images`가 `Json?`이라 배열 요소에 필드를 추가해도 스키마 변경 없음.

---

## 데이터 모델 (images 배열 요소 확장)

`Post.images`(JSON 배열)의 각 요소에 `type` 판별자를 추가합니다. `type` 미지정(기존 데이터)은 `image`로 취급 → **하위 호환 유지**.

```ts
type MediaItem = {
  type?: 'image' | 'video' | 'youtube'  // 없으면 image
  url: string           // image/video: 스토리지 원본 URL, youtube: watch URL
  thumbnailUrl?: string // image: 썸네일, video: 캡처프레임, youtube: img.youtube.com URL
  blurDataURL?: string  // image/video(캡처프레임)만
  videoId?: string      // youtube 전용
  name: string
  order: number
}
```

- 게시물 상단 `thumbnailUrl`(카드/목록 대표)은 선택된 대표 미디어의 `thumbnailUrl ?? url`로 저장 → 동영상/유튜브가 대표여도 이미지 썸네일이 들어감.

---

## 변경 파일 및 작업

### 1. 공용 유틸 (신규)
- **`lib/youtube.ts`** (신규): `parseYouTubeUrl(url)` → `{ videoId, watchUrl, embedUrl, thumbnailUrl }`.
  - `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/`, `youtube.com/embed/` 대응.
  - `embedUrl = https://www.youtube.com/embed/{id}`, `thumbnailUrl = https://img.youtube.com/vi/{id}/maxresdefault.jpg`.
  - 유효하지 않으면 `null` 반환.
- **`lib/video-thumbnail.ts`** (신규, 클라이언트): `captureVideoFrame(file: File, atSeconds = 1): Promise<Blob>`.
  - `URL.createObjectURL(file)` → `<video>` 로드 → `seekTo = Math.min(atSeconds, duration/2)` → `seeked` 이벤트 후 `canvas.drawImage` → `canvas.toBlob('image/jpeg', 0.85)`.
  - 크로스오리진/디코드 실패 시 첫 프레임 폴백.

### 2. 업로드 폼 — `components/category-pages/GalleryCategory/PostUploadDialog.tsx`
- 파일 input `accept="image/*,video/mp4"`로 확장 (기존 `:616`).
- **크기 검증 분기** (기존 `:331-342`): 이미지 4.5MB, `video/mp4` 100MB. mp4 외 동영상 타입은 거부.
- **유튜브 링크 입력 UI 신규**: URL 입력창 + "추가" 버튼 → `parseYouTubeUrl`로 검증 후 `youtubeLinks: {videoId,url,thumbnailUrl,name}[]` state에 누적(여러 개). 목록에서 개별 삭제/순서 이동.
- **미리보기/썸네일 선택/순서 이동 UI 통합**: 기존은 `existingImages(PostImage[])` + `selectedFiles(File[])` 2종. 여기에 동영상 파일(캡처 프레임 미리보기)과 유튜브 항목을 포함. 각 항목 타입 배지(이미지/▶동영상/YouTube) 표시. 대표 썸네일 선택은 모든 항목 대상(결정 5).
  - 재사용: 기존 `moveExistingImageUp/Down`, `moveSelectedFileUp/Down`, `selectedThumbnailIndex` 로직 패턴 유지하되 항목 배열을 미디어 항목으로 일반화.
- **onSubmit 업로드 로직** (기존 `:352-396`):
  - 동영상 파일: `captureVideoFrame`로 프레임 Blob 생성 → (a) mp4를 `/api/posts/upload`에 업로드해 `url` 획득, (b) 프레임 Blob을 이미지로 `/api/posts/upload`에 업로드해 `thumbnailUrl`+`blurDataURL` 획득 → `{type:'video', url, thumbnailUrl, blurDataURL, ...}` 구성.
  - 이미지: 기존과 동일 → `{type:'image', ...}`.
  - 유튜브: 업로드 없이 `{type:'youtube', url, videoId, thumbnailUrl, ...}` 구성.
  - `finalImages` 병합 후 `order` 재부여(기존 `:391`).
  - 대표 `thumbnailUrl` = 선택 항목의 `thumbnailUrl ?? url` (기존 `:395` 수정).

### 3. 업로드 API — `app/api/posts/upload/route.ts`
- 크기 제한 분기 (기존 `:23-27`): `video/*`는 100MB, 그 외 10MB.
- 비이미지(동영상) 파일은 이미 `uploadFile`로 원본 업로드 처리됨 (기존 `:62-71`) → 큰 변경 없음. mp4 MIME(`video/mp4`)만 허용하도록 화이트리스트 검증 추가.

### 4. 검증 스키마 — `app/api/posts/route.ts` & `app/api/posts/[id]/route.ts`
- 두 파일에 중복 정의된 `imageSchema` (route.ts:23, [id]/route.ts:10)에 필드 추가:
  - `type: z.enum(['image','video','youtube']).optional()`
  - `videoId: z.string().optional()`
  - (기존 `url`, `thumbnailUrl`, `blurDataURL`, `name`, `order` 유지)
- 공통화를 위해 **`lib/schemas/media.ts`** 로 스키마를 추출해 양쪽에서 import 권장(중복 제거).
- **삭제 로직 확인**: PUT/DELETE의 파일 삭제 루프([id]/route.ts:273, :447)는 `url`/`thumbnailUrl` 기준으로 `deleteFileByUrl` 호출. 동영상은 정상 삭제됨. **유튜브 항목은 스토리지 파일이 아니므로 삭제 건너뛰기** 분기 추가(`type==='youtube'`이거나 외부 URL이면 skip) — 불필요한 삭제 시도/경고 방지.

### 5. 상세 페이지 렌더링 — `components/category-pages/GalleryCategory/ImageGallery.tsx`
- 항목 `type`별 분기:
  - `image`: 기존 렌더 유지.
  - `video`: 썸네일(캡처 프레임) + 중앙 ▶ 오버레이. 클릭 시 재생 다이얼로그 오픈 → `<video controls autoPlay src={공개 URL}>`.
  - `youtube`: 썸네일(`maxresdefault`, onError 시 `hqdefault`, 재실패 시 자체 유튜브풍 카드) + ▶ 오버레이. 클릭 시 다이얼로그 → `<iframe src={embedUrl}?autoplay=1 allow="autoplay; fullscreen">`.
- **재생 다이얼로그 신규 컴포넌트** `components/category-pages/GalleryCategory/MediaPlayerDialog.tsx`: 기존 `@/components/ui/dialog` 재사용, 넓은 컨텐츠(`max-w-4xl`), 16:9 비율 컨테이너, video/youtube 소스 분기.
- 재사용: 이미지 src 패스스루는 공개 베이스면 그대로 반환하는 `getB2ImageSrc`(lib/b2-client-url.ts:39) 활용. 동영상 원본 URL도 공개 베이스이므로 동일 패스스루 사용.

### 6. 카드/그리드 — `PostCard.tsx` (확인 및 소폭 수정)
- 대표 썸네일은 상단 `post.thumbnailUrl`을 그대로 사용하므로 기본 동작 OK.
- 동영상/유튜브만 있는 게시물 카드에 ▶ 배지 오버레이 추가(선택적, UX 향상). 판별은 `images[대표].type`.

---

## 하위 호환 / 리스크

- 기존 이미지 게시물: `type` 없음 → `image`로 처리, 영향 없음.
- **유튜브 썸네일 사내망 접근**: `img.youtube.com` 도메인이 사내망에서 막힐 수 있음. → onError 폴백(고→저해상도→자체 카드)으로 대응(결정 4). 재생 iframe(`youtube.com/embed`)도 사내망에서 외부 접근 가능해야 재생됨 — 접근 불가 시 링크만 제공되는 한계는 문서에 명시.
- **동영상 공개 URL 직접 재생**: MinIO/S3가 Range 요청을 지원해야 시킹 원활(대부분 지원). 문제 시 대안으로 `downloadFileWithRange`(lib/b2.ts:181) 기반 프록시 라우트 신설 가능(현재는 미사용).
- `Post.fileType`/`mimeType`이 생성 시 `'image'`/`'image/*'`로 하드코딩됨(route.ts:295) — 표시용이 아니므로 유지, 필요 시 대표 미디어 타입 반영으로 개선 여지.

---

## 검증 (Verification)

DB는 사내 개발 서버에만 존재하므로, 개발망(design6/192.168.1.43)에 배포하거나 로컬 MinIO + 개발 DB로 확인.

1. **동영상 업로드**: penta-design에서 mp4(수십 MB) + 이미지 혼합 업로드 → 저장 성공, 목록 카드에 썸네일(1초 프레임) 노출 확인. 100MB 초과 파일은 거부되는지 확인.
2. **1초 프레임**: 앞부분이 검은 영상으로 첫 프레임 대비 1초 프레임이 실제 내용인지 확인.
3. **동영상 재생**: 상세 페이지에서 동영상 썸네일 클릭 → 다이얼로그 재생, 시킹(구간 이동) 동작 확인.
4. **유튜브 링크**: 여러 개 추가 → 저장 → 상세에서 썸네일 노출, 클릭 시 다이얼로그 임베드 재생. 사내망에서 썸네일 미로드 시 자체 카드 폴백 확인.
5. **대표 썸네일**: 동영상/유튜브를 대표로 지정 → 목록 카드 커버가 해당 썸네일인지 확인.
6. **하위 호환**: 기존 이미지 게시물 목록/상세/수정이 정상인지 회귀 확인.
7. **삭제**: 동영상 포함 게시물 삭제 시 스토리지 mp4/썸네일 삭제, 유튜브 항목은 삭제 시도 없이 통과하는지 로그 확인.
8. 관련 단위 테스트(`lib/youtube.ts` 파싱)는 DB 비의존으로 추가.
