# 리팩토링 핸드오프 (Refactoring Handoff)

> 새 채팅 세션에서 이 프로젝트의 리팩토링을 이어가기 위한 인수인계 문서.
> 작성일: 2026-06-16 · 최종 갱신: 2026-06-17 · 작성: Claude Code 세션
> 전체 계획 원본: `~/.claude/plans/keen-drifting-fairy.md` (있으면 참조, 없으면 이 문서가 단일 출처)

---

## 0. 한눈에 보기 (TL;DR)

- **목표**: Layerary(Next.js 14 + Prisma + NextAuth 사내 디자인 자산 포털)의 구조적 부채 제거. 회귀 위험을 통제하며(테스트·CI 우선) 중복을 config 기반 추상화로 통합.
- **진행 상태**: **Phase 0·1·2 완료 + 후속 수정 완료. Phase 3 대부분 완료**(svg/diagram 분리,
  스키마 스토리지 유틸 통합 ✅ / 서버 스토리지 통합은 런타임 검증 대기로 일부 보류 — §3 Phase 3 참조).
- **현재 브랜치**: 로컬 `refactor/phase2-api-layer`. **GitHub 푸시 대상은 `2026-06-17-tiper` 브랜치**
  (main 아님). 푸시: `git push -u origin refactor/phase2-api-layer:2026-06-17-tiper` (이후 `git push`).
- **검증/반영 흐름**: design6(개발 사내망)에서 테스트 → 통과 시 design5(운영망)에 반영. design5는 추후 외부 공개 예정.
- **Phase 0 커밋**: `9ed6ea2` — 테스트·린트·CI 안전망.
- **Phase 1 (카테고리 페이지 통합)**: 표준 4종(Damo/Cloudbric/iSIGN/WAPPLES)을 config 기반
  제네릭(`components/category-pages/_generic/`, `lib/category-listing-config.ts`,
  `lib/hooks/use-category-list.ts`)으로 통합. 각 `*ListPage.tsx`는 ~26줄 래퍼. ~4,600줄 감소.
  ※ CiBi/Character는 구조가 달라(이미지 기반) 제외 — 통합하지 않음(의도).
- **Phase 2 (API 레이어)**: `lib/api/`(errors/pagination/with-route-handler) 기반 구축,
  `posts/route.ts` GET 정렬 6블록을 `lib/post-sorting/` 순수함수로 통합(906→373줄),
  이메일 하드코딩을 `lib/access-control.ts`로 집약, **모든 Pattern A/B 라우트(~40개)를
  `withRouteHandler` + 표준 ApiError로 변환**(인증 응답 표준화: 미인증 401 / 권한부족 403).
- **Phase 2 이후 후속 수정(사내망 검증 중 발견)**: eDM HTML 이미지 URL, 스토리지 공개 URL 버킷 인식형,
  대시보드 통계 누락, 인프라 카드 정리 — **§2.6 참조**.
- **Phase 3 (대형 유틸 분리 + 스토리지 일부)**: `svg-utils.ts`→`lib/svg/{color,resize,stroke,properties}`,
  `diagram-utils.ts`→`lib/diagram/{shapes,render,export}`(둘 다 배럴 유지·import 무변경),
  스키마 localStorage 유틸 3종을 `lib/preset-storage.ts` 팩토리로 통합, 클라이언트 URL 분류
  진입점 `lib/storage/client.ts` 신설. **단위 테스트 47→128→165개**. **서버 스토리지 통합 일부 보류**(§3 Phase 3).
- **다음 작업**: Phase 3 잔여(서버 스토리지 진입점 통합·`extractKeyFromPublicUrl` dedup)는
  **사내망 dev 런타임 검증과 함께** 진행. 그 전에 **배포 시 §2.7 환경변수 적용** 필요.

### ⚠️ 핵심 제약 (반드시 기억)
- 이 프로젝트의 **DB·오브젝트 스토리지는 사내망 개발 서버에 있고 외부에서 접근 불가**.
- 따라서 **테스트/CI는 DB·네트워크 비의존**이어야 한다 (통합 테스트 금지, 순수 단위 테스트만).
- `next build`는 빌드 타임에 DB를 건드릴 수 있어 CI 게이트에서 제외함. 빌드/실행 검증은 **사용자가 사내망에서** 수행.
- Prisma 스키마(`Category.type`/`pageType`/`config` JSON 기반)는 잘 설계돼 있으므로 **DB 스키마 변경 없이** 코드 레벨 통합에 집중.

---

## 1. Phase 0 — 완료된 작업 (안전망)

커밋 `9ed6ea2`에 포함. 모든 게이트는 DB 없이 통과 확인됨.

| 항목 | 파일 | 비고 |
|---|---|---|
| 테스트 러너 | `vitest.config.mts`, `vitest.setup.ts` | jsdom, `@/*` alias, `lib/**/*.test.ts`만 수집. **`.mts` 확장자 필수**(ESM 플러그인 로딩 때문) |
| 단위 테스트 47개 | `lib/__tests__/` | 날짜, 공휴일, card 스키마, svg 유틸, 스토리지 URL 분류, hardware 스키마 |
| npm 스크립트 | `package.json` | `test`(vitest run), `test:watch`, `typecheck`(tsc --noEmit) |
| 린트 강화 | `.eslintrc.json` | `next/typescript` + 경고 레벨 규칙. **에러 0, 경고 ~238** (경고는 의도적, 빌드 차단 안 함) |
| CI | `.github/workflows/ci.yml` | PR/push(main) 시 `npm ci → prisma generate → lint → typecheck → test`. Node 20 |

### 검증 방법 (사내망/외부 무관, 동일 결과)
```bash
git checkout refactor/phase0-test-tooling-foundation
npm install
npx prisma generate
npm run lint        # 에러 0 (경고만) → exit 0
npm run typecheck   # 출력 없음 → exit 0
npm test            # 6 files / 47 tests passed
```

### Phase 0에서 의도적으로 남긴 것
- `lib/diagram-utils.ts`의 `getShapeBounds`는 순수 함수지만 모듈이 `konva`/`jspdf`/`pptxgenjs`를 import → jsdom에서 불안정. **Phase 3에서 순수 모듈로 분리한 뒤 테스트 추가** 예정.
- ESLint 경고 238개는 점진적으로 줄일 대상 (현재는 warn으로 두어 차단하지 않음).

---

## 2. 탐색으로 확인된 핵심 문제 (Phase 1~3 근거)

### (A) 카테고리 페이지 대규모 복붙 중복 — **최우선, 최대 효과**
- `DamoListPage.tsx`(705줄) vs `CloudbricListPage.tsx`는 **54줄만 차이(약 92% 동일)**. 차이는 import 경로, 필터 배열, 카드 너비 상수, 로그 문자열뿐.
- 동일 패밀리 파일들 (라인 수):
  - ListPage: `app/_category-pages/{ci-bi,cloudbric,damo,isign,wapples,character,icon,ppt}/*ListPage.tsx` (580~735줄)
  - UploadDialog: `components/category-pages/{Damo,Cloudbric,Isign,Wapples,Ppt,CiBi,Character,...}Category/*UploadDialog.tsx` (214~837줄)
  - Card: `*Card.tsx` (~236줄, Damo/Cloudbric/Isign/Wapples 거의 동일)
  - PropertyPanel: `*PropertyPanel.tsx` (~121줄, 거의 동일)
- **표준 카테고리(통합 대상)**: Damo, Cloudbric, Isign, Wapples, CiBi, Character — 필터/카드폭만 다름.
- **제외(특수 플로우 유지)**: Icon(벌크 SVG), Diagram·Desktop·Card·EDM(에디터), Gallery·WelcomeBoard(복합 에디터).
- 기존 추상화: `lib/categories.ts`(DB 쿼리), `lib/constants.ts`의 `CATEGORY_CONFIG`(아이콘/색만). **컴포넌트 레벨 추상화는 없음.**

### (B) API 레이어 보일러플레이트
- 인증/에러/페이지네이션/zod 검증이 ~40개 라우트에 반복.
- 인증 패턴 3종 혼재: `auth()` 직접, `requireAuth()`/`requireAdmin()`(`lib/auth-helpers.ts`), 인라인 role 체크. 에러를 메시지 문자열(`'Unauthorized'`/`'Forbidden'`)로 식별하는 취약한 결합.
- 이메일 하드코딩: `lib/privileged-admin.ts`(`tiper@pentasecurity.com`), `lib/design-system-access.ts`.
- `app/api/posts/route.ts` **906줄 모놀리스** — WAPPLES/D.AMO/iSIGN/Cloudbric 정렬 분기가 거의 동일하게 반복 + in-memory 전체 페치 후 페이징.
- 응답 형태 불일치: `{ posts, pagination }` vs `{ items, pagination }` 혼용.

### (C) 스토리지 추상화 중복 + 대형 유틸
- 스토리지 분산: `lib/b2.ts`, `lib/s3/`, `lib/presigned-client-upload.ts`, `lib/public-asset-url.ts`, `lib/b2-client-url.ts`, `lib/legacy-asset-bases.ts`. URL 분류 함수가 여러 파일에 중복.
- 대형 유틸: `lib/diagram-utils.ts`(1086줄), `lib/svg-utils.ts`(698줄).
- 스키마 localStorage 유틸 중복: `card-schemas.ts`/`desktop-schemas.ts`/`welcomeboard-schemas.ts`.

---

## 3. 다음 단계 상세

### Phase 1 — 카테고리 페이지 통합 ✅ 완료 (아래는 당시 계획·실제 구현과 거의 일치)
1. `lib/category-listing-config.ts` 생성 — 카테고리별 메타 중앙화:
   ```ts
   export const CATEGORY_LISTING_CONFIG: Record<string, {
     slug: string; filters: string[]; cardWidth: number
     types?: string[]; languages?: string[]; uploadEndpoint?: string
   }>
   ```
   기존 각 ListPage의 `*_FILTERS`, `*_CARD_WIDTH` 상수를 이전.
2. 공통 훅 추출 — `lib/hooks/`:
   - `use-category-list.ts`: posts 페치 + 무한스크롤(IntersectionObserver) + LRU 필터 캐시(useRef) + CRUD 핸들러.
   - `use-masonry-layout.ts`: 컬럼 수 계산 + 리사이즈.
   - 기존 `lib/hooks/use-is-mobile-viewport.ts` 재사용.
3. 제네릭 컴포넌트 — `components/category-pages/_generic/`:
   - `GenericListPage.tsx` / `GenericCard.tsx` / `GenericPropertyPanel.tsx` / `GenericUploadDialog.tsx` (schema/types/languages/endpoint props 기반).
4. **Damo를 파일럿으로 먼저 완성** → 각 `*ListPage.tsx`를 config 넘기는 ~30줄 래퍼로 치환 → 나머지 표준 카테고리 복제. **카테고리당 개별 커밋/PR**로 점진 검증.
- 예상 효과: **~5,000–6,000줄 감소**.
- **검증**: UI 변경이므로 사용자가 사내망 dev 서버에서 카테고리별로 — 목록/무한스크롤, 필터 전환, PDF 미리보기·다운로드, 업로드/편집/삭제 — 수동 확인 필요.

### Phase 2 — API 레이어 정리 ✅ 완료
- ✅ `lib/api/` 생성: `with-route-handler.ts`(공통 try/catch), `errors.ts`(전용 에러 클래스
  `ApiError`/`Unauthorized`/`Forbidden`/`NotFound`/`BadRequest` + `errorResponse` 매퍼),
  `pagination.ts`(`parsePaginationParams`/`buildPaginationMeta`).
  ※ 응답 envelope 표준화(`{posts}` vs `{items}` 통일)는 **클라이언트 결합 위험으로 보류**(의도).
- ✅ `app/api/posts/route.ts` GET 정렬 6블록 → `lib/post-sorting/` 순수함수로 통합(906→373줄).
  in-memory 정렬 방식은 그대로 유지(DB 정렬 전환은 위험하여 제외).
- ✅ 인가/이메일 하드코딩을 `lib/access-control.ts` 단일 모듈로 집약(role 이전은 미수행, 집약 방식 채택).
- ✅ 모든 Pattern A/B 라우트(~40개)를 `withRouteHandler`로 변환. `requireAuth/requireAdmin` +
  인라인 `ApiError` throw로 통일. **인증 응답 표준화(승인됨): 미인증=401, 권한부족=403**
  (기존 일부 admin 라우트는 미인증도 403이었음 → 401로 변경). Pattern C(공개/다운로드)는 미변환(의도).
- **⚠️ 사내망 dev 검증 필요**: ① 카테고리별 목록 정렬 순서(ALL 필터 우선순위, 캐릭터/CI·BI),
  무한스크롤 페이지 경계. ② 주요 라우트 인증/검증/생성·수정·삭제 정상 동작.
  ③ design-requests GET의 `{items,...}` + Zod 400 `{error,details}` 형태 유지 확인.

### 2.6 Phase 2 이후 후속 수정 (사내망 검증 중 발견·수정 완료)
- **eDM HTML 이미지 URL** (`fix(edm)`): 자동 생성 HTML에 presigned URL(`?X-Amz-...`, 7일 만료)이 박혀
  이메일에서 안 보이던 문제. `app/api/edm/route.ts`·`[id]/route.ts`의 HTML용 이미지 맵을 presign 대신
  평문 공개 URL(`publicUrlForEdmsKey`)로 생성하고, `lib/edm-utils.ts` `getImageUrlForOutput`에서
  http(s) URL의 `?` 이후 제거. (썸네일·에디터 표시용 resolved* 는 매 요청 재생성이라 presign 유지)
- **스토리지 공개 URL 버킷 인식형** (`fix(storage)`): 단일 `S3_PUBLIC_BASE_URL`이 `.../edms`로 고정돼
  posts/갤러리(HW·바탕화면·웰컴보드·카드 포함, 전부 posts 버킷) 이미지가 깨지던 문제. `lib/s3/config.ts`의
  `publicUrlForBucketKey/Posts/Edms`(+icons/avatars/ppt)를 **`{base}/{버킷}/{키}`** 로 통일.
  URL→키 역변환 3곳(`r2-edm-storage.ts`/`s3/post-storage.ts`/`s3/url-helpers.ts`)도 선행 버킷 세그먼트 제거.
  → **base는 버킷 미포함 순수 도메인**으로 둬야 함(§2.7). 모든 이미지 메뉴가 같은 `publicUrlFor*Key`를 경유.
- **대시보드 통계 누락** (`fix(dashboard)`): 통계가 `Post`만 세어 별도 모델 콘텐츠가 빠지던 문제.
  HW(`HardwareProduct`→SOURCE)와 TEMPLATE 5종(`CardTemplate`/`WelcomeBoardTemplate`/`Diagram`/`Edm`/
  `DesktopWallpaper`→TEMPLATE)을 각 버킷·전체 게시물·전체 이미지에 합산 → **4개 버킷 합 == 전체 게시물**.
  공지사항(`Notice`)·디자인 의뢰(`DesignRequest`)는 별도 모델이라 본래 미포함(요청대로 제외).
- **대시보드 인프라 카드** (`chore(dashboard)`): MinIO 콘솔/Adminer 이동 버튼 2개 제거 + 설명 문구 정리.

### 2.7 ⚠️ 배포(design5/design6) 환경변수 — 필수
- 스토리지 URL이 버킷 인식형(`{base}/{버킷}/{키}`)으로 바뀌었으므로, **서버 env를 반드시 아래처럼** 설정:
  ```
  S3_PUBLIC_BASE_URL="https://design5.pentasecurity.com"          # 버킷 경로(/edms 등) 미포함, 순수 도메인
  NEXT_PUBLIC_S3_PUBLIC_BASE_URL="https://design5.pentasecurity.com"  # 동일 값
  ```
  - 기존 `.../edms` 값을 그대로 두면 `.../edms/edms/...`로 중복돼 eDM이 깨짐. **반드시 `/edms` 제거.**
- 게이트웨이/리버스 프록시가 **모든 버킷을 path-style로 공개 서빙**해야 함:
  `/posts/`, `/edms/`, `/icons/`, `/avatars/`, `/ppt-thumbnails/` (+ 익명 읽기 허용, HTTPS).
  eDM `/edms/`만 열려 있으면 다른 메뉴 이미지가 404 남.
- 기존에 잘못된 base로 저장된 게시물(이미지 URL이 DB에 절대경로로 박힘)은 **재업로드해야** 새 경로로 갱신됨.
- `.env`/`.env.local`은 gitignore라 푸시에 포함 안 됨 → **서버에서 직접 설정**.
- 이메일(eDM): 외부 수신자에게 이미지가 보이려면 호스트가 **외부 도달 가능한 공개 도메인**이어야 함
  (`127.0.0.1`·사내 전용 호스트는 Gmail 프록시 등에서 불가). design5 외부 공개 후 충족.

### Phase 3 — 스토리지 & 대형 유틸 정리 (대부분 완료)
- ✅ `svg-utils.ts`(698줄) → `lib/svg/{color,resize,stroke,properties}.ts`. 전부 순수 함수라 코드 이동만.
  `lib/svg-utils.ts`는 배럴 재export로 유지 → import 7곳·테스트 무변경. (계획의 `filter`는 실제 함수에 맞춰 `stroke`로.)
- ✅ `diagram-utils.ts`(1086줄) → `lib/diagram/{shapes,render,export}.ts`(배럴 유지·import 5곳 무변경).
  `getShapeBounds` 등 순수 기하 함수를 konva 비의존 `shapes.ts`로 분리하고 **단위 테스트 14개 추가**
  (Phase 0에서 미뤘던 항목 해소). 미사용 jsPDF import 제거.
- ✅ 스키마 localStorage 유틸을 `lib/preset-storage.ts`의 `createPresetStorageUtils<TPreset, TAutosave>(config)`로
  통합. card/welcomeboard(append)·desktop(upsert+SSR 가드)·welcomeboard(logErrors) 차이는 config로 흡수,
  각 파일은 기존 공개 메서드명을 그대로 노출 → import 36곳 무변경. desktop/welcomeboard 누락 테스트 추가.
- ✅ 클라이언트 URL 분류 진입점 `lib/storage/client.ts` 신설(재export, 동작 무변경) + 특성 테스트 13개.
- ⏸ **보류(사내망 런타임 검증 필요)**:
  - **서버 스토리지 진입점 단일화**: `b2.ts`/`s3/*`/`r2-edm-storage.ts`는 @aws-sdk 의존(서버 전용)이라
    클라이언트 번들 분리 경계를 깨지 않으려면 별도 `lib/storage/server.ts`로 묶어야 함. 업로드/다운로드 경로라
    런타임 검증 없이는 위험 → dev에서 함께 진행.
  - **`extractKeyFromPublicUrl`(r2-edm) → `s3ObjectKeyFromAnyPublicUrl`(s3/url-helpers) dedup**: base 출처는
    동일(`getEdmPublicBase`=`getS3PublicBaseUrl`)이나, `S3_PUBLIC_BASE_URL`이 빈 값인 **엔드포인트 폴백 모드**에서
    전자는 `null`(삭제 불가), 후자는 엔드포인트 host 파싱으로 키 복원 → **비등가**. 운영(§2.7, base=도메인)에서는
    동일하게 동작. §2.6에서 방금 고친 eDM 삭제 경로라 보류.
  - **`lib/legacy-asset-bases.ts` 아카이브 금지**: `b2.ts`·`b2-client-url.ts`·`public-asset-url.ts`가 여전히
    사용 중(사용처 확인 완료). B2→S3는 코드상 완료(B2 SDK 미설치, `b2.ts`는 S3 위임)지만 DB에 남은 옛 URL
    판별용으로 active.
- 잔여(미착수): `diagram-utils`/`svg-utils` 추가 세분화는 불필요(이미 분리됨). localStorage 스키마 외 다른
  대형 유틸은 현 시점 추가 분리 대상 없음.

---

## 4. 작업 규칙 (이 리팩토링에 적용)
- 각 Phase/카테고리는 **독립적으로 머지 가능**하게, 작은 커밋으로.
- 동작(런타임 결과)은 보존 — 의도된 표준화 외에 UI 결과물·API 응답 형태는 동일해야 함.
- 변경 후 항상 `npm run lint && npm run typecheck && npm test` 통과 확인.
- 새 코드는 주변 코드의 컨벤션(주석 밀도, 네이밍, 한국어 주석 스타일)을 따른다.
- 커밋 메시지 말미: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- DB/스토리지 접근이 필요한 검증은 사용자에게 요청 (Claude 환경에서 불가).

## 5. 새 세션 시작 멘트(예시)
> "REFACTORING_HANDOFF.md 기준으로 Phase 3(스토리지 & 대형 유틸 정리) 시작해줘."

또는 먼저 사내망 검증을 마쳤다면:
> "Phase 1·2 사내망 검증 끝났어. §2.7 배포 환경변수 확인하고 Phase 3로 넘어가줘."

기존 메모리에 사내 개발 서버 제약(`dev-server-environment`)이 기록돼 있어 자동으로 참조됨.
