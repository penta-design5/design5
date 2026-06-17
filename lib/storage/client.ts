/**
 * 스토리지 — 클라이언트 진입점 (Phase 3)
 *
 * 클라이언트 컴포넌트에서 이미지/자산 URL을 다룰 때 쓰는 분류·변환 함수의 단일 진입점.
 * 구현은 기존 모듈(b2-client-url / public-asset-url / legacy-asset-bases)에 그대로 두고
 * 여기서 재export만 한다 — 동작 변화 없음. 신규 클라이언트 코드는 이 파일에서 import 권장.
 *
 * ⚠️ 서버 전용 업로드/다운로드/키 변환(@aws-sdk 의존)은 여기 포함하지 않는다.
 *    (클라이언트 번들에 서버 SDK가 섞이는 것을 막기 위한 의도적 분리.)
 *    서버용 단일 진입점은 추후 사내 개발망에서 런타임 검증과 함께 정리 예정 — REFACTORING_HANDOFF §3 참조.
 */

export {
  isB2StorageUrlForClient,
  isB2WorkerUrl,
  getB2ImageSrc,
} from '@/lib/b2-client-url'

export { isKnownPublicAssetBaseUrl } from '@/lib/public-asset-url'

export {
  getPublicStorageBasePrefixes,
  urlStartsWithAnyPublicBase,
  urlHostIsLegacyCdn,
  urlLooksLikeBackblazeB2S3Url,
  urlHostNeedsUnoptimizedImage,
  getUnoptimizedImageLegacyHostnames,
} from '@/lib/legacy-asset-bases'
