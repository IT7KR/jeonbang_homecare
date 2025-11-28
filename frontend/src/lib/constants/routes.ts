// 라우트 상수
export const ROUTES = {
  // 고객용 (Front Office)
  HOME: "/",
  APPLY: "/apply",
  PARTNER: "/partner",
  SERVICES: "/services",
  ABOUT: "/about",
  FAQ: "/faq",

  // 관리자용 (Back Office)
  ADMIN: {
    LOGIN: "/admin/login",
    DASHBOARD: "/admin/dashboard",
    APPLICATIONS: "/admin/applications",
    APPLICATION_DETAIL: (id: string | number) => `/admin/applications/${id}`,
    PARTNERS: "/admin/partners",
    PARTNER_DETAIL: (id: string | number) => `/admin/partners/${id}`,
    SCHEDULE: "/admin/schedule",
    SETTINGS: "/admin/settings",
  },
} as const;

// 섹션 앵커 (스크롤 네비게이션용)
export const SECTIONS = {
  INTRO: "intro",
  SERVICE_STRUCTURE: "service-structure",
  SERVICES: "services",
  ROLES: "roles",
  QUOTE: "quote",
  PARTNER: "partner-section",
} as const;

// 네비게이션 메뉴 아이템
export const NAV_ITEMS = [
  { label: "회사 소개", href: "/#intro", isAnchor: true },
  { label: "서비스 소개", href: "/#services", isAnchor: true },
  { label: "자주 묻는 질문", href: "/faq", isAnchor: false },
  { label: "견적 요청하기", href: "/apply", isAnchor: false },
  { label: "협력사 신청하기", href: "/partner", isAnchor: false },
] as const;
