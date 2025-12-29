import { CheckCircle2 } from "lucide-react";
import { SECTIONS, CORE_ROLES } from "@/lib/constants";

export function CoreRolesSection() {
  return (
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

            <ol className="grid grid-cols-5 gap-8 list-none">
              {CORE_ROLES.map((role) => (
                <li key={role.step} className="text-center">
                  {/* 번호 원 */}
                  <div
                    className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary text-white font-bold text-3xl shadow-xl mb-6 z-10"
                    aria-hidden="true"
                  >
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
                </li>
              ))}
            </ol>
          </div>

          {/* 모바일/태블릿: 세로 타임라인 */}
          <div className="lg:hidden relative">
            {/* 세로 연결선 */}
            <div
              className="absolute left-10 top-10 bottom-10 w-0.5 bg-primary/30"
              aria-hidden="true"
            />

            <ol className="space-y-12 list-none">
              {CORE_ROLES.map((role) => (
                <li key={role.step} className="flex items-start gap-8">
                  {/* 번호 원 */}
                  <div
                    className="w-20 h-20 rounded-full bg-primary text-white font-bold text-3xl flex items-center justify-center shadow-xl flex-shrink-0 z-10"
                    aria-hidden="true"
                  >
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
                </li>
              ))}
            </ol>
          </div>

          {/* 강조 메시지 */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-4 bg-white rounded-full px-10 py-5 shadow-lg border border-primary/20">
              <CheckCircle2
                className="h-8 w-8 text-primary"
                aria-hidden="true"
              />
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
  );
}
