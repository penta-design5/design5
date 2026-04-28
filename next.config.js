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
      }
    } else {
      // 서버 사이드에서는 konva를 무시
      config.externals = [...(config.externals || []), 'konva', 'canvas']
    }

    return config
  },
}

module.exports = nextConfig

