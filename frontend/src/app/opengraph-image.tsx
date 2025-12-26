import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "전방 홈케어 - 전원주택 관리의 새로운 기준";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: "linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #1e3a5f 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          padding: "40px 80px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              marginBottom: 16,
              textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            전방 홈케어
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 400,
              marginBottom: 32,
              opacity: 0.9,
            }}
          >
            전원주택 관리의 새로운 기준
          </div>
          <div
            style={{
              display: "flex",
              gap: 24,
              fontSize: 24,
              opacity: 0.8,
            }}
          >
            <span>제초</span>
            <span>|</span>
            <span>조경</span>
            <span>|</span>
            <span>청소</span>
            <span>|</span>
            <span>시공</span>
          </div>
          <div
            style={{
              marginTop: 40,
              fontSize: 20,
              opacity: 0.7,
              borderTop: "1px solid rgba(255,255,255,0.3)",
              paddingTop: 24,
            }}
          >
            양평 | 가평 지역 전문 서비스
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
