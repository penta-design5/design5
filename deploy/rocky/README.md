# 사내망 Rocky — design5 (Postgres + MinIO, 선택: Next + Nginx)

[사내망 이전 계획](../../docs/사내망_이전_계획_baa87487.plan.md) **옵션 B**에 맞춰, 기본은 **DB와 객체 스토리지**를 Docker로 기동하고, **같은 호스트**에서 Next까지 돌릴 때는 **아래 8) 절** 풀스택(Compose 오버레이)을 사용합니다.  
**호스트 디렉터리 규칙**은 [../WEBAPPS_LAYOUT.md](../WEBAPPS_LAYOUT.md) 를 참고하세요(다른 웹서비스와 `/data/webapps` 아래에서 병행).

- **덤프 복원·MinIO 객체·DB URL 치환** 전체 흐름: [../../docs/OPERATIONAL_MIGRATION.md](../../docs/OPERATIONAL_MIGRATION.md)  
- 레포의 `data-backup/`(용량·보안에 따라 Git 비추적) 등 백업본은 그 문서의 순서에 맞춰 스테이징에서 먼저 검증하는 것을 권장합니다.

- **데이터만:** 아래 1)～7) (기본 `docker-compose.yml`만)
- **앱 + Nginx(HTTP):** [docker-compose.app.yml](docker-compose.app.yml) 오버레이, [Dockerfile](Dockerfile)로 Next **standalone** 빌드(빌드 컨텍스트는 레포 루트)
- **TLS(HTTPS):** [nginx/next-app-https.conf.sample](nginx/next-app-https.conf.sample)를 참고해 인증서·`443`·볼륨을 붙이고, `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL`을 **실제 https 베이스**로 맞출 것

## 사전 조건

- Docker / `docker compose` 설치
- 데이터 디스크(예: `/data`, 수백 GB 여유) — 권장: `DATA_ROOT=/data/webapps/design5/data`
- 이 repo의 `deploy/rocky/` 를 서버에 두고 기동

## 1) 디렉터리·권한

```bash
sudo mkdir -p /data/webapps/design5/data/{postgres,minio}
sudo chown -R "$USER":"$USER" /data/webapps/design5/data

cd deploy/rocky
cp .env.example .env
# .env 에서 POSTGRES_*, MINIO_*, 비밀번호를 실제 값으로 수정 (DATA_ROOT 기본값 유지 가능)
```

**SELinux** 사용 시 `/data/webapps/...` 바인드 마운트가 거부되면 IT 정책에 맞게 컨텍스트 또는 boolean 을 조정하세요.

## 2) 기동

```bash
docker compose --env-file .env up -d
docker compose ps
docker logs design5-minio-init   # 버킷 생성 로그(완료 후 컨테이너 exit 0)
```

## 3) 연결 (노트북 `.env.local` / SSH 터널)

- **Postgres** — 서버 `127.0.0.1:5432` (기본 `HOST_BIND=127.0.0.1`)  
  - SSH: `ssh -L 15432:127.0.0.1:5432 -p 6022 design@<서버>`  
  - `DATABASE_URL`: `...@127.0.0.1:15432/design5?...` (DB 이름은 `.env`의 `POSTGRES_DB`)
- **MinIO S3** `9000`, **콘솔** `9001`  
  - 터널 예: `-L 19000:127.0.0.1:9000` → S3 API는 `http://127.0.0.1:19000`  
- 자격 증명: `.env`의 `MINIO_ROOT_*` (운영은 강한 비밀번호)

### Node(Next) 쪽 `S3_*` 와의 대응

노트북의 `.env.local`에는 **Prisma/Next용** `DATABASE_URL` 외에, 앱이 MinIO(S3)에 붙을 때 쓰는 키가 **프로젝트 루트 `env.example.txt`의 S3/MinIO 섹션**에 정의되어 있습니다(스펙 확정). 개발 시 관례:

| deploy/rocky/.env (서버) | .env.local (노트북, 구현 완료 후) |
|--------------------------|----------------------------------|
| `MINIO_ROOT_USER` | `S3_ACCESS_KEY_ID` (동일 값 가능·개발 전용) |
| `MINIO_ROOT_PASSWORD` | `S3_SECRET_ACCESS_KEY` |
| MinIO S3 API URL (`http://서버:9000` 또는 터널 `http://127.0.0.1:19000`) | `S3_ENDPOINT` |
| (버킷) `posts` … | `S3_BUCKET_POSTS` 등 `env.example.txt`와 동일 이름 |

퍼블릭 URL(이미지·이메일)은 Nginx/게이트웨이 주소로 정한 뒤 `S3_PUBLIC_BASE_URL`에 반영합니다.

## 4) 생성 버킷

| 버킷 | 용도(기존 클라우드) |
|------|----------------------|
| `posts` | B2 |
| `edms` | R2 eDM |
| `avatars` / `icons` / `ppt-thumbnails` | Supabase Storage |

CORS·퍼블릭 읽기는 앱/환경 확정 뒤 `mc` 또는 콘솔에서 설정.

## 5) Prisma(노트북)

```bash
npx prisma migrate deploy
# 또는 팀 정책에 따라 prisma db push
```

## 6) 덤프 복원(서버, 선택)

```bash
docker exec -i design5-postgres pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --verbose < /path/to/supabase_backup-....dump
```

(스키마/데이터 충돌 없는지 **스테이징**에서 먼저 시험 권장.)

## 7) 정지

```bash
docker compose --env-file .env down
# 데이터는 `DATA_ROOT` 아래에 그대로 남음. 완전 삭제는 해당 디렉터리 수동 정리.
```

## 포트·다른 웹서비스와의 공존

- 이 스택이 **같은 호스트**에 있으면 **5432 / 9000 / 9001** 을 사용합니다. **추가 웹서비스**는 Compose에서 **다른 호스트 포트**로 맵핑하거나(예: `5433:5432`), [WEBAPPS_LAYOUT.md](../WEBAPPS_LAYOUT.md)에 따라 **별 `data/`** 로 분리하세요.
- 기본 **로컬호스트 바인딩**이므로 사내망 타 PC는 직접 붙지 않습니다. **LAN에서 직접** 쓰려면 `.env`에 `HOST_BIND=0.0.0.0` 후 `firewall-cmd` 등으로 대역 제한.

## 이전 `layerary` 경로를 쓰던 경우

- 컨테이너/볼륨이 `/data/layerary` 를 쓰고 있었다면, **데이터를 `/data/webapps/design5/data` 로 이전**한 뒤 `.env`의 `DATA_ROOT`를 맞추고, 기존 컨테이너는 `down` 후 새 이름(`design5-*`)으로 다시 `up` 하세요. (운영 DB가 이미 있으면 다운 전 백업 권장.)

## 8) (선택) 풀스택 — Next standalone + Nginx

같은 서버에서 `postgres` / `minio`와 **한 Docker 네트워크**에 Next를 올릴 때 사용합니다(노트북 `npm run dev`와 별개·프로덕션형).

0. **순서(중요)**: `next build`(이미지 빌드)가 SSG/Prisma로 **Postgres에 접속**합니다. **먼저** 데이터 평면만 올리고, **그다음** 앱을 빌드·기동하세요.  
   `docker compose -f docker-compose.yml --env-file .env up -d`  
   (한 번에 `docker-compose.app.yml`까지 `up --build` 하면, 빌드 시점에 DB가 아직 없을 수 있어 실패할 수 있습니다.)
1. **빌드·런**: 프로젝트 `next.config.js`에 `output: 'standalone'`이 있어야 합니다(레포 기본).
2. **`.env`**: 기존처럼 `deploy/rocky/.env`로 Postgres/MinIO를 띄웁니다(위 0). **비밀번호**에 `& ? @` 등이 있으면 연결 문자열 **URL 인코딩**이 필요할 수 있습니다.
3. **`.env.app`**: `cp .env.app.example .env.app` 후,
   - `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` / `MINIO_ROOT_*`가 **`.env`와 일치**하도록 `DATABASE_URL` / `DIRECT_URL` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY`를 맞춤
   - `NEXTAUTH_URL`·`NEXT_PUBLIC_APP_URL`을 **Nginx로 접속하는 URL**로 설정(기본 Nginx는 `http://<호스트>:8080` — `.env`에 `NGINX_HTTP_PORT`·`NGINX_BIND`로 조정 가능, 예시는 [`.env.example`](.env.example))
4. **기동** (0) 이후):
   ```bash
   cd deploy/rocky
   docker compose -f docker-compose.yml -f docker-compose.app.yml --env-file .env up -d --build
   docker compose -f docker-compose.yml -f docker-compose.app.yml ps
   curl -sS -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:8080/"  # 200 또는 302 등
   ```
   `docker-compose.app.yml`의 **이미지 빌드**는 `host.docker.internal:5432`로 **호스트에 바인딩된 Postgres**에 붙습니다. `HOST_BIND=127.0.0.1`이면 일반적으로 동작합니다(구형 Docker/루트리스는 [extra_hosts](https://docs.docker.com/compose/compose-file/build/) 등 환경에 따라 `host.docker.internal` 지원이 다를 수 있음).
5. **MinIO CORS**: Presigned(브라우저 PUT)를 쓰면 MinIO 쪽에 `NEXT_PUBLIC_APP_URL` 오리진을 추가해야 합니다(위 `### Node(Next) 쪽` 절·`docs/DEPLOYMENT` Presigned 항과 동일).
6. **정지**: `docker compose -f docker-compose.yml -f docker-compose.app.yml --env-file .env down` (DB/MinIO 볼륨은 유지).

Nginx **HTTP 80(컨테이너)** → **호스트 8080** 매핑이 기본입니다. **443 + TLS**는 [nginx/next-app-https.conf.sample](nginx/next-app-https.conf.sample)과 호스트의 인증서 경로에 맞게 `nginx` 서비스 `ports`·`volumes`를 직접 조정하세요(샘플은 복붙용).

## 사내망 운영: DB 백업·핑

GitHub Actions의 **퍼블릿 DB→B2**·**keepalive** 워크플로는, 사내망·비공개 URL만 쓰는 경우 **러너가 앱/DB에 닿지 않아** 실패하거나 쓸모가 없을 수 있음(`.github/workflows` 상단 주석 참고). 그때는 **앱/DB가 있는 동일(또는 VPN 내) 머신**에서 아래를 **cron** 등으로 수행.

### DB 덤프 (PostgreSQL)

- Compose로 올린 Postgres: 예시는 `scripts/backup-pg-dump-cron.example.sh` 참고.
- 덤프는 `$DATA_ROOT/backups` 등에 쌓고, **MinIO** `mc`/`aws s3` 로 객체 스토리지에 복제해 두면(버킷 정책·주기·보관은 팀 기준) GitHub B2 백업과 유사한 역할을 함.

### 앱 헬스·핑 (`/api/keepalive`)

- 앱이 `http://127.0.0.1:3000` 등으로 떠 있으면(리버스 프록시 뒤면 내부 URL 사용):

  ```bash
  curl -sf -H "Authorization: Bearer $KEEPALIVE_SECRET" "http://127.0.0.1:3000/api/keepalive"
  ```

- `KEEPALIVE_SECRET` 미사용이면 `Authorization` 생략. `crontab`에 2~3일마다 한 번이면, 예전 GHA keepalive와 비슷한 주기(자세한 점검 API 응답은 `app/api/keepalive/route.ts` 참고).
