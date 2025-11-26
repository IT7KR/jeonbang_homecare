"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
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
import { cn } from "@/lib/utils";
import Image from "next/image";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "bg-background/95 backdrop-blur shadow-sm supports-[backdrop-filter]:bg-background/60"
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-[70px] md:h-[100px] lg:h-[120px] items-center justify-between">
          {/* 로고 */}
          <Link href={ROUTES.HOME} className="flex items-center space-x-2">
            {/* 반응형: 모바일 60x60, 태블릿 80x80, PC 100x100 */}
            <Image
              src="/logo.png"
              alt="logo"
              width={100}
              height={100}
              unoptimized
              className="w-[60px] h-[60px] md:w-[80px] md:h-[80px] lg:w-[100px] lg:h-[100px]"
            />
          </Link>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden lg:flex items-center space-x-8">
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
                className="text-base font-medium text-gray-600 transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* 데스크톱 CTA */}
          <div className="hidden lg:flex items-center space-x-4">
            <Button asChild className="h-12 px-8 text-base font-semibold">
              <Link href={ROUTES.APPLY}>견적 요청하기</Link>
            </Button>
          </div>

          {/* 모바일 메뉴 버튼 */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" aria-label="메뉴 열기">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <span className="text-primary">전방</span> 홈케어
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
                    className="text-lg font-medium text-gray-700 transition-colors hover:text-primary hover:bg-gray-50 px-4 py-3 rounded-lg"
                  >
                    {item.label}
                  </Link>
                ))}

                <div className="border-t border-gray-200 my-4" />

                <a
                  href={`tel:${COMPANY_INFO.phone}`}
                  className="flex items-center space-x-3 text-lg font-medium text-gray-700 hover:text-primary px-4 py-3 rounded-lg hover:bg-gray-50"
                >
                  <Phone className="h-5 w-5" />
                  <span>{COMPANY_INFO.phone}</span>
                </a>

                <div className="pt-4">
                  <Button
                    asChild
                    className="w-full h-12 text-base font-semibold"
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
