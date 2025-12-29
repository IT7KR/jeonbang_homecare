import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SECTIONS, ROUTES, COMPANY_INFO, REQUEST_PROCESS } from "@/lib/constants";

export function QuoteRequestSection() {
  return (
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
              <div
                className="absolute left-10 top-10 bottom-10 w-0.5 bg-primary/20"
                aria-hidden="true"
              />

              <ol className="space-y-6 list-none">
                {REQUEST_PROCESS.map((process) => (
                  <li
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
                        <span
                          className="text-lg md:text-xl font-bold text-primary bg-primary/10 px-4 py-1.5 rounded"
                          aria-hidden="true"
                        >
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
                  </li>
                ))}
              </ol>
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
                      <ArrowRight
                        className="ml-2 h-7 w-7"
                        aria-hidden="true"
                      />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* 전화 문의 카드 */}
              <Card className="w-full max-w-lg bg-white shadow-lg">
                <CardContent className="py-10">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
                      <Phone
                        className="h-8 w-8 text-secondary"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-lg md:text-xl text-gray-500">
                        전화 문의
                      </p>
                      <a
                        href={`tel:${COMPANY_INFO.phone}`}
                        className="text-2xl md:text-3xl font-bold text-secondary hover:opacity-80 transition-opacity"
                        aria-label={`전화 문의: ${COMPANY_INFO.phone}`}
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
                    <Image
                      src="/domain-qr.png"
                      alt="전방 홈케어 모바일 접속 QR 코드"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
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
  );
}
