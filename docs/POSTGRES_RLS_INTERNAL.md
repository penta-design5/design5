# 사내 PostgreSQL — RLS(행 수준 보안) 참고

이 앱은 **Next.js API + Prisma**가 DB에 접속하는 구조이며, **Supabase PostgREST(익명/anon 키로 테이블 직접 조회)** 를 쓰지 않습니다. 따라서 [SUPABASE_SECURITY_SETUP.md](SUPABASE_SECURITY_SETUP.md)에 적힌 **Supabase 대시보드·API 노출** 관점의 조치와는 전제가 다릅니다.

## RLS를 켤까?

| 선택 | 설명 |
|------|------|
| **끄거나 최소** | Prisma는 보통 **단일 DB 역할**(예: `design5_app`)으로 모든 쿼리를 실행합니다. RLS를 켜면 **그 역할에 대한 정책**을 모든 테이블·모든 경로에 맞게 설계해야 하며, 누락 시 앱 전반이 깨질 수 있습니다. |
| **켜기(선택)** | **DB에 직접 붙는 다른 클라이언트**(BI 도구, 실수로 공개된 연결 문자열 등)를 막고 싶을 때 유효합니다. 정책은 `auth.uid()` 대신 **애플리케이션 역할 + 세션 변수**(`SET LOCAL app.user_id = ...`) 같은 패턴을 검토합니다. |

## 실무 권장

- **네트워크**: DB 포트는 사내망/VPN만, 방화벽으로 제한.  
- **계정 분리**: 앱용 계정과 관리자(`psql`/백업) 계정 분리, 최소 권한.  
- **백업·감사**: `pg_dump`, 연결 로그, 변경 감사는 운영 정책에 따름.

## 참고 링크

- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)  
