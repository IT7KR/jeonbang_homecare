import Link from "next/link";
import Image from "next/image";
import {
  Phone,
  ArrowRight,
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceGrid } from "@/components/features/landing/ServiceGrid";
import { CompanyIntroCards } from "@/components/features/landing/CompanyIntroCards";
import {
  CORE_ROLES,
  REQUEST_PROCESS,
  SERVICE_STRUCTURE,
  COMPANY_INTRO,
  PARTNER_BENEFITS,
  SECTIONS,
  ROUTES,
  COMPANY_INFO,
} from "@/lib/constants";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* ========================================
          Hero 섹션 - 좌/우 스플릿 레이아웃
          ======================================== */}
      <section className="relative min-h-[600px] lg:min-h-[85vh] flex items-center overflow-hidden">
        {/* 배경 그라데이션 */}
        <div className="absolute inset-0 -z-20">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50/80 via-white to-secondary-50/30" />
        </div>

        {/* 배경 이미지 (우측/하단) */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute right-0 bottom-0 w-full lg:w-3/5 h-[50%] lg:h-full">
            <Image
              src="/main_bg.webp"
              alt="전원주택 일러스트"
              fill
              className="object-contain object-right-bottom lg:object-right opacity-90"
              priority
            />
          </div>
          {/* 이미지 위 오버레이 (텍스트 가독성) */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent lg:via-white/70" />
        </div>

        <div className="container mx-auto px-4 py-16 lg:py-20">
          <div className="max-w-2xl space-y-6">
            {/* 브랜드 계층 표시 */}
            <div className="inline-flex items-center gap-2 text-sm text-gray-500">
              <span className="font-medium">전방</span>
              <span>|</span>
              <span>전원생활 토탈 솔루션</span>
            </div>

            {/* 메인 타이틀 */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
              <span className="text-primary">전방</span> 홈케어
            </h1>

            {/* 서브 카피 - 대비 강화 */}
            <p className="text-xl md:text-2xl font-medium text-gray-700 leading-relaxed">
              {COMPANY_INFO.slogan}
            </p>

            {/* 설명 텍스트 */}
            <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-lg">
              전원주택의 모든 관리를 원스톱으로 제공하는
              <br className="hidden sm:block" />
              <strong className="text-gray-800">
                집사 개념의 주택 관리 서비스
              </strong>
              입니다.
            </p>

            {/* CTA 버튼 - 명확한 구분 */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
              <Button
                size="lg"
                asChild
                className="w-full sm:w-auto text-lg font-semibold h-14 sm:h-12 px-8 shadow-lg shadow-primary/20"
              >
                <Link href={ROUTES.APPLY}>
                  견적 요청하기
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                className="w-full sm:w-auto text-lg border-secondary bg-secondary text-white hover:bg-secondary/80 font-semibold h-14 sm:h-12 px-8"
                asChild
              >
                <Link href={ROUTES.PARTNER}>
                  협력사 신청하기
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            {/* 전화 문의 - 신뢰 요소 */}
            <div className="flex items-center gap-3 pt-2 text-gray-600">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-500">전화 문의</p>
                <a
                  href={`tel:${COMPANY_INFO.phone}`}
                  className="text-lg font-bold text-gray-900 hover:text-primary transition-colors"
                >
                  {COMPANY_INFO.phone}
                </a>
              </div>
            </div>
            {/* QR 코드 (데스크톱에서만 표시) */}
            <div className="hidden lg:block w-full max-w-sm">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="w-32 h-32 bg-white rounded-lg shadow-sm flex items-center justify-center mx-auto mb-3 border">
                  <QrCode className="h-20 w-20 text-primary/30" />
                </div>
                <p className="text-sm text-gray-500">
                  QR 코드로 모바일에서 바로 접속
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          전방 소개 섹션 - 홈케어 강조
          ======================================== */}
      <section
        id={SECTIONS.INTRO}
        className="relative py-20 lg:py-28 bg-gradient-to-b from-white to-gray-50 overflow-hidden"
      >
        <div className="section-divider-primary" />

        <div className="container mx-auto px-4">
          <div className="section-header">
            <p className="section-label-primary">About 전방</p>
            <h2 className="section-title">{COMPANY_INTRO.title}</h2>
            <p className="section-subtitle">{COMPANY_INTRO.description}</p>
          </div>

          {/* 3개 사업 영역 - 홈케어 강조 */}
          <CompanyIntroCards />

          {/* 홈케어 서비스 안내 배너 */}
          <div className="mt-14 max-w-3xl mx-auto">
            <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6 md:p-8 text-center">
              <p className="text-lg md:text-xl text-primary font-bold mb-3">
                전방 전원주택 관리 서비스
              </p>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                고객과 협력사, <span className="text-primary">전방</span>이 함께
                합니다.
              </h3>
              <p className="text-base md:text-lg text-gray-600">
                커뮤니케이션과 서비스 품질 관리를{" "}
                <span className="text-primary font-semibold">전방</span>이
                해드립니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          서비스 구조 섹션 - 전방 강조
          ======================================== */}
      <section
        id={SECTIONS.SERVICE_STRUCTURE}
        className="relative py-20 lg:py-28 bg-white"
      >
        <div className="section-divider" />

        <div className="container mx-auto px-4">
          <div className="section-header">
            <p className="section-label-primary">Service Flow</p>
            <h2 className="section-title">
              <span className="text-primary">전방</span> 홈케어 서비스 구조
            </h2>
            <p className="section-subtitle">
              전방은 고객과 협력사를 연결하는 신뢰할 수 있는 파트너입니다
            </p>
          </div>

          {/* 서비스 구조 다이어그램 - 양방향 화살표 */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0 max-w-5xl mx-auto">
            {SERVICE_STRUCTURE.map((item, index) => {
              const isCenter = index === 1; // 전방 (가운데)

              return (
                <div
                  key={item.role}
                  className="flex flex-col md:flex-row items-center"
                >
                  <Card
                    className={`text-center transition-all duration-300 ${
                      isCenter
                        ? "w-64 bg-primary/5 border-2 border-primary shadow-lg scale-105"
                        : "w-52 bg-white hover:shadow-lg"
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div
                        className={`flex items-center justify-center mx-auto mb-3 ${
                          isCenter
                            ? "w-24 h-24"
                            : "w-16 h-16 rounded-full overflow-hidden bg-primary-50"
                        }`}
                      >
                        <Image
                          src={item.icon}
                          alt={item.role}
                          width={isCenter ? 96 : 64}
                          height={isCenter ? 96 : 64}
                          unoptimized={isCenter}
                          className={isCenter ? "w-full h-full object-contain" : "w-full h-full object-cover"}
                        />
                      </div>
                      <CardTitle
                        className={`font-bold ${
                          isCenter
                            ? "text-2xl text-primary"
                            : "text-xl text-gray-900"
                        }`}
                      >
                        {item.role}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p
                        className={`text-sm leading-relaxed ${
                          isCenter ? "text-gray-700" : "text-gray-600"
                        }`}
                      >
                        {item.description}
                      </p>
                      {isCenter && (
                        <p className="mt-3 text-xs font-medium text-primary bg-primary/10 rounded-full px-3 py-1 inline-block">
                          품질 관리 총괄
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* 양방향 화살표 */}
                  {index < SERVICE_STRUCTURE.length - 1 && (
                    <div className="flex flex-col items-center my-4 md:my-0 md:mx-6">
                      {/* 데스크톱: 가로 양방향 */}
                      <div className="hidden md:flex flex-col items-center gap-1">
                        <ArrowRight className="h-5 w-5 text-primary" />
                        <ArrowLeft className="h-5 w-5 text-primary" />
                      </div>
                      {/* 모바일: 세로 양방향 */}
                      <div className="md:hidden flex flex-col items-center gap-1">
                        <ArrowDown className="h-5 w-5 text-primary" />
                        <ArrowUp className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 최하단 메시지 */}
          <p className="text-center mt-8 text-lg text-gray-600 font-medium">
            전방이{" "}
            <span className="text-primary font-bold">
              커뮤니케이션과 서비스 품질 관리
            </span>
            를 해드립니다.
          </p>
        </div>
      </section>

      {/* ========================================
          서비스 분야 섹션 - 아이콘 그리드
          ======================================== */}
      <section
        id={SECTIONS.SERVICES}
        className="relative py-20 lg:py-28 bg-gray-50"
      >
        <div className="section-divider-primary" />

        <div className="container mx-auto px-4">
          <div className="section-header">
            <p className="section-label-primary">Our Services</p>
            <h2 className="section-title">주택 관리 업무 분야</h2>
            <p className="section-subtitle">
              클릭하여 세부 서비스를 확인하세요
            </p>
          </div>

          <ServiceGrid />

          <div className="text-center mt-14">
            <Button
              size="lg"
              className="w-full sm:w-auto font-semibold h-14 sm:h-12 px-8 shadow-lg shadow-primary/20"
              asChild
            >
              <Link href={ROUTES.APPLY}>
                견적 요청하기
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ========================================
          전방의 핵심 역할 섹션 - 5단계 타임라인
          ======================================== */}
      <section
        id={SECTIONS.ROLES}
        className="relative py-20 lg:py-28 bg-primary-50/50"
      >
        <div className="section-divider-primary" />

        <div className="container mx-auto px-4">
          <div className="section-header">
            <p className="section-label-primary">Our Role</p>
            <h2 className="section-title">
              <span className="text-primary">전방</span>의 핵심 역할
            </h2>
            <p className="section-subtitle">
              집사 개념의 주택 관리, 전 과정을 함께 합니다
            </p>
          </div>

          {/* 5단계 프로세스 타임라인 */}
          <div className="max-w-7xl mx-auto">
            {/* 데스크톱: 가로 타임라인 */}
            <div className="hidden lg:block">
              {/* 연결선 */}
              <div className="relative mb-8">
                <div className="absolute top-7 left-[10%] right-[10%] h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30 rounded-full" />
              </div>

              <div className="grid grid-cols-5 gap-4">
                {CORE_ROLES.map((role) => (
                  <div key={role.step} className="text-center">
                    {/* 번호 원 */}
                    <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white font-bold text-xl shadow-lg mb-4 z-10">
                      {role.step}
                    </div>
                    {/* 타이틀 */}
                    <h3 className="font-bold text-lg text-gray-900 mb-2">
                      {role.title}
                    </h3>
                    {/* 설명 */}
                    <p className="text-sm text-gray-600 leading-relaxed px-2">
                      {role.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 모바일/태블릿: 세로 타임라인 */}
            <div className="lg:hidden relative">
              {/* 세로 연결선 */}
              <div className="absolute left-7 top-7 bottom-7 w-0.5 bg-primary/30" />

              <div className="space-y-8">
                {CORE_ROLES.map((role) => (
                  <div key={role.step} className="flex items-start gap-5">
                    {/* 번호 원 */}
                    <div className="timeline-dot flex-shrink-0">
                      {role.step}
                    </div>
                    {/* 내용 */}
                    <div className="flex-1 pt-2">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">
                        {role.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {role.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 강조 메시지 */}
            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-2 bg-white rounded-full px-6 py-3 shadow-md border border-primary/20">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="font-bold text-gray-900">
                  전방이 <span className="text-primary">전 과정</span>을 함께
                  합니다
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          간편한 견적 요청 섹션 - CTA 중심
          ======================================== */}
      <section id={SECTIONS.QUOTE} className="relative py-20 lg:py-28 bg-white">
        <div className="section-divider" />

        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="section-header">
              <p className="section-label-primary">Get Started</p>
              <h2 className="section-title">간편한 견적 요청</h2>
              <p className="section-subtitle">
                온라인으로 쉽고 빠르게 견적을 요청하세요
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* 프로세스 스텝 - 카드 형태 */}
              <div className="relative">
                {/* 세로 연결선 */}
                <div className="absolute left-7 top-7 bottom-7 w-0.5 bg-primary/20" />

                <div className="space-y-4">
                  {REQUEST_PROCESS.map((process) => (
                    <div
                      key={process.step}
                      className="relative flex items-start gap-5 bg-gray-50 rounded-xl p-5 hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 shadow-lg z-10">
                        <Image
                          src={process.icon}
                          alt={process.title}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover"
                        />
                      </div>
                        <div className="flex-1 pt-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                              STEP {process.step}
                            </span>
                          </div>
                          <h3 className="font-bold text-lg text-gray-900 mb-1">
                            {process.title}
                          </h3>
                          {"subtitle" in process && process.subtitle && (
                            <p className="text-sm text-gray-500 mb-1">
                              {process.subtitle}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {process.description}
                          </p>
                        </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA 영역 - 버튼 중심 */}
              <div className="flex flex-col items-center lg:items-start space-y-6 lg:sticky lg:top-24">
                {/* 메인 CTA 카드 */}
                <Card className="w-full max-w-sm text-center bg-gradient-to-br from-primary-50 to-white border-primary/20 shadow-lg">
                  <CardContent className="pt-8 pb-8">
                    <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-4 shadow-lg">
                      <Image
                        src="/icons/quote-icon.png"
                        alt="견적 요청"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      온라인 견적 신청
                    </h3>
                    <p className="text-gray-600 mb-6">
                      간단한 정보 입력으로
                      <br />
                      빠른 견적을 받아보세요
                    </p>
                    <Button
                      size="lg"
                      className="w-full font-semibold h-14 text-base shadow-lg shadow-primary/20"
                      asChild
                    >
                      <Link href={ROUTES.APPLY}>
                        견적 요청하기
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                {/* 전화 문의 카드 */}
                <Card className="w-full max-w-sm bg-white">
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                        <Phone className="h-6 w-6 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">전화 문의</p>
                        <a
                          href={`tel:${COMPANY_INFO.phone}`}
                          className="text-lg font-bold text-gray-900 hover:text-primary transition-colors"
                        >
                          {COMPANY_INFO.phone}
                        </a>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={`tel:${COMPANY_INFO.phone}`}>전화하기</a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* QR 코드 (데스크톱에서만 표시) */}
                <div className="hidden lg:block w-full max-w-sm">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="w-32 h-32 bg-white rounded-lg shadow-sm flex items-center justify-center mx-auto mb-3 border">
                      <QrCode className="h-20 w-20 text-primary/30" />
                    </div>
                    <p className="text-sm text-gray-500">
                      QR 코드로 모바일에서 바로 접속
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          파트너 안내 섹션 - FOR PARTNER 강조
          ======================================== */}
      <section
        id={SECTIONS.PARTNER}
        className="relative py-20 lg:py-28 bg-secondary-50/30"
      >
        <div className="section-divider" />

        {/* FOR PARTNER 라벨 */}
        <div className="absolute top-6 right-6 lg:top-8 lg:right-8">
          <span className="text-xs font-bold text-secondary/60 tracking-wider uppercase">
            For Partner
          </span>
        </div>

        <div className="container mx-auto px-4">
          <div className="section-header">
            <p className="section-label-secondary">Partnership</p>
            <h2 className="section-title">파트너와 함께 성장합니다</h2>
            <p className="section-subtitle">
              전방 홈케어의 협력사로 등록하고 안정적인 일감을 확보하세요
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto mb-14">
            {PARTNER_BENEFITS.map((benefit) => (
              <div
                key={benefit.title}
                className="text-center p-5 md:p-6 rounded-2xl bg-white hover:shadow-lg transition-all duration-300 border border-transparent hover:border-secondary/20"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden mx-auto mb-4">
                  <Image
                    src={benefit.icon}
                    alt={benefit.title}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-bold text-sm md:text-base text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-xs md:text-sm text-gray-500 leading-relaxed hidden md:block">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button
              size="xl"
              variant="outline"
              className="w-full sm:w-auto border-secondary bg-secondary text-white hover:bg-secondary/80 font-semibold h-14 sm:h-12 px-8 shadow-lg shadow-secondary/20"
              asChild
            >
              <Link href={ROUTES.PARTNER}>
                협력사 신청하기
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
