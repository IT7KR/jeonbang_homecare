import type { Metadata } from "next";
import {
  HeroSection,
  IntroSection,
  ServiceStructureSection,
  ServicesSection,
  CoreRolesSection,
  QuoteRequestSection,
  PartnerSection,
} from "@/components/features/landing";

export const metadata: Metadata = {
  title: "전방 홈케어 - 전원주택 관리 전문 서비스",
  description:
    "전방 홈케어는 전원주택 관리 전문 서비스입니다. 제초, 조경, 청소, 시공까지 원스톱으로 제공합니다. 지금 무료 견적을 받아보세요.",
  openGraph: {
    title: "전방 홈케어 - 전원주택 관리 전문 서비스",
    description:
      "전원주택의 모든 관리를 원스톱으로. 제초, 조경, 청소, 시공까지 전문 협력사가 해결해 드립니다.",
    url: "https://geonbang.com/homecare",
  },
  alternates: {
    canonical: "https://geonbang.com/homecare",
  },
};

export default function HomePage() {
  return (
    <main id="main-content" className="flex flex-col">
      <HeroSection />
      <IntroSection />
      <ServiceStructureSection />
      <ServicesSection />
      <CoreRolesSection />
      <QuoteRequestSection />
      <PartnerSection />
    </main>
  );
}
