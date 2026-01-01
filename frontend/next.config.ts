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
    // 최신 이미지 포맷 지원 (WebP, AVIF)
    formats: ["image/avif", "image/webp"],
    // 반응형 이미지 크기 설정
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // 이미지 캐싱 최적화 (1일)
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8020",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8020",
        pathname: "/api/v1/files/**",
      },
      {
        protocol: "https",
        hostname: "*.jeonbang.com",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "*.jeonbang.com",
        pathname: "/api/v1/files/**",
      },
      {
        protocol: "https",
        hostname: "*.geonbang.com",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "*.geonbang.com",
        pathname: "/api/v1/files/**",
      },
    ],
  },

  // /uploads 경로를 백엔드로 프록시
  // - 개발 환경: Docker 네트워크에서 backend 서비스로 라우팅
  // - 운영 환경: nginx가 직접 처리 (이 설정은 무시됨)
  async rewrites() {
    // Docker 내부에서는 서비스 이름 사용, 로컬에서는 localhost
    const backendHost =
      process.env.BACKEND_INTERNAL_URL || "http://backend:8020";
    return [
      {
        source: "/uploads/:path*",
        destination: `${backendHost}/uploads/:path*`,
      },
      {
        source: "/api/v1/files/:path*",
        destination: `${backendHost}/api/v1/files/:path*`,
      },
    ];
  },

  // 보안 헤더 설정
  async headers() {
    return [
      {
        // 모든 경로에 보안 헤더 적용
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              // 기본 정책: 동일 출처만 허용
              "default-src 'self'",
              // 스크립트: 동일 출처 + Next.js 인라인 스크립트 허용 + Daum 우편번호 API
              `script-src 'self' 'unsafe-inline' https://t1.daumcdn.net ${
                process.env.NODE_ENV === "development" ? "'unsafe-eval'" : ""
              }`,
              // 스타일: 동일 출처 + 인라인 스타일 허용 (Tailwind CSS용)
              "style-src 'self' 'unsafe-inline'",
              // 이미지: 동일 출처 + data URI + blob + 백엔드 API (파일 서빙용)
              "img-src 'self' data: blob: http://localhost:8020 https://*.jeonbang.kr",
              // 폰트: 동일 출처
              "font-src 'self'",
              // API 연결: 동일 출처 + 백엔드 API
              "connect-src 'self' http://localhost:8020 https://*.jeonbang.com https://*.geonbang.com",
              // iframe: 주소 검색용 카카오/다음 API (HTTP/HTTPS 모두 허용)
              "frame-src 'self' https://t1.daumcdn.net http://t1.daumcdn.net https://postcode.map.daum.net http://postcode.map.daum.net",
              // 기본 URI: 동일 출처
              "base-uri 'self'",
              // form 액션: 동일 출처
              "form-action 'self'",
              // frame ancestors: 클릭재킹 방지
              "frame-ancestors 'self'",
            ].join("; "),
          },
          {
            // 클릭재킹 방지
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            // MIME 스니핑 방지
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            // XSS 필터링 (레거시 브라우저용)
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            // Referrer 정책
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            // 권한 정책 (불필요한 기능 비활성화)
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
