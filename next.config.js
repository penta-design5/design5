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

