# 배포 가이드

## 배포 환경

이 프로젝트는 **Vercel** 기준으로 배포를 안내합니다. 커스텀 도메인 사용 시 `[실제 값으로 교체]` 형태의 placeholder를 배포 URL로 변경하세요.

---

## 사전 준비

- **Supabase 프로젝트**: PostgreSQL 데이터베이스, Storage (eDM용)
- **Backblaze B2 버킷**: 이미지/파일 저장 (다이어그램, 게시물 썸네일, PPT ZIP 등)
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
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key |
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

## Supabase Storage (eDM)

eDM 이미지는 Supabase Storage를 사용합니다.

1. Supabase Dashboard → **Storage** → **New bucket**
2. 버킷 이름: `edms`
3. **Public bucket** 체크
4. 생성

자세한 보안 설정은 [docs/SUPABASE_SECURITY_SETUP.md](SUPABASE_SECURITY_SETUP.md)를 참조하세요.

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
