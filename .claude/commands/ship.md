---
description: preflight 통과 후 커밋하고 2026-06-17-tiper 브랜치로 푸시
argument-hint: [커밋 메시지 (선택)]
---

개발망 검증을 위한 배포. **반드시 이 순서를 지킨다:**

1. **preflight** — 먼저 실행하고, 실패 시 여기서 멈추고 원인 보고 (커밋/푸시 금지):
   ```bash
   npm run typecheck && npm run lint
   ```
   (`build`는 로컬 DB가 없어 prerender에서 항상 실패하므로 게이트에서 제외. 필요 시 수동 실행 — `/preflight` 참고.)
2. **변경 내용 확인** — `git status`, `git diff --stat`로 무엇이 커밋될지 보여준다.
3. **커밋** — 변경을 스테이징하고 커밋한다.
   - 커밋 메시지: `$ARGUMENTS`가 있으면 그것을 사용하고, 없으면 변경 내용에 맞춰 Conventional Commits 형식(예: `feat(gallery): ...`)으로 작성한다.
4. **푸시 전 확인** — 푸시는 외부 반영이므로 **실행 직전에 사용자에게 확인을 받는다.**
5. **푸시** — 항상 아래 브랜치로 푸시한다 (로컬 브랜치명과 다를 수 있음):
   ```bash
   git push origin HEAD:2026-06-17-tiper
   ```
6. 완료 후 커밋 해시와 푸시된 브랜치를 요약해 알린다.
