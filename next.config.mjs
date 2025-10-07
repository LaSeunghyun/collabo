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
  typescript: {
    // 빌드 시 TypeScript 오류가 있어도 계속 진행
    ignoreBuildErrors: true,
  },
  eslint: {
    // 빌드 시 ESLint 오류가 있어도 계속 진행
    ignoreDuringBuilds: true,
  },
  // 문제가 있는 파일들을 제외
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
