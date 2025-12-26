import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  Users,
  Home,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  Target,
  Shield,
  Handshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { COMPANY_INFO, COMPANY_INTRO, CORE_ROLES } from "@/lib/constants";

// 아이콘 매핑
const iconMap: Record<string, React.ElementType> = {
  Building2,
  Users,
  Home,
};

export const metadata: Metadata = {
  title: "회사 소개 | 전방 홈케어",
  description:
    "전방은 전원생활의 모든 것을 함께 하는 토탈 솔루션 기업입니다. 전원주택 관리, 부동산 중개, 커뮤니티 서비스를 제공합니다.",
  openGraph: {
    title: "회사 소개 | 전방 홈케어",
    description:
      "전방은 전원생활의 모든 것을 함께 하는 토탈 솔루션 기업입니다.",
    url: "https://geonbang.com/homecare/about",
  },
  alternates: {
    canonical: "https://geonbang.com/homecare/about",
  },
};

export default function AboutPage() {
  return (
    <main id="main-content" className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-secondary-50/30 py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900">
              <span className="text-primary">전방</span> 소개
            </h1>
            <p className="text-xl md:text-2xl text-gray-600">
              {COMPANY_INTRO.description}
            </p>
          </div>
        </div>
      </section>

      {/* Company Introduction */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-5">
              전방의 사업 영역
            </h2>
            <p className="text-xl md:text-2xl text-gray-600">
              전원생활을 위한 종합 서비스를 제공합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {COMPANY_INTRO.items.map((item) => {
              const IconComponent = iconMap[item.icon] || Home;
              return (
                <Card
                  key={item.id}
                  className="text-center border-gray-200 hover:shadow-xl transition-shadow"
                >
                  <CardContent className="pt-10 pb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-primary-50 rounded-full mb-6">
                      <IconComponent className="w-10 h-10 md:w-12 md:h-12 text-primary" aria-hidden="true" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                      {item.title}
                    </h3>
                    <p className="text-lg md:text-xl text-gray-600">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Vision & Values */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-5">
              비전과 가치
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-0 shadow-xl">
              <CardContent className="pt-10 pb-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-blue-100 rounded-full mb-6">
                  <Target className="w-10 h-10 md:w-12 md:h-12 text-blue-600" aria-hidden="true" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                  미션
                </h3>
                <p className="text-lg md:text-xl text-gray-600">
                  전원주택 소유자들이 편안하게 전원생활을 즐길 수 있도록
                  전문적인 관리 서비스를 제공합니다.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardContent className="pt-10 pb-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-green-100 rounded-full mb-6">
                  <Shield className="w-10 h-10 md:w-12 md:h-12 text-green-600" aria-hidden="true" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                  신뢰
                </h3>
                <p className="text-lg md:text-xl text-gray-600">
                  검증된 협력사 네트워크와 투명한 프로세스로 고객과 협력사
                  모두에게 신뢰를 드립니다.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardContent className="pt-10 pb-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-orange-100 rounded-full mb-6">
                  <Handshake className="w-10 h-10 md:w-12 md:h-12 text-orange-600" aria-hidden="true" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                  상생
                </h3>
                <p className="text-lg md:text-xl text-gray-600">
                  고객, 전방, 협력사 모두가 함께 성장하는 지속 가능한 생태계를
                  만들어갑니다.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Roles */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-5">
              전방의 역할
            </h2>
            <p className="text-xl md:text-2xl text-gray-600">
              고객과 협력사 사이에서 전문적인 관리 서비스를 제공합니다.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <ol className="space-y-6 list-none">
              {CORE_ROLES.map((role) => (
                <li
                  key={role.step}
                  className="flex items-start gap-6 md:gap-8 p-6 md:p-8 bg-white rounded-2xl shadow-sm border border-gray-100"
                >
                  <div className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xl md:text-2xl" aria-hidden="true">
                    {role.step}
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                      {role.title}
                    </h3>
                    <p className="text-lg md:text-xl text-gray-600">
                      {role.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-5">
              연락처
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8 md:p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex items-start gap-5">
                    <div className="p-4 bg-primary-50 rounded-xl">
                      <Phone className="w-6 h-6 md:w-7 md:h-7 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">
                        전화
                      </h3>
                      <p className="text-lg md:text-xl text-gray-600">
                        {COMPANY_INFO.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-5">
                    <div className="p-4 bg-primary-50 rounded-xl">
                      <Mail className="w-6 h-6 md:w-7 md:h-7 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">
                        이메일
                      </h3>
                      <p className="text-lg md:text-xl text-gray-600">
                        {COMPANY_INFO.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-5">
                    <div className="p-4 bg-primary-50 rounded-xl">
                      <Clock className="w-6 h-6 md:w-7 md:h-7 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">
                        운영시간
                      </h3>
                      <p className="text-lg md:text-xl text-gray-600">
                        {COMPANY_INFO.businessHours}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-5">
                    <div className="p-4 bg-primary-50 rounded-xl">
                      <MapPin className="w-6 h-6 md:w-7 md:h-7 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">
                        주소
                      </h3>
                      <p className="text-lg md:text-xl text-gray-600">
                        {COMPANY_INFO.address}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6">
            전방 홈케어와 함께하세요
          </h2>
          <p className="text-xl md:text-2xl text-primary-100 mb-10 max-w-3xl mx-auto">
            전원주택 관리가 필요하시다면 지금 바로 서비스를 신청하세요.
            <br className="hidden md:block" />
            전문 협력사가 되고 싶으시다면 협력사 등록을 진행해주세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="text-primary text-lg md:text-xl h-14 px-10"
            >
              <Link href="/apply">서비스 신청</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 text-lg md:text-xl h-14 px-10"
            >
              <Link href="/partner">협력사 등록</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
