import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { ROUTES, COMPANY_INFO } from "@/lib/constants";
import { Button } from "../ui/button";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        {/* 메인 컨텐츠 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* 회사 로고 및 기본 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">
              <span className="text-primary">전방</span> 홈케어
            </h3>
            <p className="text-sm text-muted-foreground">
              {COMPANY_INFO.slogan}
            </p>
            <a
              href={`tel:${COMPANY_INFO.phone}`}
              className="inline-flex items-center space-x-2 text-sm font-medium text-primary hover:text-primary/80"
              aria-label={`전화 문의: ${COMPANY_INFO.phone}`}
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              <span className="text-lg">{COMPANY_INFO.phone}</span>
            </a>
          </div>

          {/* 바로가기 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              바로가기
            </h3>
            <div className="flex flex-col w-1/2 min-w-48 gap-3 text-sm">
              <Button
                asChild
                size="sm"
                className="w-auto text-base font-semibold h-10 px-4 shadow-lg shadow-primary/20"
              >
                <Link href={ROUTES.APPLY}>
                  견적 요청하기
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                className="w-auto text-base border-secondary bg-secondary text-white hover:bg-secondary/80 font-semibold h-10 px-4"
                asChild
                size="sm"
              >
                <Link href={ROUTES.PARTNER}>
                  협력사 신청하기
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>

          {/* 법적 링크 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              법적 고지
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href={ROUTES.TERMS}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  이용약관
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.PRIVACY}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  개인정보처리방침
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 하단 회사 정보 */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* 회사 상세 정보 */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <span className="font-medium">상호:</span>{" "}
                {COMPANY_INFO.companyName}
                {COMPANY_INFO.representative && (
                  <>
                    {" | "}
                    <span className="font-medium">대표:</span>{" "}
                    {COMPANY_INFO.representative}
                  </>
                )}
                {COMPANY_INFO.businessNumber && (
                  <>
                    {" | "}
                    <span className="font-medium">사업자번호:</span>{" "}
                    {COMPANY_INFO.businessNumber}
                  </>
                )}
              </p>
              <p>
                <span className="font-medium">주소:</span>{" "}
                {COMPANY_INFO.address}
                {" | "}
                <span className="font-medium">연락처:</span>{" "}
                {COMPANY_INFO.phone}
              </p>
            </div>

            {/* 저작권 */}
            <p className="text-xs text-muted-foreground">
              &copy; {currentYear} {COMPANY_INFO.companyName}. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
