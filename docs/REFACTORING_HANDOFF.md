# 리팩토링 핸드오프 (Refactoring Handoff)

> 새 채팅 세션에서 이 프로젝트의 리팩토링을 이어가기 위한 인수인계 문서.
> 작성일: 2026-06-16 · 작성: Claude Code 세션
> 전체 계획 원본: `~/.claude/plans/keen-drifting-fairy.md` (있으면 참조, 없으면 이 문서가 단일 출처)

---

## 0. 한눈에 보기 (TL;DR)

- **목표**: Layerary(Next.js 14 + Prisma + NextAuth 사내 디자인 자산 포털)의 구조적 부채 제거. 회귀 위험을 통제하며(테스트·CI 우선) 중복을 config 기반 추상화로 통합.
- **진행 상태**: **Phase 0·1·2 완료 및 커밋됨.** Phase 3 미착수.
- **현재 브랜치**: `refactor/phase2-api-layer` (Phase 1·2 작업 포함)
- **Phase 0 커밋**: `9ed6ea2` — 테스트·린트·CI 안전망.
- **Phase 1 (카테고리 페이지 통합)**: 표준 4종(Damo/Cloudbric/iSIGN/WAPPLES)을 config 기반
  제네릭(`components/category-pages/_generic/`, `lib/category-listing-config.ts`,
  `lib/hooks/use-category-list.ts`)으로 통합. 각 `*ListPage.tsx`는 ~26줄 래퍼. ~4,600줄 감소.
  ※ CiBi/Character는 구조가 달라(이미지 기반) 제외 — 통합하지 않음(의도).
- **Phase 2 (API 레이어)**: `lib/api/`(errors/pagination/with-route-handler) 기반 구축,
  `posts/route.ts` GET 정렬 6블록을 `lib/post-sorting/` 순수함수로 통합(906→373줄),
  이메일 하드코딩을 `lib/access-control.ts`로 집약, **모든 Pattern A/B 라우트(~40개)를
  `withRouteHandler` + 표준 ApiError로 변환**(인증 응답 표준화: 미인증 401 / 권한부족 403).
  단위 테스트 47→118개.
- **다음 작업**: Phase 3 (스토리지 & 대형 유틸 정리). 그 전에 **Phase 1·2 사내망 dev 검증** 필요.

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

### Phase 1 — 카테고리 페이지 통합 (다음 착수)
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

### Phase 3 — 스토리지 & 대형 유틸 정리
- `lib/storage/`로 URL 분류·업로드 진입점 단일화. B2→S3 마이그레이션 완료 여부 확인 후 `lib/legacy-asset-bases.ts` 아카이브 판단(**사용처 확인 필수, 아직 active일 수 있음**).
- `diagram-utils.ts` → `lib/diagram/{shapes,render,export}.ts`, `svg-utils.ts` → `lib/svg/{color,resize,filter}.ts`. 분리 시 Phase 0 테스트로 회귀 검증.
- `getShapeBounds`를 Konva 비의존 순수 모듈로 분리 후 테스트 추가.
- 스키마 localStorage 유틸을 `createStorageUtils<T>(prefix)`로 공통화.

---

## 4. 작업 규칙 (이 리팩토링에 적용)
- 각 Phase/카테고리는 **독립적으로 머지 가능**하게, 작은 커밋으로.
- 동작(런타임 결과)은 보존 — 의도된 표준화 외에 UI 결과물·API 응답 형태는 동일해야 함.
- 변경 후 항상 `npm run lint && npm run typecheck && npm test` 통과 확인.
- 새 코드는 주변 코드의 컨벤션(주석 밀도, 네이밍, 한국어 주석 스타일)을 따른다.
- 커밋 메시지 말미: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- DB/스토리지 접근이 필요한 검증은 사용자에게 요청 (Claude 환경에서 불가).

## 5. 새 세션 시작 멘트(예시)
> "REFACTORING_HANDOFF.md 기준으로 Phase 1 시작해줘. Damo 파일럿부터."

기존 메모리에 사내 개발 서버 제약(`dev-server-environment`)이 기록돼 있어 자동으로 참조됨.
