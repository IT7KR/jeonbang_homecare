"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NAV_ITEMS, ROUTES, COMPANY_INFO } from "@/lib/constants";
import Image from "next/image";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const handleNavClick = (href: string, isAnchor: boolean) => {
    setIsOpen(false);

    if (isAnchor && href.startsWith("/#")) {
      const sectionId = href.replace("/#", "");

      // 현재 메인 페이지에 있으면 스크롤, 아니면 메인 페이지로 이동
      if (pathname === "/") {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        router.push(href);
      }
    }
  };

  return (
    <header className="w-full bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-[60px] md:h-[70px] lg:h-[100px] items-center">
          {/* 로고 - 왼쪽 */}
          <Link href={ROUTES.HOME} className="flex items-center space-x-2">
            {/* 반응형: 모바일 50x50, 태블릿 60x60, PC 85x85 */}
            <Image
              src="/logo.png"
              alt="logo"
              width={85}
              height={85}
              unoptimized
              className="w-[50px] h-[50px] md:w-[60px] md:h-[60px] lg:w-[85px] lg:h-[85px]"
            />
          </Link>

          {/* 데스크톱 네비게이션 - 중앙 정렬 */}
          <nav className="hidden lg:flex flex-1 items-center justify-center space-x-12">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  if (item.isAnchor) {
                    e.preventDefault();
                    handleNavClick(item.href, item.isAnchor);
                  }
                }}
                className="text-xl xl:text-2xl font-bold text-gray-700 transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* 오른쪽 균형 맞추기 (로고와 동일한 너비) */}
          <div className="hidden lg:block w-[85px]" />

          {/* 모바일 메뉴 버튼 */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" aria-label="메뉴 열기">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] sm:w-[380px]">
              <SheetHeader>
                <SheetTitle className="text-left text-2xl">
                  <span className="text-primary font-bold">전방</span> 홈케어
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col mt-8 space-y-1">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => {
                      if (item.isAnchor) {
                        e.preventDefault();
                      }
                      handleNavClick(item.href, item.isAnchor);
                    }}
                    className="text-xl font-semibold text-gray-700 transition-colors hover:text-primary hover:bg-gray-50 px-4 py-4 rounded-lg"
                  >
                    {item.label}
                  </Link>
                ))}

                <div className="border-t border-gray-200 my-4" />

                <a
                  href={`tel:${COMPANY_INFO.phone}`}
                  className="flex items-center space-x-3 text-xl font-bold text-secondary hover:opacity-80 px-4 py-4 rounded-lg hover:bg-gray-50"
                >
                  <Phone className="h-6 w-6" />
                  <span>{COMPANY_INFO.phone}</span>
                </a>

                <div className="pt-4">
                  <Button
                    asChild
                    className="w-full h-14 text-lg font-bold"
                    size="lg"
                  >
                    <Link href={ROUTES.APPLY} onClick={() => setIsOpen(false)}>
                      견적 요청하기
                    </Link>
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
