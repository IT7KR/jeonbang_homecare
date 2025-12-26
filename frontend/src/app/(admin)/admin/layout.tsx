"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Users,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  MessageSquare,
  Home,
  QrCode,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";

const navigation = [
  { name: "대시보드", href: "/admin", icon: LayoutDashboard },
  { name: "신청 관리", href: "/admin/applications", icon: FileText },
  { name: "협력사 관리", href: "/admin/partners", icon: Users },
  { name: "SMS 관리", href: "/admin/sms", icon: MessageSquare },
  { name: "일정 관리", href: "/admin/schedule", icon: Calendar },
  { name: "QR코드 생성", href: "/admin/qr-code", icon: QrCode },
  { name: "설정", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken, admin, checkAuth, logout, _hasHydrated } =
    useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // 로그인 페이지는 인증 체크 제외
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    // Hydration이 완료될 때까지 대기
    if (!_hasHydrated) {
      return;
    }

    if (isLoginPage) {
      setIsChecking(false);
      return;
    }

    const verifyAuth = async () => {
      if (!accessToken) {
        router.replace("/admin/login");
        return;
      }

      const isValid = await checkAuth();
      if (!isValid) {
        router.replace("/admin/login");
        return;
      }

      setIsChecking(false);
    };

    verifyAuth();
  }, [_hasHydrated, accessToken, checkAuth, router, isLoginPage]);

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-primary border-t-transparent" />
          <p className="text-sm text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로그인 페이지는 레이아웃 없이 렌더링
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-xl transform transition-transform duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-gray-100">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-600 rounded-xl flex items-center justify-center shadow-sm">
              <Home size={18} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-gray-900">전방홈케어</span>
              <span className="text-[10px] text-primary font-medium ml-1.5 bg-primary-50 px-1.5 py-0.5 rounded">
                관리자
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-3">
          <div className="mb-2 px-3">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              메뉴
            </span>
          </div>
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center px-3 py-2.5 mb-1 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/25"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-9 h-9 rounded-lg mr-3 transition-colors ${
                    isActive
                      ? "bg-white/20"
                      : "bg-gray-100 group-hover:bg-primary-50 group-hover:text-primary"
                  }`}
                >
                  <item.icon size={18} />
                </div>
                <span className="font-medium">{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-gray-50/50">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors"
          >
            <Home size={16} />
            <span>홈페이지로 이동</span>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu size={22} />
            </button>

            {/* Page title (desktop) */}
            <div className="hidden lg:flex items-center gap-3">
              <h1 className="text-lg font-semibold text-gray-900">
                {navigation.find(
                  (item) =>
                    item.href === pathname ||
                    (item.href !== "/admin" && pathname.startsWith(item.href))
                )?.name || "관리자"}
              </h1>
            </div>

            {/* Mobile title */}
            <div className="lg:hidden flex-1 text-center">
              <span className="font-semibold text-gray-900">
                {navigation.find(
                  (item) =>
                    item.href === pathname ||
                    (item.href !== "/admin" && pathname.startsWith(item.href))
                )?.name || "관리자"}
              </span>
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 py-1.5 px-2 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <span className="hidden sm:block text-gray-600">
                  {admin?.name}
                </span>
                <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-600 rounded-xl flex items-center justify-center text-white font-medium shadow-sm">
                  {admin?.name?.charAt(0) || "A"}
                </div>
                <ChevronDown
                  size={16}
                  className="text-gray-400 hidden sm:block"
                />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">
                        {admin?.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {admin?.email}
                      </p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <LogOut size={16} />
                        <span>로그아웃</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6 min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  );
}
