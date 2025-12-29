import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SECTIONS, ROUTES } from "@/lib/constants";
import { ServiceGrid } from "./ServiceGrid";

export function ServicesSection() {
  return (
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
              <ArrowRight className="ml-2 h-6 w-6" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
