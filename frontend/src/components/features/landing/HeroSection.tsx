import Link from "next/link";
import Image from "next/image";
import { Phone, ClipboardList, Building2 } from "lucide-react";
import { ROUTES, COMPANY_INFO } from "@/lib/constants";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-[600px] lg:min-h-[calc(100vh-100px)]">
      {/* 배경 이미지 - 연하게 */}
      <div className="absolute inset-0">
        <Image
          src="/main_bg.webp"
          alt="전원주택 일러스트"
          fill
          className="object-cover object-center opacity-45"
          priority
        />
        {/* 그라데이션 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-white/90" />
      </div>

      {/* 콘텐츠 영역 */}
      <div className="relative z-10 container mx-auto px-4">
        <div className="flex flex-col items-center justify-center min-h-[600px] lg:min-h-[calc(100vh-100px)] py-12 lg:py-16">
          {/* 중앙 정렬 콘텐츠 */}
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            {/* 브랜드 계층 표시 */}
            <div className="inline-flex items-center gap-3 text-xl md:text-2xl text-gray-600 font-semibold bg-white/70 backdrop-blur-sm px-6 py-2 rounded-full">
              <span className="font-bold text-primary">전방</span>
              <span>|</span>
              <span>전원생활 토탈 솔루션</span>
            </div>

            {/* 메인 타이틀 */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tight text-gray-900 drop-shadow-sm">
              <span className="text-primary">전방</span> 홈케어
            </h1>

            {/* 서브 카피 */}
            <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-700">
              {COMPANY_INFO.slogan}
            </p>

            {/* 설명 텍스트 */}
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed">
              <span className="inline">전원주택의 모든 관리를</span>{" "}
              <span className="inline">원스톱으로 제공하는</span>
              <br className="hidden sm:inline" />
              <strong className="text-gray-800 font-bold inline">
                {" "}
                집사 개념의 주택 관리 서비스
              </strong>
              입니다.
            </p>

            {/* CTA 카드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-8 max-w-2xl mx-auto">
              <Link
                href={ROUTES.APPLY}
                className="big-cta-card big-cta-card-primary group"
              >
                <div className="flex-1">
                  <h3 className="text-2xl md:text-3xl font-bold mb-2">
                    <span className="whitespace-nowrap">견적</span>{" "}
                    <span className="whitespace-nowrap">요청하기</span>
                  </h3>
                  <p className="text-white/90 text-base md:text-lg">
                    <span className="whitespace-nowrap">전문 상담원이</span>{" "}
                    <span className="whitespace-nowrap">
                      친절하게 안내드립니다
                    </span>
                  </p>
                </div>
                <ClipboardList
                  className="w-14 h-14 md:w-16 md:h-16 text-white/90 group-hover:scale-110 transition-transform flex-shrink-0"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href={ROUTES.PARTNER}
                className="big-cta-card big-cta-card-secondary group"
              >
                <div className="flex-1">
                  <h3 className="text-2xl md:text-3xl font-bold mb-2">
                    <span className="whitespace-nowrap">협력사 신청하기</span>
                  </h3>
                  <p className="text-white/90 text-base md:text-lg">
                    <span className="whitespace-nowrap">
                      전방과 함께 성장할
                    </span>{" "}
                    <span className="whitespace-nowrap">
                      협력사를 모집합니다
                    </span>
                  </p>
                </div>
                <Building2
                  className="w-14 h-14 md:w-16 md:h-16 text-white/90 group-hover:scale-110 transition-transform flex-shrink-0"
                  aria-hidden="true"
                />
              </Link>
            </div>

            {/* 전화번호 섹션 */}
            <div className="pt-6">
              <div className="inline-flex items-center gap-4 bg-white/95 backdrop-blur-sm rounded-2xl px-8 py-5 shadow-xl border border-gray-100">
                <div className="text-left">
                  <div className="flex items-center gap-2 text-2xl text-gray-600 mb-1">
                    <Phone
                      className="w-6 h-6 text-primary"
                      aria-hidden="true"
                    />
                    <span className="font-semibold">문의</span>
                  </div>
                  <a
                    href={`tel:${COMPANY_INFO.phone}`}
                    className="text-2xl md:text-3xl lg:text-4xl font-black text-secondary hover:opacity-80 transition-opacity block"
                    aria-label={`전화 문의: ${COMPANY_INFO.phone}`}
                  >
                    {COMPANY_INFO.phone}
                  </a>
                </div>
              </div>
            </div>

            {/* QR 코드 - 데스크톱에서만 */}
            <div className="hidden lg:flex justify-center pt-4">
              <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-xl px-6 py-3">
                <div className="w-16 h-16 bg-white rounded-lg shadow border border-gray-200 flex items-center justify-center p-1">
                  <Image
                    src="/domain-qr.png"
                    alt="전방 홈케어 모바일 접속 QR 코드"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm text-gray-600 font-medium">
                  QR 코드로
                  <br />
                  모바일에서 바로 접속
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
