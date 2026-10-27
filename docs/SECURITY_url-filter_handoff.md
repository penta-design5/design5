# 개발망 보안 장비 URL 차단 · 보안 점검 Handoff

> 개발망(design6) 앞단 보안 장비가 **요청 안의 외부 URL**을 탐지해 연결을 끊는 문제와, 이를 조사하다 발견한 앱·저장소 보안 문제 기록. Next16 업그레이드와 **무관**(코드 변경 없이 10-15 이후 앞단 정책 변경으로 추정).

- 최초 작성: 2026-10-27
- **현재 상태**
  - ⛔ 보안 장비 예외 — 보안 담당 요청 필요(§3)
  - ✅ SSRF(다운로드 프록시) — 로컬 수정·테스트 완료, 개발망 확인 대기(§4-1)
  - 🟡 MinIO 버킷 익명 쓰기 — compose 수정 완료(public → download), 서버에서 기존 버킷 정책 변경·시험 파일 정리 필요(§4-2)
- **다음 시작점**: §4-2 서버 조치(개발망·운영망) → SSRF 수정 개발망 확인 → §3 예외 요청(§4 조치 완료 사실 함께 전달)

범례: ⬜ 대기 · 🟡 진행중 · ✅ 완료 · ⛔ 블록

---

## 1. 증상

| 메뉴 | 증상 |
| --- | --- |
| 로그인 | Google 로그인 콜백 `ERR_CONNECTION_RESET`(업그레이드 handoff 참고) |
| Penta Design | 유튜브 링크가 있는 게시물 등록·수정 시 `Failed to fetch` |
| CI/BI | SVG 업로드 시 `Failed to fetch` |

브라우저에는 `Failed to fetch`(연결 재설정)로만 보이고, **nginx·앱 로그에 아무것도 남지 않는다**(앱까지 오지 않음).

## 2. 장비 차단 규칙 (2026-10-27 개발망 실측, 비로그인 요청 → 앱 도달 시 401)

| 구분 | 결과 |
| --- | --- |
| 차단 주소 | **요청 호스트(design6)가 아닌 모든 호스트**의 `http://`·`https://`(대소문자 무관). `www.pentasecurity.com`·`design5`도 차단 |
| 허용 | `https://design6.pentasecurity.com/…`, 상대 경로, 스킴 없는 `www.youtube.com/…` |
| 검사 위치 | 쿼리(원문·URL 인코딩), JSON·form 본문, PUT 원시 본문, multipart 텍스트 필드·파일(PNG·HTML·PDF·SVG·octet-stream 확인) |
| 검사 안 함 | **응답**(SVG 내려받기 정상). multipart text/plain 파일·XMP 흉내 JPG는 통과 — 규칙이 완전히 일관되진 않음 |

재현(비로그인, 데이터 생성 없음):
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://design6.pentasecurity.com/api/posts \
  -H 'Content-Type: application/json' -d '{"title":"t"}'                                   # 401
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://design6.pentasecurity.com/api/posts \
  -H 'Content-Type: application/json' -d '{"u":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'  # 000(연결 끊김)
```

### 2-1. 영향 범위 (코드 전수 확인)

- **파일 업로드 — 사실상 전 메뉴**(파일 바이트에 외부 주소가 평문으로 있으면 실패)
  - MinIO 직접 PUT(`/posts/…`): CI/BI·캐릭터·PPT·웰컴보드(+관리)·바탕화면·하드웨어·카드 관리·범용 업로드·디자인 요청 첨부
  - multipart: `/api/posts/upload`(Penta Design)·`upload-icon`·`upload-ppt-thumbnail`·`/api/admin/notices/upload`·`/api/profile/upload-avatar`·`/api/edm`·`/api/icon-plus`·`/api/insights/posts`(HTML)
  - SVG·HTML은 항상, PDF·AI·EPS·Adobe 저장 JPG/PNG는 XMP 메타데이터(`http://ns.adobe.com/…`)가 있으면, ZIP·PPTX·DOCX는 압축이라 대체로 통과
- **입력값에 외부 주소** — 모든 입력란(제목·설명·태그·본문). 특히 Penta Design 유튜브(등록·**유튜브 포함 게시물 수정**), eDM 셀 링크(`cellLinks`), 디자인 요청 본문(tiptap 자동 링크), 공지 내용
- **쿼리로 주소 전달**: `/_next/image?url=https://img.youtube.com/…` → **유튜브 게시물 카드 썸네일 깨짐 예상**. 다운로드 프록시 `?url=`은 design6 주소면 정상, 다른 호스트(design5·옛 CDN/B2)로 저장된 데이터는 실패
- 영향 없음: TOOLBOX 8개 메뉴(브라우저 처리), QR 코드, Google 프로필 사진(브라우저가 Google에서 직접), 파일 내려받기(응답)

## 3. 보안 담당 요청 (⛔ 대기)

경로 예외로는 부족하다(사용자 입력·업로드 파일 어디서나 걸림). 요청안:

> design6.pentasecurity.com에서 **요청 쿼리·본문 안의 URL 탐지(원격 파일 포함/RFI 계열) 규칙을 제외**해 주세요. 영향: Google 로그인 콜백 `/api/auth/callback/google`, 게시물 등록·수정 `/api/*`(POST·PUT·PATCH), 파일 업로드 `/posts/`(MinIO, SVG 등), 이미지 최적화 `/_next/image`.

- 경로 단위만 가능하면 위 4개가 최소 범위
- 운영망(design5)은 현재 이 정책 없음(Google 콜백 B 요청이 앱 도달 — 업그레이드 handoff). **외부 공개 시 같은 정책이 붙으면 함께 반영 요청**
- 요청 전 §4 조치 완료(이 규칙이 우연히 막고 있던 SSRF를 앱에서 막음)를 함께 전달

## 4. 점검 중 발견한 보안 문제 (운영망 외부 공개 전 필수)

### 4-1. 다운로드 프록시 SSRF — ✅ 로컬 수정

- 문제: `/api/posts/files?url=`·`/api/posts/images?url=`·`/api/notices/download?url=`가 **로그인 없이**(`proxy.ts`가 `/api/*` 통과) 호출되고, `lib/b2.ts` `downloadFile`이 저장소 주소가 아니면 **임의 주소를 서버에서 `fetch`** → 외부에서 사내망(MinIO 9000, 다른 사내 서버 등) 조회 가능. 클라이언트 본문 URL을 받는 `generate-thumbnail(-svg)`도 같은 함수 사용
- 수정: `downloadFile`·`downloadFileWithRange`에 허용 주소 검사(`assertFetchableStorageUrl`) — **공개 저장소 베이스**(`NEXT_PUBLIC_S3_PUBLIC_BASE_URL`·`S3_PUBLIC_BASE_URL`·`NEXT_PUBLIC_EXTRA_PUBLIC_ASSET_BASES`, origin+경로 경계 비교로 `https://base.evil.com` 우회 차단)·**레거시 CDN 호스트**·**B2 호스트**만 fetch, 그 외 400 `허용되지 않은 파일 주소입니다.` 저장소 주소는 기존대로 S3 SDK로 버킷에서 읽음(변경 없음). 서버에서 사용자 URL을 fetch하는 곳은 이 두 함수뿐(전수 확인)
- 공개 프록시 3곳은 `ApiError`를 해당 상태(400)로 응답(이전엔 500)
- 검증(로컬): `lib/b2-download.test.ts` 12건(사설 IP·메타데이터 주소·localhost·외부·접두어 우회·`file:`·잘못된 URL 차단 / 공개 베이스·추가 베이스·레거시 CDN·B2 허용) 통과, typecheck·lint 통과, vitest 기존 실패 15건 외 전부 통과
- ⚠️ 개발망 DB에 **design5 주소**로 저장된 파일이 있으면 이제 400 → 그런 데이터가 있으면 개발망 `.env.app`의 `NEXT_PUBLIC_EXTRA_PUBLIC_ASSET_BASES`에 추가(NEXT_PUBLIC은 빌드 시 반영 — 리빌드 필요)
- 개발망 확인
  - [ ] 각 메뉴 다운로드(CI/BI·캐릭터·아이콘·하드웨어·PPT·웰컴보드·다이어그램 ZIP·공지 첨부·디자인 요청 첨부) 정상
  - [ ] 카드 썸네일·상세 이미지 정상
  - [ ] `curl -s "https://design6.pentasecurity.com/api/posts/files?url=not-a-url"` → 수정 전 500 `Failed to parse URL…`(2026-10-27 확인) / 수정 후 **400 `허용되지 않은 파일 주소입니다.`** (외부 주소로 시험하면 장비가 먼저 끊으므로 이 값으로 확인)
- 후속(선택): 프록시 3곳 로그인 요구 여부 — 비로그인 열람 화면(공지 등) 영향 확인 후 결정

### 4-2. MinIO 버킷 익명 쓰기 — ⬜ 서버 조치 필요

- 문제: **서명 없는 PUT으로 `posts` 버킷에 파일 저장 가능**(2026-10-27 개발망 확인 — 200 후 GET으로 저장 확인). 같은 도메인에서 SVG가 열리므로 스크립트 삽입 경로도 됨
- 근본 원인: `deploy/rocky/docker-compose.yml`의 `minio-init`이 5개 버킷 모두 **`mc anonymous set public`**(익명 읽기·쓰기·목록)으로 설정 — 데이터 평면 `up -d` 때마다 다시 적용됨. 이관 당시 메모(「개발 검증 목적 download, 운영 보안정책에 맞춰 재검토」 — `INTERNAL_MIGRATION_HANDOFF.md` §13)와 달리 compose가 public으로 남아 있었음
- ✅ compose 수정(2026-10-27): 5줄 `public` → **`download`**(익명은 읽기만). 브라우저 → 저장소 쓰기는 모두 presigned 서명 PUT·앱 API라 영향 없음(전수 확인), 이미지 표시(익명 읽기) 그대로
- ⬜ **이미 만들어진 버킷에는 compose 수정이 바로 적용되지 않음** → 개발망·**운영망 모두** 서버에서 한 번 실행(운영망도 같은 compose라 public일 가능성 높음, 운영 쓰기 시험은 하지 않음)
- **확인 시험으로 생성된 파일: 버킷 `posts`의 키 `posts/test/a.svg`(16바이트, URL `/posts/posts/test/a.svg` — nginx `/posts/`는 경로 그대로 MinIO에 전달하므로 앞 `posts`가 버킷) — 삭제 필요**
- 서버 조치(design6·design5 서버 안 — MinIO 포트는 `127.0.0.1:9000`만 열림):
  ```bash
  # 일회용 mc 컨테이너(minio-init과 같은 이미지·네트워크)
  docker run --rm -it --network design5-net --entrypoint /bin/sh minio/mc:RELEASE.2025-08-13T08-35-41Z
  # 컨테이너 안 — 계정은 데이터 평면 .env의 MINIO_ROOT_USER / MINIO_ROOT_PASSWORD
  mc alias set local http://minio:9000 <MINIO_ROOT_USER> <MINIO_ROOT_PASSWORD>
  for b in posts edms avatars icons ppt-thumbnails; do mc anonymous get local/$b; done   # public이면 문제
  for b in posts edms avatars icons ppt-thumbnails; do mc anonymous set download local/$b; done
  mc stat local/posts/posts/test/a.svg && mc rm local/posts/posts/test/a.svg   # 시험 파일 정리(개발망만, 버킷 posts + 키 posts/…)
  exit
  ```
  - 서버에 백업용 `mc` alias(`d5miniobackup`·`local`, `scripts/backup-minio.sh`)가 있으면 컨테이너 없이 그 alias로 실행해도 됨(design6은 둘 다 설정돼 있음 — 2026-10-27 확인)
- 확인: `curl -s -o /dev/null -w "%{http_code}\n" -X PUT https://design6.pentasecurity.com/posts/posts/test/b.txt --data-binary x` → **403**이어야 함(조치 전 200). 이미지 표시·게시물 업로드 정상 확인

### 4-3. MinIO 계정 — ⬜ 운영망 외부 공개 전 검토

- 현재 앱·백업(`mc` alias `d5miniobackup`·`local`)이 **루트 계정**(`MINIO_ROOT_USER`)을 그대로 쓰고, 비밀번호가 추측하기 쉬운 형태(2026-10-27 design6 `mc alias list`로 확인)
- 검토: 운영망 루트 비밀번호를 강한 값으로 교체, 앱(`S3_ACCESS_KEY_ID`)·백업에는 **버킷 범위로 제한한 별도 접속 키** 사용. 교체 시 `.env`·`.env.app`·서버 `~/.mc/config.json` 함께 갱신 후 앱 재기동

## 5. 변경 파일

- `lib/b2.ts`(허용 주소 검사), `lib/b2-download.test.ts`(신규)
- `app/api/posts/files/route.ts`·`app/api/posts/images/route.ts`·`app/api/notices/download/route.ts`(ApiError 상태 응답)
- `deploy/rocky/docker-compose.yml`(`minio-init` 버킷 익명 정책 public → download)
- `docs/SECURITY_url-filter_handoff.md`(신규), `docs/UPGRADE_next16-react19_handoff.md`·`docs/TOOLBOX_handoff.md`(링크)
