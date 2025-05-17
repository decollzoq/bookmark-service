import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        // 북마크 등 /api로 시작하는 API 요청을 위한 규칙
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
      {
        // 인증 관련 /auth로 시작하는 API 요청을 위한 규칙
        source: '/auth/:path*',
        destination: 'http://localhost:8080/auth/:path*',
      }
    ];
  },
};

export default nextConfig;
