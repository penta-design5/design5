# Supabase Keepalive — 사용자가 할 일

GitHub Actions + `/api/keepalive` 호출 방식이 구현된 후, **아래 작업은 사용자가 직접** 해야 합니다.

---

## 1. 배포 URL 설정 (필수)

GitHub Actions가 호출할 앱 주소를 저장소 변수로 등록합니다.

1. GitHub 저장소 페이지에서 **Settings** → **Secrets and variables** → **Actions** 이동
2. **Variables** 탭에서 **New repository variable** 클릭 (secret 탭이 아니다 주의!!!)
3. **Name**: `APP_URL`
4. **Value**: 배포된 앱의 실제 URL (커스텀 도메인 사용 시 예: `https://layerary.com`)
   - 끝에 `/` 없이 입력
5. **Update variable** 저장

워크플로는 3일마다 `{APP_URL}/api/keepalive` 를 호출합니다. `APP_URL`이 없으면 워크플로가 실패합니다.  
(팀 도메인이 있으면 예: `https://your.example.com` 형태로 맞출 것.)

---

## 2. 앱 배포 (필수)

keepalive API가 포함된 코드가 실제로 서버에 반영되어야 합니다.

1. 이번에 추가/수정된 파일을 **커밋**한 뒤 **원격 저장소에 push**
2. Vercel(또는 사용 중인 호스팅)이 자동 배포를 한다면 push만 하면 됨
3. 수동 배포를 쓰는 경우, 배포 도구에서 최신 커밋 기준으로 한 번 배포 실행

배포가 끝난 뒤 브라우저나 curl로 실제 `APP_URL`에 대해 `…/api/keepalive` 로 접속해 보면,  
보안을 설정하지 않았다면 `{"ok":true,"db":true,"storage":{...},"at":"..."}` 형태의 JSON이 보여야 합니다.  
(보안 설정 시 아래 3번을 먼저 한 뒤, Authorization 헤더를 넣어서 테스트)

---

## 3. Keepalive 보안 설정 (선택, 권장)

아무나 `/api/keepalive`를 호출하지 못하게 하려면 비밀값을 설정합니다.

### 3-1. 비밀값 정하기

- 예: `openssl rand -hex 24` 로 생성한 랜덤 문자열
- 이 값을 **Vercel**과 **GitHub** 양쪽에 동일하게 넣습니다.

### 3-2. Vercel 환경 변수

1. Vercel 대시보드 → 해당 프로젝트 → **Settings** → **Environment Variables**
2. **Key**: `KEEPALIVE_SECRET`
3. **Value**: 위에서 정한 비밀값
4. **Environment**: Production (필요 시 Preview 등도 선택)
5. 저장 후 **재배포** 한 번 실행 (환경 변수 반영)

### 3-3. GitHub Secrets

1. GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions**
2. **Secrets** 탭 → **New repository secret**
3. **Name**: `KEEPALIVE_SECRET`
4. **Value**: Vercel에 넣은 것과 **같은** 비밀값
5. **Add secret** 저장

`KEEPALIVE_SECRET`을 설정하면 keepalive API는 `Authorization: Bearer <비밀값>` 헤더가 있을 때만 200을 반환합니다. GitHub Actions 워크플로는 이미 이 헤더를 사용하도록 되어 있습니다.

---

## 4. 동작 확인

1. GitHub 저장소 → **Actions** 탭
2. 사이드바 메뉴에서 **Supabase Keepalive** 워크플로 선택
3. **Run workflow** → **Run workflow** 로 수동 실행
4. 실행이 끝난 뒤 해당 run 클릭 → **keepalive** job에서 "keepalive OK (HTTP 200)" 로그 확인

스케줄은 **매 3일마다 UTC 00:00**에 자동 실행됩니다.  
수동 실행이 200으로 성공하면, 스케줄 실행도 같은 방식으로 동작합니다.

---

## 5. 사내망·비공개 URL 전용 (선택)

Supabase 7일 정채가 없거나, GitHub Actions가 `APP_URL`(사내망 전용)에 접근할 수 없다면
위 1~4번 대신 `deploy/rocky/README.md`의 **「사내망 운영: DB 백업·핑」**을 보고, 앱이 돌아가는
**서버에서** `curl` + `crontab`(또는 systemd timer)으로 `/api/keepalive` 를 주기적으로 호출하세요.
`KEEPALIVE_SECRET`이 있으면 GitHub과 동일하게 `Authorization: Bearer …` 를 붙이면 됩니다.

---

## 요약 체크리스트

| 순서 | 작업 | 어디서 |
|------|------|--------|
| 1 | `APP_URL` 변수 등록 (배포 URL) | GitHub → Settings → Actions → Variables |
| 2 | 코드 push 후 배포 반영 | 로컬 git push 또는 수동 배포 |
| 3 | (선택) `KEEPALIVE_SECRET` 환경 변수 추가 | Vercel → Settings → Environment Variables |
| 4 | (선택) `KEEPALIVE_SECRET` 시크릿 추가 | GitHub → Settings → Actions → Secrets |
| 5 | Actions에서 수동 실행 후 HTTP 200 확인 | GitHub → Actions → Supabase Keepalive → Run workflow |

위 단계까지 완료하면 Supabase 7일 비활동 일시정지는 keepalive로 방지됩니다.
