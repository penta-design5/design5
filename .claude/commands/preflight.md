---
description: 푸시 전 로컬 검증 (typecheck + lint)
allowed-tools: Bash(npm run typecheck), Bash(npm run lint)
---

푸시 전에 로컬에서 타입·경로·린트 에러를 미리 잡는다. 아래를 순서대로 실행:

```bash
npm run typecheck && npm run lint
```

- 하나라도 실패하면 **거기서 멈추고** 실패 원인(파일·라인·메시지)을 요약해 보고한다. 커밋/푸시로 진행하지 않는다.
- 모두 통과하면 "preflight 통과 ✅"라고 알리고, 다음 단계(커밋/푸시)를 진행할지 물어본다.

> **`build`를 게이트에 넣지 않는 이유**: `next build`는 컴파일은 로컬에서 성공하지만, 대시보드·admin 등 **빌드 타임에 DB를 조회하는 페이지**가 로컬에 DB가 없어 prerender 단계에서 항상 실패(exit 1)한다. 즉 코드가 정상이어도 build는 실패하므로 게이트로 부적합.
> 잘못된 import 경로(`Cannot find module`)는 `typecheck`가 대부분 잡아준다.
> webpack 수준의 컴파일 검증이 꼭 필요하면 `npm run build`를 **수동 실행**하고, "Generating static pages"까지 도달했는지(=컴파일 성공)만 확인한다. 그 뒤의 DB prerender 에러는 무시.
