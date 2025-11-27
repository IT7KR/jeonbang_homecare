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
  ClipboardList,
  Building2,
  Clock,
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
          Hero 섹션 (배경 이미지 + 콘텐츠 오버레이)
          ======================================== */}
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
                  <ClipboardList className="w-14 h-14 md:w-16 md:h-16 text-white/90 group-hover:scale-110 transition-transform flex-shrink-0" />
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
                  <Building2 className="w-14 h-14 md:w-16 md:h-16 text-white/90 group-hover:scale-110 transition-transform flex-shrink-0" />
                </Link>
              </div>

              {/* 전화번호 섹션 */}
              <div className="pt-6">
                <div className="inline-flex items-center gap-4 bg-white/95 backdrop-blur-sm rounded-2xl px-8 py-5 shadow-xl border border-gray-100">
                  <div className="text-left">
                    <div className="flex items-center gap-2 text-2xl text-gray-600 mb-1">
                      <Phone className="w-6 h-6 text-primary" />
                      <span className="font-semibold">문의</span>
                    </div>
                    <a
                      href={`tel:${COMPANY_INFO.phone}`}
                      className="text-2xl md:text-3xl lg:text-4xl font-black text-secondary hover:opacity-80 transition-opacity block"
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
                    <QrCode className="w-full h-full text-primary/80" />
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
          <div className="mt-16 max-w-5xl mx-auto">
            <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-10 md:p-14 text-center">
              <p className="text-2xl md:text-3xl text-primary font-bold mb-5">
                전방 전원주택 관리 서비스
              </p>
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-5">
                <span className="whitespace-nowrap">고객과 협력사,</span>{" "}
                <span className="text-primary whitespace-nowrap">전방</span>
                <span className="whitespace-nowrap">이 함께 합니다.</span>
              </h3>
              <p className="text-xl md:text-2xl lg:text-3xl text-gray-600">
                <span className="whitespace-nowrap">
                  커뮤니케이션과 서비스 품질 관리를
                </span>{" "}
                <span className="text-primary font-bold whitespace-nowrap">
                  전방
                </span>
                <span className="whitespace-nowrap">이 해드립니다.</span>
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
                        ? "w-80 md:w-96 bg-primary/5 border-2 border-primary shadow-xl scale-105"
                        : "w-64 md:w-72 bg-white hover:shadow-xl"
                    }`}
                  >
                    <CardHeader className="pb-6">
                      <div
                        className={`flex items-center justify-center mx-auto mb-5 ${
                          isCenter
                            ? "w-32 h-32 md:w-36 md:h-36"
                            : "w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-primary-50"
                        }`}
                      >
                        <Image
                          src={item.icon}
                          alt={item.role}
                          width={isCenter ? 144 : 112}
                          height={isCenter ? 144 : 112}
                          unoptimized={isCenter}
                          className={
                            isCenter
                              ? "w-full h-full object-contain"
                              : "w-full h-full object-cover"
                          }
                        />
                      </div>
                      <CardTitle
                        className={`font-extrabold ${
                          isCenter
                            ? "text-3xl md:text-4xl lg:text-5xl text-primary"
                            : "text-2xl md:text-3xl text-gray-900"
                        }`}
                      >
                        {item.role}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p
                        className={`text-lg md:text-xl lg:text-2xl leading-relaxed ${
                          isCenter ? "text-gray-700" : "text-gray-600"
                        }`}
                      >
                        {item.description}
                      </p>
                      {isCenter && (
                        <p className="mt-5 text-base md:text-lg font-bold text-primary bg-primary/10 rounded-full px-5 py-2.5 inline-block">
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
          <p className="text-center mt-12 text-2xl md:text-3xl lg:text-4xl text-gray-700 font-semibold">
            <span className="whitespace-nowrap">전방이</span>{" "}
            <span className="text-primary font-extrabold whitespace-nowrap">
              커뮤니케이션과 서비스 품질 관리
            </span>
            <span className="whitespace-nowrap">를 해드립니다.</span>
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

          {/* CTA 버튼 */}
          <div className="text-center mt-16">
            <Button
              size="lg"
              className="w-full sm:w-auto text-lg font-bold h-16 px-12 shadow-xl shadow-primary/30"
              asChild
            >
              <Link href={ROUTES.APPLY}>
                견적 요청하기
                <ArrowRight className="ml-2 h-6 w-6" />
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
              <div className="relative mb-10">
                <div className="absolute top-9 left-[10%] right-[10%] h-1.5 bg-gradient-to-r from-primary/30 via-primary to-primary/30 rounded-full" />
              </div>

              <div className="grid grid-cols-5 gap-8">
                {CORE_ROLES.map((role) => (
                  <div key={role.step} className="text-center">
                    {/* 번호 원 */}
                    <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary text-white font-bold text-3xl shadow-xl mb-6 z-10">
                      {role.step}
                    </div>
                    {/* 타이틀 */}
                    <h3 className="font-extrabold text-xl md:text-2xl lg:text-3xl text-gray-900 mb-4">
                      {role.title}
                    </h3>
                    {/* 설명 - 띄어쓰기 단위 줄바꿈 */}
                    <p className="text-lg md:text-xl text-gray-600 leading-relaxed px-2 whitespace-pre-line">
                      {role.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 모바일/태블릿: 세로 타임라인 */}
            <div className="lg:hidden relative">
              {/* 세로 연결선 */}
              <div className="absolute left-10 top-10 bottom-10 w-0.5 bg-primary/30" />

              <div className="space-y-12">
                {CORE_ROLES.map((role) => (
                  <div key={role.step} className="flex items-start gap-8">
                    {/* 번호 원 */}
                    <div className="w-20 h-20 rounded-full bg-primary text-white font-bold text-3xl flex items-center justify-center shadow-xl flex-shrink-0 z-10">
                      {role.step}
                    </div>
                    {/* 내용 */}
                    <div className="flex-1 pt-4">
                      <h3 className="font-extrabold text-2xl md:text-3xl text-gray-900 mb-3">
                        {role.title}
                      </h3>
                      <p className="text-lg md:text-xl text-gray-600 leading-relaxed whitespace-pre-line">
                        {role.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 강조 메시지 */}
            <div className="mt-16 text-center">
              <div className="inline-flex items-center gap-4 bg-white rounded-full px-10 py-5 shadow-lg border border-primary/20">
                <CheckCircle2 className="h-8 w-8 text-primary" />
                <span className="font-bold text-xl md:text-2xl lg:text-3xl text-gray-900">
                  전방이{" "}
                  <span className="text-primary font-extrabold">전 과정</span>을
                  함께 합니다
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
              {/* 프로세스 스텝 */}
              <div className="relative">
                {/* 세로 연결선 */}
                <div className="absolute left-10 top-10 bottom-10 w-0.5 bg-primary/20" />

                <div className="space-y-6">
                  {REQUEST_PROCESS.map((process) => (
                    <div
                      key={process.step}
                      className="relative flex items-start gap-8 bg-gray-50 rounded-2xl p-8 hover:bg-gray-100 transition-colors shadow-sm"
                    >
                      <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 shadow-lg z-10">
                        <Image
                          src={process.icon}
                          alt={process.title}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 pt-2">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-lg md:text-xl font-bold text-primary bg-primary/10 px-4 py-1.5 rounded">
                            STEP {process.step}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-2xl md:text-3xl text-gray-900 mb-3">
                          {process.title}
                        </h3>
                        {"subtitle" in process && process.subtitle && (
                          <p className="text-lg md:text-xl text-gray-500 mb-2">
                            {process.subtitle}
                          </p>
                        )}
                        <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                          {process.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA 영역 */}
              <div className="flex flex-col items-center lg:items-start space-y-10 lg:sticky lg:top-24">
                {/* 메인 CTA 카드 */}
                <Card className="w-full max-w-lg text-center bg-gradient-to-br from-primary-50 to-white border-primary/20 shadow-xl">
                  <CardContent className="pt-12 pb-12">
                    <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-6 shadow-lg">
                      <Image
                        src="/icons/quote-icon.png"
                        alt="견적 요청"
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
                      온라인 견적 신청
                    </h3>
                    <p className="text-xl md:text-2xl text-gray-600 mb-10">
                      간단한 정보 입력으로
                      <br />
                      빠른 견적을 받아보세요
                    </p>
                    <Button
                      size="lg"
                      className="w-full text-xl font-bold h-18 py-5 shadow-xl shadow-primary/30"
                      asChild
                    >
                      <Link href={ROUTES.APPLY}>
                        견적 요청하기
                        <ArrowRight className="ml-2 h-7 w-7" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                {/* 전화 문의 카드 */}
                <Card className="w-full max-w-lg bg-white shadow-lg">
                  <CardContent className="py-10">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
                        <Phone className="h-8 w-8 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-lg md:text-xl text-gray-500">
                          전화 문의
                        </p>
                        <a
                          href={`tel:${COMPANY_INFO.phone}`}
                          className="text-2xl md:text-3xl font-bold text-secondary hover:opacity-80 transition-opacity"
                        >
                          {COMPANY_INFO.phone}
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* QR 코드 (데스크톱에서만 표시) */}
                <div className="hidden lg:block w-full max-w-lg">
                  <div className="bg-gray-50 rounded-2xl p-8 text-center">
                    <div className="w-40 h-40 bg-white rounded-lg shadow-md flex items-center justify-center mx-auto mb-5 border">
                      <QrCode className="h-28 w-28 text-primary/30" />
                    </div>
                    <p className="text-lg md:text-xl text-gray-500">
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
          협력사 안내 섹션 - FOR PARTNER 강조
          ======================================== */}
      <section
        id={SECTIONS.PARTNER}
        className="relative py-20 lg:py-28 bg-secondary-50/30"
      >
        <div className="section-divider" />

        {/* FOR PARTNER 라벨 */}
        <div className="absolute top-8 right-8 lg:top-10 lg:right-10">
          <span className="text-sm font-bold text-secondary/60 tracking-wider uppercase">
            For Partner
          </span>
        </div>

        <div className="container mx-auto px-4">
          <div className="section-header">
            <p className="section-label-secondary">Partnership</p>
            <h2 className="section-title">협력사와 함께 성장합니다</h2>
            <p className="section-subtitle">
              전방 홈케어의 협력사로 등록하고 안정적인 일감을 확보하세요
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 max-w-6xl mx-auto mb-16">
            {PARTNER_BENEFITS.map((benefit) => (
              <div
                key={benefit.title}
                className="text-center p-4 md:p-6 rounded-2xl bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-secondary/20 shadow-sm"
              >
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden mx-auto mb-6">
                  <Image
                    src={benefit.icon}
                    alt={benefit.title}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-extrabold text-lg md:text-xl lg:text-2xl text-gray-900 mb-4">
                  {benefit.title}
                </h3>
                <p className="text-base md:text-lg text-gray-500 leading-relaxed hidden md:block whitespace-pre-line">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button
              size="xl"
              variant="outline"
              className="w-full sm:w-auto border-secondary bg-secondary text-white hover:bg-secondary/80 text-xl font-bold h-18 py-5 px-14 shadow-xl shadow-secondary/30"
              asChild
            >
              <Link href={ROUTES.PARTNER}>
                협력사 신청하기
                <ArrowRight className="ml-3 h-7 w-7" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
