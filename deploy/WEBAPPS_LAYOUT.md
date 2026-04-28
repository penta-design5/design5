# 사내망 `/data/webapps` 레이아웃 (다수 웹서비스)

`design5`뿐 아니라 앞으로 추가될 **사내망 웹서비스**를 같은 호스트에 두기 위한 **호스트 경로·역할** 규칙입니다. Docker Compose · 데이터 볼륨 · (선택) 전면 Nginx 를 이 구조에 맞춥니다.

## 권장 트리

```text
/data/webapps/
├── _shared/                        # (선택) 전역 리버스 프록시, TLS, 공용 인증서
│   └── nginx/                      # conf.d, certs — 여러 server 블록으로 앱마다 split
│
├── design5/                        # 이 프로젝트
│   ├── data/                       # DATA_ROOT = .../design5/data (Compose 볼륨)
│   │   ├── postgres/
│   │   └── minio/
│   └── (선택) repo 를 서버에 클론한 경우 이 아래 deploy/rocky
│
└── <다음-서비스>/                 # 예: team-wiki, internal-tools …
    └── data/
        ├── postgres/               # 앱이 PG를 쓰면
        └── minio/                  # 앱이 MinIO(S3)를 쓰면
```

- **한 앱 = 한 `data/` 트리**로 두면 백업·권한·용량 쿼터를 서비스별로 나누기 쉽습니다.
- **DB·MinIO를 인프라팀이 한 대로만 운영**하는 정책이면, 대신 ` /data/infra/postgres` 등으로 분리할 수 있으나, 현재 `deploy/rocky`는 **design5 전용 인스턴스**를 가정합니다.

## Git / 배포

- **저장소**는 `design5` 레포 루트이고, **서버**에서는 `/data/webapps/design5/` 아래에 클론하거나, `deploy/rocky`만 복사해 compose를 돌릴 수 있습니다. 중요한 것은 **`.env`의 `DATA_ROOT`가 `.../design5/data` 를 가리키는 것**입니다.
- **앱(Next) 환경 변수** — MinIO/버킷/퍼블릭 URL **스펙**은 루트 `env.example.txt` 의 `S3_*` 절(사내망 옵션 B)에 있습니다. `deploy/rocky/.env`는 Docker만 소비합니다.

## 포트

- `design5` 스택이 **5432, 9000, 9001** 을 쓰면, **같은 호스트의 다른 앱**은 **다른 포트**로 맵핑하거나(Compose `ports:`), 앞단 `_shared/nginx`로만 노출해 충돌을 피합니다.
