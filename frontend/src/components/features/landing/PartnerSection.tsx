import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SECTIONS, ROUTES, PARTNER_BENEFITS } from "@/lib/constants";

export function PartnerSection() {
  return (
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
              <ArrowRight className="ml-3 h-7 w-7" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
