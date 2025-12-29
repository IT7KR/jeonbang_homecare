import Image from "next/image";
import {
  ArrowRight,
  ArrowLeft,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SECTIONS, SERVICE_STRUCTURE } from "@/lib/constants";

export function ServiceStructureSection() {
  return (
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
                  <div
                    className="flex flex-col items-center my-4 md:my-0 md:mx-6"
                    aria-hidden="true"
                  >
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
  );
}
