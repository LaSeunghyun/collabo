/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      }
    ]
  },
  // TypeScript와 ESLint 오류는 빌드 시 확인하도록 설정
  // 실제 오류가 발생하면 빌드가 실패하도록 함
  // 문제가 있는 파일들을 제외
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        perf_hooks: false,
      };
    }
    return config;
  },
};

export default nextConfig;
