# CLAUDE.md — Design5 프로젝트 작업 규칙

이 파일은 모든 세션에서 자동으로 적용되는 **하드 규칙**입니다.
배경·전체 워크플로 설명은 [docs/CLAUDE_CODE_사용패턴.md](docs/CLAUDE_CODE_사용패턴.md)를 참고하세요.

---

## 환경 (design5 / design6 구분 — 절대 혼동 금지)

- **로컬** — 코드 작성. DB·Storage 없음(터널 필요), 자동 검증 제한적.
- **design6 = 개발망** (`https://design6.pentasecurity.com`) — **실제 검증은 여기서** 한다. DB·MinIO Storage가 사내 개발서버에만 있고 외부 접속 불가.
- **design5 = 운영망** (`https://design5.pentasecurity.com`) — 개발망 검증 후 반영. **곧 외부 공개 예정.**
- ⚠️ 컨테이너/박스 이름이 `design5`로 되어 있어 개발망과 헷갈리기 쉬움. 항상 도메인으로 구분할 것.

## Git / 배포

- **푸시 대상 브랜치는 항상 `2026-06-17-tiper`.** 로컬 브랜치명(예: `refactor/*`)과 다를 수 있음.
  - 푸시 명령: `git push origin HEAD:2026-06-17-tiper`
- 배포는 로컬 `git push` → 서버에서 `git pull`. (FileZilla 등 수동 파일 복사 금지)
- **푸시 같은 외부 반영 작업 전에는 반드시 확인을 받는다.** 요청 없이 push하지 않는다.

## 커밋 전 필수 preflight

- **"커밋 푸시" 요청을 받으면, 커밋 전에 반드시 아래를 먼저 통과시킨다:**
  ```bash
  npm run typecheck && npm run lint
  ```
- 잘못된 import 경로·타입 에러는 느린 개발망 rebuild 전에 로컬 typecheck에서 잡는다.
- preflight 실패 시 커밋/푸시하지 말고 원인을 먼저 보고한다.
- ⚠️ `npm run build`는 게이트에 넣지 않는다: 컴파일은 성공해도 대시보드·admin 등 빌드 타임 DB 조회 페이지가 로컬 DB 부재로 prerender에서 항상 실패(exit 1)한다. webpack 수준 검증이 필요하면 수동 실행 후 "Generating static pages" 도달 여부(=컴파일 성공)만 확인하고 이후 DB 에러는 무시.
- 빠른 실행: `/preflight`, 커밋·푸시까지: `/ship`, handoff 갱신 포함: `/handoff`

## DB / Prisma

- **마이그레이션 시 기존 DB 데이터를 보존한다.** 데이터가 삭제될 수 있는 명령(reset 등)은 사전 확인 없이 실행 금지.
- 신규 컬럼/스키마를 참조하는 코드를 배포할 때는 개발망에 `prisma migrate deploy`를 **먼저/함께** 적용한다. (안 하면 해당 테이블 쿼리가 전부 실패)
- 개발 DB는 일회용이며, 문제가 생기면 `migrate reset` + `db:seed`로 복구.

## 작업 방식

- 큰 기능은 **Phase / P 단위로 쪼개** 한 단계씩 진행하고, 각 단계 후 개발망 검증을 거친다.
- 기능마다 `docs/*_handoff.md`에 진행 상태·잔여 작업·검증 체크리스트를 기록하고, 새 세션은 그 문서 기준으로 이어간다.
- 코드를 바꾸기 전에 **분석·설명을 먼저** 제시하고, 여러 방안이 있으면 선택지를 제시한다. (사용자가 "답변만/설명만"이라고 하면 구현하지 말 것)

## 커뮤니케이션

- 한국어 존댓말.
- 파일 경로는 **프로젝트 루트 기준**으로 안내한다.
- 코드 수정 후에는 **변경/추가된 파일 목록**을 정리해 알려준다.
