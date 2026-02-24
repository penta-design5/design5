# 배포 가이드

## 배포 환경

이 프로젝트는 **Vercel** 기준으로 배포를 안내합니다. 커스텀 도메인 사용 시 `[실제 값으로 교체]` 형태의 placeholder를 배포 URL로 변경하세요.

---

## 사전 준비

- **Supabase 프로젝트**: PostgreSQL 데이터베이스
- **Backblaze B2 버킷**: 이미지/파일 저장 (다이어그램, 게시물 썸네일, PPT ZIP 등). 버킷을 private으로 두고 Cloudflare Worker로 공개할 경우 `B2_PUBLIC_URL`을 Worker 도메인(예: `https://assets.layerary.com`)으로 설정하세요.
- **Cloudflare R2 버킷**: eDM 셀 이미지 저장 (이메일 HTML용)
- **(선택) Google OAuth 클라이언트**: Google 로그인 사용 시

---

## 환경 변수

`env.example.txt`를 참고해 Vercel 환경 변수를 설정하세요.

| 변수 | 필수 | 설명 |
|------|------|------|
| `DATABASE_URL` | ✅ | Supabase PostgreSQL 연결 URL (connection_limit=1 권장) |
| `DIRECT_URL` | ✅ | Supabase 직접 연결 URL (마이그레이션용) |
| `NEXTAUTH_URL` | ✅ | 배포 URL (예: https://layerary.com) |
| `NEXTAUTH_SECRET` | ✅ | NextAuth 시크릿 키 |
| `B2_APPLICATION_KEY_ID` | ✅ | Backblaze B2 |
| `B2_APPLICATION_KEY` | ✅ | Backblaze B2 |
| `B2_BUCKET_ID` | ✅ | Backblaze B2 |
| `B2_BUCKET_NAME` | ✅ | Backblaze B2 |
| `B2_ENDPOINT` | ✅ | Backblaze B2 엔드포인트 |
| `B2_PUBLIC_URL` | 권장 | B2 공개 URL (예: Cloudflare Worker `https://assets.layerary.com`). 버킷을 private으로 두고 Worker로 서빙할 때 설정. 설정 시 업로드 후 저장되는 fileUrl이 이 주소를 사용합니다. |
| `NEXT_PUBLIC_B2_PUBLIC_URL` | 선택 | 클라이언트용 B2 공개 URL. `B2_PUBLIC_URL`과 동일하게 두면 Worker URL은 프록시 없이 직접 로드됩니다. |
| `R2_ACCOUNT_ID` | ✅ | Cloudflare R2 (eDM 이미지) |
| `R2_ACCESS_KEY_ID` | ✅ | Cloudflare R2 |
| `R2_SECRET_ACCESS_KEY` | ✅ | Cloudflare R2 |
| `R2_BUCKET_NAME` | ✅ | R2 버킷 이름 (예: `edms`) |
| `R2_PUBLIC_URL` | 권장 | eDM 이미지 공개 URL (예: `https://cdn.layerary.com`). 설정 시 이메일에서 만료 없이 표시 |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (Keepalive 등) |
| `GOOGLE_CLIENT_ID` | 선택 | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | 선택 | Google OAuth |
| `KEEPALIVE_SECRET` | 선택 | Keepalive API 보안용 (GitHub Actions와 동일 값) |
| `NEXT_PUBLIC_APP_URL` | 권장 | 클라이언트용 앱 URL |

---

## 빌드 설정

**Vercel → 프로젝트 → Settings → General → Build & Development Settings**

- **Build Command**: `prisma migrate deploy && next build`
- 배포 시 Prisma 마이그레이션이 자동 실행됩니다.

**마이그레이션 관련**
- `db push`로 이미 테이블이 생성된 경우, `prisma migrate resolve --applied <migration_name>` 으로 적용 완료 표시 가능
- `DIRECT_URL`이 마이그레이션용 Transaction 모드 연결로 사용됩니다

---

## Backblaze B2 (CORS – Presigned 직접 업로드)

CI/BI, Character, PPT, 웰컴보드, Wapples, Isign, Damo, Cloudbric 등은 **Presigned URL**로 브라우저에서 B2에 직접 업로드합니다. 배포 도메인(예: https://layerary.com)에서 이 업로드가 동작하려면 **B2 버킷에 CORS**를 설정해야 합니다.

1. 로컬에서 B2 인증 정보가 들어 있는 `.env` / `.env.local`을 준비한 뒤:
2. 다음 명령을 **한 번** 실행하세요.
   ```bash
   npm run b2:setup-cors
   ```
3. 스크립트에 **https://layerary.com**, **https://www.layerary.com**이 기본으로 포함됩니다. 적용까지 수 분 걸릴 수 있습니다.
4. 추가 출처가 필요하면 환경 변수 `B2_CORS_ORIGINS`(쉼표 구분)를 설정한 뒤 같은 명령을 다시 실행하세요.

(Penta Design 갤러리는 서버 경유 업로드(`/api/posts/upload`)를 사용하므로 CORS 없이도 동작합니다.)

---

## Cloudflare R2 (eDM 이미지)

eDM(이메일 디렉트 메일)의 셀 이미지와 썸네일은 **Cloudflare R2**에 저장됩니다. R2는 S3 호환 API를 사용하며, 이메일 HTML에서 이미지 URL이 오래 유지되어야 하므로 공개 URL 또는 Presigned URL을 사용합니다.

### R2 버킷 생성

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2 Object Storage** → **Create bucket**
2. 버킷 이름: 예) `edms`
3. 생성 후 **Settings**에서 **Public access** (선택): 커스텀 도메인 연결 시 `R2_PUBLIC_URL`로 공개 URL 사용 가능

### R2 API 토큰 생성

1. R2 → **Manage R2 API Tokens** → **Create API token**
2. 권한: **Object Read & Write**
3. 생성된 **Access Key ID**, **Secret Access Key**를 Vercel 환경 변수 `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`에 설정
4. **Account ID**는 Cloudflare 대시보드 URL 또는 Overview에서 확인 → `R2_ACCOUNT_ID`에 설정

### 환경 변수 요약

| 변수 | 설명 |
|------|------|
| `R2_ACCOUNT_ID` | Cloudflare 계정 ID |
| `R2_ACCESS_KEY_ID` | R2 API 액세스 키 |
| `R2_SECRET_ACCESS_KEY` | R2 API 시크릿 키 |
| `R2_BUCKET_NAME` | 버킷 이름 (예: `edms`) |
| `R2_PUBLIC_URL` | (권장) 공개 액세스 기준 URL. 설정 시 DB에 공개 URL 저장 → 이메일에서 만료 없이 이미지 표시. 미설정 시ㅇ Presigned URL(최대 7일) 사용 |

구현: `lib/r2-edm-storage.ts` (AWS SDK S3 호환 클라이언트 사용)

---

## 도메인 설정

1. Vercel에서 커스텀 도메인 연결
2. `NEXTAUTH_URL`을 배포 URL로 설정 (예: `https://layerary.com`)
3. Google OAuth 사용 시, 리다이렉트 URI 등록 필요

---

## CI/CD

- **GitHub 연동**: push 시 Vercel 자동 배포
- **Keepalive**: Supabase 무료 플랜 7일 비활동 일시정지 방지용

### Keepalive 설정

[docs/KEEPALIVE_SETUP.md](KEEPALIVE_SETUP.md) 참조

- GitHub Actions → **Variables**: `APP_URL` (배포 URL)
- GitHub Actions → **Secrets** (선택): `KEEPALIVE_SECRET`
- Vercel 환경 변수: `KEEPALIVE_SECRET` (동일 값)
- 워크플로: `.github/workflows/keepalive.yml` — **매 3일마다** `{APP_URL}/api/keepalive` 호출

---

## 주의사항

1. **Konva/Canvas**: `next.config.js`에서 externals로 처리. Vercel에서 정상 동작.
2. **Sharp**: Vercel 기본 환경 지원.
3. **bcryptjs**: Edge Runtime 미지원 경고가 있을 수 있으나, API 라우트에서만 사용되므로 무시 가능.
