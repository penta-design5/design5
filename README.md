# 🎨 LAYERARY - Design5 내부 디자인 리소스 플랫폼

> 펜타시큐리티 사내 디자인 자산 관리 시스템

---

## 🆕 최근 변경사항 (2026-05-29)

- ✅ 업로드 시스템 전면 수정 (경로 정규화, 썸네일 버그 수정)
- ✅ Google SMTP relay 전환 (IP 기반 인증, 발신자 no-reply@pentasecurity.com)
- ✅ Nginx 라우팅 개선 (정규식 블록 통합, Next.js 라우트 충돌 해결)
- ✅ ICON PNG/JPG 다운로드 버그 수정
- ✅ 프로필 아바타 업로드 버그 수정
- ✅ eDM URL 버킷명 누락 수정
- ✅ design6.pentasecurity.com 미러/스테이징 환경 구축
- ✅ minio/mc 이미지 버전 고정 (latest → RELEASE.2025-08-13T08-35-41Z)

---

## 📋 서비스 소개

LAYERARY는 펜타시큐리티 임직원을 위한 디자인 리소스 플랫폼입니다.
CI/BI, PPT 템플릿, 아이콘, 캐릭터, 브로슈어 등 각종 디자인 자산을 한 곳에서 관리하고 공유할 수 있습니다.

---

## 🗂️ 주요 기능

| 카테고리 | 기능 |
|----------|------|
| 🖼️ **Penta Design** | 디자인 작업물 갤러리 (포스터, eDM, 행사 자료 등) |
| 🏷️ **CI/BI** | 브랜드 아이덴티티 자산 (로고, 심볼) |
| 🔷 **ICON** | SVG/PNG 아이콘 다운로드 (색상, 크기 변환 지원) |
| 🧑 **캐릭터** | 부서별 캐릭터 SVG |
| 📊 **PPT** | PowerPoint 템플릿 다운로드 |
| 🖥️ **바탕화면** | Mac/Windows 배경화면 |
| 👋 **웰컴보드** | 신입 환영 보드 템플릿 |
| 🎴 **감사/연말 카드** | 카드 템플릿 |
| 📐 **다이어그램** | 서비스/시스템 구조도 |
| 📧 **eDM** | 이메일 eDM 코드 생성기 |
| 📝 **디자인 의뢰** | 디자인 작업 의뢰 게시판 (이메일 알림) |

---

## ⚙️ 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend/Backend | Next.js 14 (App Router, Standalone) |
| Database | PostgreSQL 17 |
| Object Storage | MinIO (S3 호환) |
| Web Server | Nginx 1.27 |
| Container | Docker Compose |
| Auth | NextAuth.js (Credentials + Google OAuth) |
| ORM | Prisma |
| UI | Tailwind CSS + Shadcn UI |
| Mail | Google SMTP relay (nodemailer) |

---

## 🏗️ 시스템 구성

```
Browser → Nginx (TLS) → Next.js App → PostgreSQL
                                    → MinIO (S3)
```

---

## 🌐 배포 환경

| 구분 | 도메인 | 서버 | 용도 |
|------|--------|------|------|
| 🟢 **운영** | design5.pentasecurity.com | Rocky Linux | 실서비스 |
| 🔵 **미러/스테이징** | design6.pentasecurity.com | VM (192.168.1.43) | 테스트/QA |

---

## 🚀 빠른 시작

```bash
# 1. 환경변수 설정
cp deploy/rocky/env.example.txt deploy/rocky/.env
cp deploy/rocky/env.example.txt deploy/rocky/.env.app
# .env, .env.app 편집

# 2. Docker network 생성
docker network create design5-net

# 3. DB/MinIO 기동
docker compose --env-file deploy/rocky/.env up -d

# 4. 앱 빌드 및 기동
docker compose -f deploy/rocky/docker-compose.yml \
  -f deploy/rocky/docker-compose.app.yml \
  --env-file deploy/rocky/.env.app up -d --build app
```

---

## 📚 문서

- 📦 [배포 가이드](deploy/rocky/README.md)
- 🏛️ [아키텍처](docs/ARCHITECTURE.md)
- 🔧 [인프라](docs/INFRASTRUCTURE.md)
- ✅ [배포 체크리스트](DEPLOYMENT_CHECKLIST.md)
- 📝 [변경 이력](CHANGELOG-20260529.md)

---

## ⚠️ 주의사항

- `.env`, `.env.app` 파일은 Git에 포함되지 않습니다. `env.example.txt` 참고
- 민감 정보(DB 비밀번호, OAuth 키 등)는 서버에서 직접 관리
- 새 카테고리 추가 시 `deploy/rocky/nginx/app-http.conf` 정규식 블록 slug 목록에 추가 필요
