import { SECTIONS, COMPANY_INTRO } from "@/lib/constants";
import { CompanyIntroCards } from "./CompanyIntroCards";

export function IntroSection() {
  return (
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
  );
}
