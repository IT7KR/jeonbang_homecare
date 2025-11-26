import type { NextConfig } from "next";

// 환경별 basePath 설정
// - 개발: 빈 값 (localhost:3000/)
// - 운영: '/homecare' (test.com/homecare/)
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  // Docker 배포용 standalone 출력
  output: "standalone",

  // 환경별 basePath (운영: /homecare)
  basePath: basePath,
  assetPrefix: basePath,

  // 이미지 최적화 설정
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "*.jeonbang.kr",
        pathname: "/uploads/**",
      },
    ],
  },

  // /uploads 경로를 백엔드로 프록시
  // - 개발 환경: Docker 네트워크에서 backend 서비스로 라우팅
  // - 운영 환경: nginx가 직접 처리 (이 설정은 무시됨)
  async rewrites() {
    // Docker 내부에서는 서비스 이름 사용, 로컬에서는 localhost
    const backendHost = process.env.BACKEND_INTERNAL_URL || "http://backend:8000";
    return [
      {
        source: "/uploads/:path*",
        destination: `${backendHost}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
