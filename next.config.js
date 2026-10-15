const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 사내망 Docker( deploy/rocky/Dockerfile )의 standalone 러너용
  output: 'standalone',
  images: {
    // https: 공용 CDN/클라우드. http+**: 사내/로컬 MinIO(예: http://host:19000) Next/Image 로딩
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  // TOOLBOX 텍스트추출(OCR): 이 페이지만 교차 출처 격리(crossOriginIsolated) → onnxruntime-web 멀티 스레드(약 3배 빠름).
  // credentialless는 Chrome·Edge·Firefox 지원(Safari는 격리 없이 1스레드로 동작). 다른 페이지는 영향 없음.
  // SPA 이동으로 들어오고 나갈 때의 처리는 components/toolbox/text-extractor/use-cross-origin-isolation.ts
  async headers() {
    return [
      {
        source: '/toolbox/text-extractor',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
        ],
      },
      // 격리된 페이지는 Worker 스크립트에도 COEP가 있어야 Worker를 만들 수 있다(없으면 ERR_BLOCKED_BY_RESPONSE).
      // OCR Worker 번들(/_next/static)·pdf.js 워커(/js). 일반 스크립트에는 효과가 없고, 다른 페이지 Worker는
      // 외부 출처 요청에 쿠키를 싣지 않는 정도(배경 편집·모자이크 Worker는 쿠키 없이 CDN에서 받으므로 영향 없음)
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' }],
      },
      {
        source: '/js/:path*',
        headers: [{ key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' }],
      },
    ]
  },
  webpack: (config, { isServer }) => {
    // Konva는 클라이언트 사이드에서만 사용
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
        // TOOLBOX 배경 편집: wasm을 번들에 넣지 않는 빌드(ort.min.mjs) — wasm(약 25MB)은 jsDelivr CDN에서 받는다.
        // 기본 진입점(ort.bundle.min.mjs)은 wasm을 빌드 산출물로 복사한다. package exports 밖의 파일이라 경로로 지정
        'onnxruntime-web$': path.join(__dirname, 'node_modules/onnxruntime-web/dist/ort.min.mjs'),
      }
      // ORT는 자기 위치를 `new URL('ort.min.mjs', import.meta.url)`로 구한다. webpack이 이를 정적 자원으로 복사하면
      // 프로덕션 압축(Terser)이 그 복사본에서 실패한다 → ORT 파일만 new URL 자원 처리를 끈다(wasm 위치는 wasmPaths로 지정)
      config.module.rules.push({
        test: /[\\/]node_modules[\\/]onnxruntime-web[\\/]dist[\\/].*\.mjs$/,
        parser: { url: false },
      })
    } else {
      // 서버 사이드에서는 konva를 무시
      config.externals = [...(config.externals || []), 'konva', 'canvas']
    }

    return config
  },
}

module.exports = nextConfig

