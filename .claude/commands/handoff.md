---
description: handoff 문서 갱신 후 preflight·커밋·푸시까지 한 번에
argument-hint: [handoff 문서 경로 (선택, 예: docs/PENTA_DESIGN_MEDIA_handoff.md)]
---

세션을 마무리하거나 단계를 넘길 때 사용. 순서:

1. **대상 handoff 문서 결정** — `$ARGUMENTS`로 경로가 주어지면 그것을 쓰고, 없으면 이번 세션에서 작업한 기능에 해당하는 `docs/*_handoff.md`를 찾아 사용자에게 확인한다.
2. **문서 갱신** — 이번 세션에서 한 작업을 반영한다:
   - 완료한 Phase/P 항목 체크
   - 다음에 이어갈 단계와 시작 지점
   - 남은 작업 / 미해결 이슈 / 개발망 검증 체크리스트
3. **preflight** — 코드 변경이 있었다면 실행. 실패 시 멈추고 보고:
   ```bash
   npm run typecheck && npm run lint
   ```
   (`build`는 로컬 DB 부재로 prerender에서 항상 실패하므로 게이트 제외.)
4. **커밋** — 문서 + 코드 변경을 커밋한다 (Conventional Commits, 예: `docs(handoff): ...`).
5. **푸시 전 확인** 후 아래로 푸시:
   ```bash
   git push origin HEAD:2026-06-17-tiper
   ```
6. 다음 세션 시작 문구를 제안한다. (예: `@docs/XXX_handoff.md 기준으로 P_에서 이어서 진행해주세요`)
