# ICON 아이콘명 동기화 — 계획 / handoff

> 작성일: 2026-07-20 · 갱신: 2026-07-21
> 대상: 레거시 **ICON 탭**(`Post` 모델 기반). ICON+ 탭(`IconPlusResource`)은 이 작업과 무관.
> 상태: **논의·설계 완료, 구현 착수 전.** 커밋/푸시 안 함.
> ✅ **Figma SVG 추출 완료** (§6). 383개/14그룹 → `~/Downloads/Test/penta-icons/<group>/<name>.svg`, 색상 `currentColor` 통일.
> ✅ **merge-icon 44개 추출·이름 매칭 완료** (§6-B). 33개 카탈로그명 매칭 + 11개 미매칭(sm-N 유지).
> 다음: 그룹 필드 확정 → `IconTab` UI → 재구축 스크립트.

---

## 1. 배경 / 목표

- 원본 피그마 기준 아이콘 이름이 바뀌었고, 현재 업로드된 ICON 개수와 피그마(=제공 JSON) 개수가 일치하지 않음.
  - 운영망 기존 아이콘: **294개** (ICON+ 탭 제외)
  - 제공 JSON 아이콘: **383개**, **14개 카테고리**
- 목표: ICON 탭 아이콘을 제공 JSON 기준으로 정리(이름·구성 일치).

### 데이터 소스 (제공 파일)
- `펜타아이콘-라이브러리.json` — `icons` 객체가 `이름 → 완성 SVG` 매핑. (동일 세트가 `penta-design-system-UIPPT.html`의 `window.PENTA_ICONS`에도 포함)
- **JSON SVG는 그대로 렌더 가능**: `transform="translate(-36,0)"` 등 스프라이트 오프셋이 있으나 `viewBox="0 0 24 24"`가 보정 → 단독 렌더 정상. 별도 가공 불필요.
- 이름 키(`check-circle`, `car-front-connected` 등)가 이미 `a-z0-9-`만 사용 → MinIO 키 정제 규칙(`[^a-zA-Z0-9.-]→_`)에 안 걸리고 그대로 보존.

---

## 2. 현행 구조 (확인 완료)

- **이름 저장 위치**: `Post.title` = 업로드 파일명에서 `.svg` 제거한 값. Storage 키가 아니라 **DB 컬럼**.
  - 참고: [app/api/posts/upload-icon/route.ts](../app/api/posts/upload-icon/route.ts)
- **파일 저장**: MinIO/S3 `icons` 버킷, 키 = `{timestamp}-{정제파일명}`. `Post.fileUrl`/`thumbnailUrl`에 **각 환경 MinIO의 공개 URL** 저장. 원본 파일명은 `Post.images[0].name`에도 보존.
- **ICON 탭은 단일 카테고리**: `categorySlug` 하나 아래 `Post`들을 조회·생성. 하위 카테고리 개념 없음.
  - 참고: [app/_category-pages/icon/IconTab.tsx](../app/_category-pages/icon/IconTab.tsx) (`category.slug`로 `/api/posts` 호출)
- **`Post` 모델 여유 필드**: `subtitle`, `description`, `concept`, `tool`, `tags PostTag[]` 존재 → 그룹값 저장 자리 있음(스키마 변경 없이 재사용 가능).
  - 참고: [prisma/schema.prisma](../prisma/schema.prisma) `model Post`

---

## 3. 확정된 방침

### (A) 카테고리: 단일 카테고리 유지 + 목록에서 14개 그룹 구분 표시
- DB 카테고리는 기존처럼 **하나**. 새 카테고리(페이지) 만들지 않음.
- 각 아이콘에 **그룹값**(JSON의 `c`, 예: `vehicle`)을 저장하고, 목록에서 HTML 문서처럼 **카테고리 섹션 헤더 + 필터 칩**으로 표시.
- 그룹값 저장: `Post`의 기존 여유 필드 재사용(예: `subtitle` 또는 `concept`) → **마이그레이션 불필요**. (정석은 `tags`지만 작업량 ↑)
- 프론트 작업: `IconTab.tsx`에서 그룹값 기준 섹션 그룹핑 + 칩 UI 추가, `/api/posts` 응답에 해당 필드 포함되도록 정렬.
- **이 로직은 사내 개발망(design6)에서 개발/검증.**

### (B) 데이터 반영: 운영망에서 "전체 제거 후 재업로드(재구축)"
- 이름 매칭(퍼지/콘텐츠 지문)보다 재구축이 깔끔 → 이름·개수(정확히 383)·SVG가 한 번에 확정, 매칭 검토 불필요.
- **운영망(design5) DB + 운영망 MinIO를 대상으로 직접 실행.**

---

## 4. ⚠️ 환경 이관 관련 핵심 결론

**"개발망에서 동기화 → 그 DB를 운영망으로 옮기기"는 금지.** 아이콘 데이터는 실제로 운영망에 있으므로, 동기화는 "운영망을 대상으로 실행하는 재현 가능한 작업"으로 설계한다.

옮기면 안 되는 이유:
- **전체 DB 이관 = 재앙**: 아이콘 외 다른 테이블(사용자·타 카테고리 게시물 등)까지 덮어씀.
- **Storage URL 깨짐**: Post의 `fileUrl`/`thumbnailUrl`은 각 환경 MinIO URL. 개발망 행을 운영망에 넣으면 URL이 내부망(외부 접속 불가) Storage를 가리켜 운영망에서 이미지 전부 깨짐.
- **외래키 불일치**: `authorId → User.id`, `categoryId → Category.id`의 id가 환경마다 달라 FK 어긋남.
- **개발 DB는 일회용**: reset(migrate reset + seed) 대상이라 결과 보존 안 됨.
- **배포 경로도 DB 아님**: `git push → 서버 pull`은 **코드**만 옮김. DB는 대상 환경에서 `prisma migrate deploy`(스키마) + 데이터 스크립트로 처리.

### 올바른 실행 패턴
JSON은 환경 독립적(이름+SVG 자체 완결)이므로:
1. 동기화를 **환경 무관 일회성 스크립트**로 작성 (JSON → 대상 MinIO 업로드 + 대상 DB에 Post 반영).
2. **개발망에서는 로직 테스트만** (결과물 버려도 됨).
3. 검증 후 **같은 스크립트를 운영망 DB + 운영망 Storage에 직접 실행.**

---

## 5. 재구축 절차 (운영망)

일회성 스크립트로:
1. **백업**: 대상 아이콘 카테고리의 기존 `Post`를 `id/title/fileUrl/images` 등으로 덤프(롤백용).
2. **삭제**: 해당 카테고리 기존 `Post` 전체 삭제 + MinIO `icons` 버킷의 해당 파일 정리.
3. **재적재**: JSON 순회 → 각 SVG를 운영 MinIO에 PUT → `Post` 생성(`title = JSON 키`, 그룹값 = JSON `c`).
4. **검증**: 운영망에서 개수(383)·이미지·그룹 표시 확인.

### 실행 전 필수 확인 (파괴적 작업)
- [ ] 기존 아이콘 `Post` 백업 완료
- [ ] 연관관계 확인: 댓글/좋아요/다운로드 이력 등 참조가 걸린 경우 삭제 시 cascade/차단 여부
- [ ] 카테고리 slug·id 확인 (운영망 기준)
- [ ] **사전 확인 승인** (운영망은 곧 외부 공개 예정)
- [ ] 시드는 [prisma/seed.ts](../prisma/seed.ts) 대신 **별도 일회성 스크립트**로 (운영 데이터 취급)

---

## 6. Figma에서 아이콘 SVG 원본 추출 (✅ 완료 — 2026-07-21)

### ✅ 실행 결과 (B안 REST API로 완료)
- **방법**: A안(MCP)은 이 세션에서 원격 `mcp.figma.com` 도구 미로딩(비대화형 OAuth 불가)·로컬 Dev Mode(3845)는 SVG export 도구 없음 → **B안 REST API** 사용. 토큰은 `~/.figma_token`.
  - 트리: `GET /v1/files/zIICDqUtkcbUx95w1WalS5/nodes?ids=144:2`
  - export: `GET /v1/images/…?ids=…&format=svg` → URL 다운로드
  - 스크립트: 세션 scratchpad `extract_icons.py` (환경 무관, 재실행 가능)
- **결과**: `~/Downloads/Test/penta-icons/<group>/<name>.svg` — **383개 / 14그룹**, 실패 0.
- **검증**: Figma 385노드 = 383 고유이름, **JSON(383) 키와 100% 일치**(차집합 0).
- **중복 2개**: `gears`(general↔ai), `ai`(device↔ai)는 전용 `ai` 섹션 소속으로 배정 → ai=3(ai-settings·gears·ai), general=94, device=48.
- **그룹 매핑의 유일 출처 = Figma 섹션**: JSON `icons`에는 카테고리 정보 없음(이름→SVG만). 따라서 name→group 매핑은 Figma 추출로만 확보됨(이 추출의 핵심 가치).
- **색상**: Figma export 원본은 `#3A4253`(주)+`#231F20`/`#010101`(불균일) → **전부 `currentColor`로 통일**(사용자 승인). 앱이 렌더 시 색 지정(design5 기본 #000000)하므로 유연. §5 재적재도 currentColor 기준.
- **그룹별 개수**: ai 3 / automotive 23 / device 48 / finance 25 / general 94 / medical 3 / misc 16 / people 19 / place 21 / security 23 / server 25 / traffic 29 / vehicle 53 / weather 1.

### 6-B. merge-icon(조합/12px) 세트 추출·이름 매칭 (✅ 완료 — 2026-07-21)
- **대상**: Figma node **218-151**(12×12 소형 "조합 Icon" 44개, 이름이 `icon/sm-1…44` placeholder).
- **저장**: `~/Downloads/Test/penta-icons/merge-icon/` — 44개, `currentColor` 통일. (병합용)
- **이름 매칭 방법**: sm 아이콘은 의미 이름이 없어 **모양(도형)으로 카탈로그 383개와 대조**. 좌표 지문(스케일 무관)으로 후보 축소 → 래스터 IoU(sharp/librsvg, 64px 이진화 겹침) → **후보를 육안 비교 시트로 최종 확정**. (좌표 정확일치는 12px 재드로잉이라 실패, IoU만으론 충돌 발생 → 육안 확정 필수.)
- **결과**: **33개 카탈로그 이름 매칭 확정**(fingerprint, award, settings, cpu, globe-2, wifi, bell, edit, download, upload, share, star, user, bluetooth, folder, clock, mail, lock, unlock, shield, ban, trophy, key-2, blocks-2, network, bomb, missile, target, toggle, map-pin, cloud, server, key).
- **미매칭 11개**(카탈로그에 정확한 twin 없음 — 이름·grep·전 그룹 육안 스캔으로 확인): `sm-1, sm-2, sm-4, sm-5, sm-7, sm-8, sm-9, sm-28, sm-29, sm-30, sm-32`. 현재 **원래 sm-N 이름 그대로 저장**(사용자 결정). ±/체크 배지·원+/원−·해골·회전화살표·노드토폴로지 등 신규/변형 도형.
  - 향후 이름 제안(참고, 미적용): sm-1→badge, sm-2→badge-check, sm-4→award-plus, sm-5→award-minus, sm-7→plus-circle, sm-8→minus-circle, sm-9→award-check, sm-28→skull, sm-29→rotate, sm-30→sync, sm-32→sitemap.
- **작업 스크립트(세션 scratchpad, 재사용 가능)**: `extract_icons.py`(REST 추출), `match_icons.mjs`(IoU 매칭), `compare.mjs`/`targeted.mjs`/`groupsheet.mjs`(비교 시트).

<details><summary>(원 계획 — 참고용)</summary>

---

## 6-원안. Figma에서 아이콘 SVG 원본 추출

재구축(§5)에 쓸 SVG 원본을 **Figma 파일에서 직접 추출**하기로 결정. (앞서 로컬 축소본 `~/Downloads/Test/icon-sm/`는 12×12·번호 파일명이라 도형 대조로 25개만 이름 확정됐고 신뢰도 한계 → 원본 추출로 전환.)

- **Figma 파일**: https://www.figma.com/design/zIICDqUtkcbUx95w1WalS5/Penta-Design-System?node-id=144-2
- **구조**: `Icon Catalog(node 144-2) > Section: <group> > Grid: <group> > icon/<name>`

### 확정 옵션 (사용자 승인 완료)
- **파일명**: `icon/user` → `user.svg` (`icon/` 접두사 제거)
- **폴더(그룹)**: 섹션 영문 슬러그 — `general, people, vehicle, automotive, traffic, server, security, device, finance, place, medical, weather, ai, misc`
- **색상**: `#000000` (design5 ICON 탭 기본색. 코드 확인: `components/category-pages/IconCategory/IconPropertyPanel.tsx` `DEFAULT_COLOR='#000000'`)
- **저장 위치**: `~/Downloads/Test/<group>/<name>.svg`
- **범위**: node 144-2 하위 전체 `icon/*` (약 383개)

### 실행 방법 (둘 중 하나)
- **A. Figma MCP (권장)** — `claude mcp list`상 `claude.ai Figma`는 ✔ Connected이나, **MCP 도구는 세션 시작 시에만 등록**되어 현재 세션엔 미로딩. **Claude Code 새 세션 재시작** 후 `mcp__claude_ai_Figma__*` 도구로 node 144-2 트리 읽기 → 각 `icon/*` 노드를 SVG로 export. (로컬 Figma 데스크톱 Dev Mode MCP도 살아있음: 포트 3845 응답. 필요 시 `claude mcp add`로 등록. 단 대량 추출은 원격 `mcp.figma.com` 쪽이 적합.)
- **B. Figma REST API (재시작 불필요, 대안)** — 개인 액세스 토큰(`File content: Read`)을 파일 저장(예: `~/.figma_token` 한 줄), `curl`로:
  1. `GET https://api.figma.com/v1/files/zIICDqUtkcbUx95w1WalS5/nodes?ids=144:2` → 트리에서 `icon/*` 노드·섹션 그룹 수집
  2. `GET https://api.figma.com/v1/images/zIICDqUtkcbUx95w1WalS5?ids=<id,...>&format=svg` → 노드별 SVG URL 받아 다운로드 → 위 규칙대로 저장
  - 토큰은 채팅/로그에 출력 금지, 파일에서만 읽기.

### ⚠️ 추출 후 유의점
- Figma export SVG는 실제 색(`#000000`)으로 나옴. 나중에 §5 재적재/`currentColor` 필요 여부는 별도 판단(현재 앱은 SVG에 색상 속성 적용해 렌더).
- 추출본 개수를 JSON(383) 및 §1 기준과 대조해 누락/초과 확인(§7 유틸 활용).

</details>

---

## 7. (선택) 로컬 폴더 ↔ JSON 대조 유틸

새 SVG 파일을 파인더 폴더에 모을 경우, JSON과 대조해 분류 가능(순수 로컬, 위험 없음):

| 그룹 | 의미 |
|------|------|
| JSON에 있는데 폴더에 없음 | 파일 누락 |
| 폴더에 있는데 JSON에 없음 | 미정의/오타/불필요 파일 |
| 양쪽 다 있음 | 정상 매칭 |

- 매칭 기준: **파일명(`.svg` 제거) = JSON 키**. (대소문자·공백·`_` 차이 시 각각 "한쪽에만 있음"으로 잡힘)
- 옵션: 카테고리(JSON `c`)별 분류, 양쪽 SVG 내용 정규화 비교(이름 같고 그림 다른 경우 탐지), CSV 출력.
- 필요 입력: **폴더 경로**.

---

## 8. 남은 결정 / 다음 단계

- [x] **Figma 원본 추출 완료** (§6, 2026-07-21) — REST API로 `~/Downloads/Test/penta-icons/<group>/`에 383개 저장, `currentColor` 통일
- [x] 추출본 ↔ JSON(383) 개수·이름 대조 검증 — 100% 일치(차집합 0)
- [ ] 그룹값 저장 필드 확정: `subtitle` / `concept` 재사용 vs `tags`
- [ ] `IconTab` 그룹 표시 UI 설계·구현 (개발망)
- [ ] 재구축 스크립트 작성 (환경 무관, JSON/추출 SVG 기반)
- [ ] 운영망 실행 전 백업·연관관계·승인 체크리스트 통과

---

## 참고 파일
- 업로드: [app/api/posts/upload-icon/route.ts](../app/api/posts/upload-icon/route.ts)
- 목록/탭: [app/_category-pages/icon/IconTab.tsx](../app/_category-pages/icon/IconTab.tsx)
- 스키마: [prisma/schema.prisma](../prisma/schema.prisma) (`model Post`)
- 관련 문서: [docs/ICON_PLUS_handoff.md](ICON_PLUS_handoff.md), [docs/ICON_PLUS_개발계획.md](ICON_PLUS_개발계획.md)
