# 개발망 보안 장비 URL 차단 · 보안 점검 Handoff

> 개발망(design6) 앞단 보안 장비가 **요청 안의 외부 URL**을 탐지해 연결을 끊는 문제와, 이를 조사하다 발견한 앱·저장소 보안 문제 기록. Next16 업그레이드와 **무관**(코드 변경 없이 10-15 이후 앞단 정책 변경으로 추정).

- 최초 작성: 2026-10-27
- **현재 상태**
  - ⛔ 보안 장비 예외 — 전산팀 요청 대기(§3, 전달 문안 §3-1). **외부 URL이 든 게시물 등록은 여전히 실패**(2026-10-27 개발망 재확인)
  - ✅ SSRF(다운로드 프록시) — 수정·개발망 확인 완료(2026-10-27, §4-1)
  - ✅ MinIO 버킷 익명 쓰기 — 개발망 조치·확인 완료(2026-10-27), 운영망은 반영 때 같은 조치(§4-2)
  - ⬜ MinIO 계정 — 운영망 외부 공개 전 검토(§4-3)
- **다음 시작점**: §3-1 문안으로 전산팀 요청 → 예외 적용 후 §3-2로 확인(유튜브·SVG 등록, Google 로그인) → 운영망 반영 때 §4-2 서버 조치·§4-3 검토

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

## 3. 전산팀 요청 (⛔ 대기)

- 경로 몇 개만 예외로 두면 부족하다 — 사용자 입력·업로드 파일 어디서나 걸린다(§2-1). 도메인 단위 규칙 제외를 1안, 경로 예외를 2안으로 요청한다
- 운영망(design5)은 현재 이 정책 없음(Google 콜백 시험 요청이 앱까지 도달 — 업그레이드 handoff). **외부 공개 시 같은 정책이 붙는지** 함께 문의
- 이 규칙이 우연히 막고 있던 앱 취약점(§4-1·§4-2)은 앱·저장소에서 먼저 막았다 — 문안에 포함

### 3-1. 전달 문안 (그대로 복사해 전달)

> **제목: design6.pentasecurity.com 앞단 보안 장비 — 요청 내 URL 탐지 규칙 예외 요청**
>
> 안녕하세요. 디자인 자료 사이트(개발망 `design6.pentasecurity.com`) 관련 요청드립니다.
>
> **1. 현상**
> 10월 중순 이후 개발망에서 아래 기능이 실패합니다. 브라우저에는 연결 재설정(`ERR_CONNECTION_RESET` / `Failed to fetch`)으로 표시되고, 웹 서버(nginx)·앱 로그에 요청이 남지 않아 앞단 보안 장비에서 연결을 끊는 것으로 판단됩니다.
> - Google 계정 로그인(로그인 콜백 `/api/auth/callback/google?iss=https://accounts.google.com&code=…`)
> - 유튜브 링크가 포함된 게시물 등록·수정
> - SVG 등 내용 안에 URL이 들어 있는 파일 업로드(SVG는 표준 선언 `xmlns="http://www.w3.org/2000/svg"`를 항상 포함)
>
> **2. 확인한 차단 조건 (10/27 시험)**
> - 요청의 **쿼리 문자열이나 본문(JSON·폼·업로드 파일 포함)에 `design6.pentasecurity.com`이 아닌 호스트의 `http://`·`https://` 주소**가 있으면 연결이 끊깁니다. URL 인코딩된 값도 같습니다.
> - `www.pentasecurity.com` 같은 사내 도메인 주소도 차단됩니다.
> - 같은 요청에서 주소만 빼면 정상 처리됩니다(로그인 없는 요청이라 앱이 401로 응답).
>
> 재현 명령(로그인 없이 보내는 시험 요청이라 데이터는 생기지 않습니다):
> ```
> # 정상: 401 응답
> curl -s -o /dev/null -w "%{http_code}\n" -X POST https://design6.pentasecurity.com/api/posts -H "Content-Type: application/json" -d "{\"title\":\"t\"}"
> # 차단: 응답 없이 연결 끊김(000)
> curl -s -o /dev/null -w "%{http_code}\n" -X POST https://design6.pentasecurity.com/api/posts -H "Content-Type: application/json" -d "{\"u\":\"https://www.youtube.com/watch?v=dQw4w9WgXcQ\"}"
> ```
>
> **3. 요청 사항**
> - **1안(권장)**: `design6.pentasecurity.com`에 대해 「요청 파라미터·본문 안의 URL 탐지」(원격 파일 포함(RFI) 계열) 규칙을 제외해 주세요. 게시물 제목·본문 등 사용자가 입력하는 모든 칸과 업로드 파일에 URL이 들어갈 수 있어, 경로 몇 개만 예외로 두면 계속 누락이 생깁니다.
> - **2안**: 경로 단위 예외만 가능하다면 아래 경로를 요청드립니다.
>   - `/api/auth/callback/google` — Google 로그인
>   - `/api/` 아래 POST·PUT·PATCH 요청 — 게시물·공지·디자인 요청 등록·수정, 파일 업로드
>   - `/posts/` — 파일 저장소 업로드(서명된 업로드 주소로만 쓰기 가능)
>   - `/_next/image` — 이미지 표시(외부 썸네일 주소를 쿼리로 전달)
>
> **4. 앱 측 보완 조치 (완료)**
> 이 규칙을 빼도 문제가 없도록, 규칙이 함께 막고 있던 부분을 앱과 저장소에서 먼저 막았습니다(10/27 개발망 반영·확인).
> - 파일 다운로드 기능이 사용자가 넘긴 주소를 서버에서 대신 요청하던 부분을 **자사 파일 저장소 주소만 허용**하도록 수정(사내망 주소 조회 차단)
> - 파일 저장소의 **로그인 없는 쓰기 차단**(읽기만 허용)
>
> **5. 문의**
> - 적용 후 위 재현 명령의 두 번째 요청이 `401`로 응답하면 정상입니다. 적용 시점을 알려 주시면 기능 확인 후 회신드리겠습니다.
> - 운영망 `design5.pentasecurity.com`은 현재 이 현상이 없습니다. 외부 공개 시 같은 정책이 적용될 예정이라면 같은 예외를 함께 반영해 주실 수 있는지 알려 주세요.
>
> 감사합니다.

### 3-2. 예외 적용 후 확인 체크리스트

- [ ] 위 재현 명령 두 번째 요청 → `401`
- [ ] Google 로그인·로그아웃(로그아웃 후 계정 선택 → 로그인 완료)
- [ ] Penta Design 유튜브 링크 게시물 등록·수정, 카드 썸네일(유튜브) 표시
- [ ] CI/BI·아이콘 등 SVG 업로드, 인사이트 HTML 등록
- [ ] eDM 외부 링크 저장, 디자인 요청 본문에 링크 포함 등록
- [ ] 업그레이드 handoff의 해당 이슈(Google 콜백·유튜브/SVG) 완료 처리

## 4. 점검 중 발견한 보안 문제 (운영망 외부 공개 전 필수)

### 4-1. 다운로드 프록시 SSRF — ✅ 개발망 확인 완료(2026-10-27, `56e7c2f`)

- 문제: `/api/posts/files?url=`·`/api/posts/images?url=`·`/api/notices/download?url=`가 **로그인 없이**(`proxy.ts`가 `/api/*` 통과) 호출되고, `lib/b2.ts` `downloadFile`이 저장소 주소가 아니면 **임의 주소를 서버에서 `fetch`** → 외부에서 사내망(MinIO 9000, 다른 사내 서버 등) 조회 가능. 클라이언트 본문 URL을 받는 `generate-thumbnail(-svg)`도 같은 함수 사용
- 수정: `downloadFile`·`downloadFileWithRange`에 허용 주소 검사(`assertFetchableStorageUrl`) — **공개 저장소 베이스**(`NEXT_PUBLIC_S3_PUBLIC_BASE_URL`·`S3_PUBLIC_BASE_URL`·`NEXT_PUBLIC_EXTRA_PUBLIC_ASSET_BASES`, origin+경로 경계 비교로 `https://base.evil.com` 우회 차단)·**레거시 CDN 호스트**·**B2 호스트**만 fetch, 그 외 400 `허용되지 않은 파일 주소입니다.` 저장소 주소는 기존대로 S3 SDK로 버킷에서 읽음(변경 없음). 서버에서 사용자 URL을 fetch하는 곳은 이 두 함수뿐(전수 확인)
- 공개 프록시 3곳은 `ApiError`를 해당 상태(400)로 응답(이전엔 500)
- 검증(로컬): `lib/b2-download.test.ts` 12건(사설 IP·메타데이터 주소·localhost·외부·접두어 우회·`file:`·잘못된 URL 차단 / 공개 베이스·추가 베이스·레거시 CDN·B2 허용) 통과, typecheck·lint 통과, vitest 기존 실패 15건 외 전부 통과
- ⚠️ 개발망 DB에 **design5 주소**로 저장된 파일이 있으면 이제 400 → 그런 데이터가 있으면 개발망 `.env.app`의 `NEXT_PUBLIC_EXTRA_PUBLIC_ASSET_BASES`에 추가(NEXT_PUBLIC은 빌드 시 반영 — 리빌드 필요)
- 개발망 확인(2026-10-27)
  - [x] 각 메뉴 다운로드(CI/BI·캐릭터·아이콘·하드웨어·PPT·웰컴보드·다이어그램 ZIP·공지 첨부·디자인 요청 첨부) 정상 — 사용자 브라우저 확인
  - [x] 카드 썸네일·상세 이미지 정상 — 사용자 브라우저 확인
  - [x] `curl -s "https://design6.pentasecurity.com/api/posts/files?url=not-a-url"` → 수정 전 500 `Failed to parse URL…` / 수정 후 **400 `허용되지 않은 파일 주소입니다.`** 확인 (외부 주소로 시험하면 장비가 먼저 끊으므로 이 값으로 확인)
- 운영망: TOOLBOX 일괄 반영 때 리빌드로 함께 반영 → 같은 `curl`로 400 확인
- 후속(선택): 프록시 3곳 로그인 요구 여부 — 비로그인 열람 화면(공지 등) 영향 확인 후 결정

### 4-2. MinIO 버킷 익명 쓰기 — ✅ 개발망 조치·확인 완료(2026-10-27) · ⬜ 운영망

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
- 개발망 결과(2026-10-27): design6 서버에서 `d5miniobackup` alias로 5개 버킷 `download` 설정·시험 파일 삭제 → 익명 PUT **403**, 시험 파일 **404**, MinIO 썸네일 익명 읽기 **200**, 브라우저 이미지 표시·다운로드 정상
- 운영망: 반영 때 design5 서버에서 같은 `mc anonymous get/set` 실행(시험 파일 정리는 불필요) → 같은 `curl`(도메인만 design5)로 403 확인

### 4-3. MinIO 계정 — ⬜ 운영망 외부 공개 전 검토

- 현재 앱·백업(`mc` alias `d5miniobackup`·`local`)이 **루트 계정**(`MINIO_ROOT_USER`)을 그대로 쓰고, 비밀번호가 추측하기 쉬운 형태(2026-10-27 design6 `mc alias list`로 확인)
- 검토: 운영망 루트 비밀번호를 강한 값으로 교체, 앱(`S3_ACCESS_KEY_ID`)·백업에는 **버킷 범위로 제한한 별도 접속 키** 사용. 교체 시 `.env`·`.env.app`·서버 `~/.mc/config.json` 함께 갱신 후 앱 재기동

## 5. 변경 파일

- `lib/b2.ts`(허용 주소 검사), `lib/b2-download.test.ts`(신규)
- `app/api/posts/files/route.ts`·`app/api/posts/images/route.ts`·`app/api/notices/download/route.ts`(ApiError 상태 응답)
- `deploy/rocky/docker-compose.yml`(`minio-init` 버킷 익명 정책 public → download)
- `docs/SECURITY_url-filter_handoff.md`(신규), `docs/UPGRADE_next16-react19_handoff.md`·`docs/TOOLBOX_handoff.md`(링크)
