# ICON+ 구현 Handoff (진행 상태)

> 스펙 문서: [ICON_PLUS_개발계획.md](./ICON_PLUS_개발계획.md)
> **구현 진행 상태의 단일 원본(source of truth)은 이 문서다.** 계획서는 스펙으로 고정하고, 단계 진행/완료 시 이 문서만 갱신한다.

- 대상: SOURCE > ICON 페이지에 ICON+ 탭 추가
- 최종 업데이트: 2026-07-07

범례: ⬜ 대기 · 🟡 진행중 · ✅ 완료 · ⛔ 블록

---

## 진행 현황 요약

| Phase | 내용 | 상태 | 브랜치/커밋 | 검증 |
| --- | --- | --- | --- | --- |
| P0 | 사전 준비 (의존성·스키마·마이그레이션) | ✅ 완료 | `refactor/phase2-api-layer` | validate/generate + `migrate deploy` 적용 + 테이블 조회 검증 ✅ |
| P1 | 탭 골격 & ICON 탭 정리 | ⬜ 대기 | | |
| P2 | 데이터/전처리/API | ⬜ 대기 | | |
| P3 | ICON+ 레이아웃 & 목록 | ⬜ 대기 | | |
| P4 | 업로드 다이얼로그 & anchor 입력 | ⬜ 대기 | | |
| P5 | 병합 미리보기 | ⬜ 대기 | | |
| P6 | 속성 조정 & 다운로드 | ⬜ 대기 | | |
| P7 | 반응형/접근성/QA | ⬜ 대기 | | |

---

## Phase별 상세

### Phase 0 — 사전 준비  ✅
- [x] `sanitize-html`, `fast-xml-parser` 의존성 확인/추가 (+ `@types/sanitize-html` devDep)
- [x] `prisma/schema.prisma`에 `IconPlusResource` / `IconPlusType` 추가 (+ `User.iconPlusResources` 역참조)
- [x] `prisma validate` 통과, `prisma generate`로 클라이언트 재생성(코드에서 타입 사용 가능)
- [x] 개발망 DB 마이그레이션 생성·적용 (터널 연결 상태에서 완료)
- 수정 파일:
  - `package.json` / `package-lock.json` (deps 3종 추가)
  - `prisma/schema.prisma` (`IconPlusType` enum, `IconPlusResource` model, `User` 역참조 1줄)
  - `prisma/migrations/20260707120000_add_icon_plus/migration.sql` (신규)
- 검증:
  - `npx prisma validate` → "valid 🚀", `npx prisma generate` → 성공 (client v5.22.0)
  - `npx prisma migrate deploy` → `20260707120000_add_icon_plus` 적용
  - `npx prisma migrate status` → "up to date", `SELECT count(*) FROM icon_plus_resources` 정상 실행
- 계획 대비 변경/결정:
  - `fast-xml-parser`는 이미 transitive로 존재했으나 명시적 의존성으로 승격
  - `@types/sanitize-html`을 devDependency로 추가(TS 타입)
  - **shadow DB 위험 회피**: `migrate dev` 대신 `migrate diff`(live DB→schema)로 SQL 생성 후 `migrate deploy` 적용 — shadow DB 미사용, 리셋 없음. 마이그레이션 SQL은 순수 additive(CREATE TYPE/TABLE/INDEX + ADD FK, 기존 테이블 변경 없음)
- 다음 작업:
  - Phase 1 착수 (탭 골격 & ICON 탭 정리)

### Phase 1 — 탭 골격 & ICON 탭 정리  ⬜
- [ ] `IconListPage`에 `ICON` / `ICON+` 탭 도입, 기존 ICON UI를 `ICON` 탭으로 이동
- [ ] `아이콘 추가` 버튼을 헤더 → 액션 행의 `삭제` 버튼 우측으로 이동
- [ ] (선택) URL 쿼리 `?tab=plus` 동기화
- 완료 기준: 탭 전환 동작, ICON 탭 기존 기능 회귀 없음, 버튼 위치 변경 반영
- 수정 파일:
- 검증:
- 계획 대비 변경/결정:
- 다음 작업:

### Phase 2 — 데이터/전처리/API  ⬜
- [ ] `merge-svg.ts` 이식 (인증/Prisma/토큰 교체)
- [ ] `process-svg.ts` 이식 (sanitize/normalize)
- [ ] `/api/icon-plus` GET/POST/DELETE 구현
- [ ] `/api/icon-plus/[id]` PATCH(anchor) 구현
- 완료 기준: 관리자 업로드/삭제/anchor 수정, 사용자 조회, 비관리자 업로드 403
- 수정 파일:
- 검증:
- 계획 대비 변경/결정:
- 다음 작업:

### Phase 3 — ICON+ 레이아웃 & 목록  ⬜
- [ ] 3영역 레이아웃(`IconPlusWorkspace`) 구현
- [ ] 좌측 메인 아이콘 / 중앙 병합용 아이콘·텍스트 2섹션 구현
- [ ] 섹션 공통 헤더 액션(추가/더보기 전체 선택/선택 개수/선택 해제/삭제)
- [ ] 상호 배타 선택(아이콘 ↔ 텍스트)
- [ ] Design5 디자인 토큰·컴포넌트 적용
- 완료 기준: 레이아웃이 `ICON_layout_02.jpg`와 유사, 타입별 목록 독립 표시
- 수정 파일:
- 검증:
- 계획 대비 변경/결정:
- 다음 작업:

### Phase 4 — 업로드 다이얼로그 & anchor 입력  ⬜
- [ ] SVG 드래그앤드롭 업로드
- [ ] MAIN 단건 + anchor 클릭/드래그 지정(십자선 표시)
- [ ] 병합용 아이콘/텍스트 다중 업로드
- 완료 기준: 검증/sanitize 통과, MAIN anchor 저장, 위험 SVG 차단
- 수정 파일:
- 검증:
- 계획 대비 변경/결정:
- 다음 작업:

### Phase 5 — 병합 미리보기  ⬜
- [ ] 선택 조합 → `mergeSvgsByAnchor` 실시간 미리보기(`메인 + 리소스 = 결과`)
- 완료 기준: 절단 영역 상단/좌측 정렬, 결과 viewBox 재계산, 미선택 시 다운로드 비활성
- 수정 파일:
- 검증:
- 계획 대비 변경/결정:
- 다음 작업:

### Phase 6 — 속성 조정 & 다운로드  ⬜
- [ ] 색상 10종(흰색 예외) / 선 두께 / 크기 / 포맷 / 초기화
- [ ] SVG/PNG/JPG 다운로드(병합 결과 기준, `lib/svg/*` 재사용)
- 완료 기준: 속성 변경이 미리보기·다운로드에 반영, 3포맷 정상 저장
- 수정 파일:
- 검증:
- 계획 대비 변경/결정:
- 다음 작업:

### Phase 7 — 반응형/접근성/QA  ⬜
- [ ] 태블릿/모바일 대응(Sheet/Drawer)
- [ ] `aria-*`/키보드 접근성
- [ ] 회귀 테스트(ICON 탭 포함)
- 완료 기준: 주요 뷰포트 정상, 접근성 확인, 회귀 없음
- 수정 파일:
- 검증:
- 계획 대비 변경/결정:
- 다음 작업:

---

## 미해결 / 결정 대기
- (없음)

## 변경 이력
| 날짜 | Phase | 요약 |
| --- | --- | --- |
| 2026-07-07 | — | Handoff 문서 생성 (Phase 0~7 스켈레톤) |
| 2026-07-07 | P0 | 의존성 추가 + 스키마(`IconPlusResource`/`IconPlusType`) 추가 + validate/generate 완료. 마이그레이션 적용은 다음 세션으로 보류 |
| 2026-07-07 | P0 | 터널 연결 확인 후 마이그레이션 `20260707120000_add_icon_plus` 적용·검증 완료 → **P0 ✅**. (diff→deploy 방식, shadow DB 미사용) |
