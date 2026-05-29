# 📝 Changelog

모든 주요 변경 사항을 이 파일에 기록합니다.

---

## 🆕 [2026-05-29] fix/20260529-upload-smtp-mirror

### 🐛 버그 수정

#### 스토리지 URL 처리 개선 (핵심 변경)

> ⚠️ 후임자 참고: 아래 4개 파일은 서로 연관되어 동작합니다. 하나를 수정하면 반드시 나머지도 함께 검토하세요.

| 파일 | 역할 |
|------|------|
| `lib/s3/config.ts` | URL 생성 (publicUrlForBucketKey 등) |
| `lib/s3/post-storage.ts` | posts 버킷 키 추출 (getPostObjectKeyFromUrl) |
| `lib/s3/url-helpers.ts` | 범용 키 추출 (s3ObjectKeyFromAnyPublicUrl) |
| `lib/r2-edm-storage.ts` | eDM 전용 업로드/URL 생성 |

**`lib/s3/url-helpers.ts`** — `s3ObjectKeyFromAnyPublicUrl` 버킷명 제거 로직 추가
```
// 변경 전: 버킷명 포함된 채로 key 반환 → NoSuchKey 오류
return url.slice(base.length).replace(/^\//, '')

// 변경 후: 버킷명 자동 제거
const path = url.slice(base.length).replace(/^\//, '')
return path.startsWith(bucket + '/') ? path.slice(bucket.length + 1) : path
```

**`lib/s3/config.ts`** — `publicUrlForEdmsKey` 버킷명 누락 수정
```
// 변경 전: URL에 edms/ 버킷명 없음
// 변경 후: publicUrlForBucketKey 사용으로 버킷명 자동 포함
export function publicUrlForEdmsKey(key: string): string {
  return publicUrlForBucketKey(getBucketEdms(), key)
}
```

**`lib/r2-edm-storage.ts`** — `uploadEdmFile` URL 생성 시 edms/ 버킷명 자동 포함
```
// 변경 전
result.fileUrl = `${pub}/${filePath}`

// 변경 후
const prefixed = k.startsWith(b + '/') ? k : `${b}/${k}`
result.fileUrl = `${pub}/${prefixed}`
```

#### 기타 버그 수정
- `app/api/posts/generate-thumbnail-svg/route.ts` — SVG 썸네일 경로 `thumbnails/파일명` → `파일명_thumb.png`
- `app/api/profile/upload-avatar/route.ts` — `storagePath`에서 `avatars/` 중복 제거

### 🔧 인프라
- `deploy/rocky/docker-compose.yml` — `minio/mc:latest` → `minio/mc:RELEASE.2025-08-13T08-35-41Z` 버전 고정
- `.gitignore` — `/data/`, `/data-backup-incoming/`, `*.bak` 추가

### 🌐 미러 사이트
- design5.pentasecurity.com (192.168.1.42) 운영 서버 구축 완료 (Rocky Linux 10.1 VM)
- design6.pentasecurity.com (192.168.1.43) VM 스냅샷으로 스테이징 환경 구축 (Rocky Linux 10.1 VM)
- Google OAuth 2.0 design6 전용 Client ID 적용

---

## [2026-04-28] 사내망 postfres, minio 마이그레이션 반영

- Vercel + Supabase + B2/R2 클라우드 환경 → Rocky Linux 사내망 환경으로 전환
- PostgreSQL 17 + MinIO (S3 호환) Docker 기반 배포
- S3_* 환경변수 기반 스토리지 통합 (Backblaze B2 SDK 제거)
- deploy/rocky/ 배포 스크립트 추가

---

## ⏳ 보류 항목

- 메일 본문 하드코딩 주소 변경 (tiper@pentasecurity.com → no-reply 안내 문구)
- replyTo 환경변수화 (MAIL_REPLY_TO=design@pentasecurity.com)
- `lib/privileged-admin.ts`, `lib/design-system-access.ts` 하드코딩 이메일 환경변수 분리
