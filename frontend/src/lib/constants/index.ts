export * from "./services";
export * from "./regions";
export * from "./routes";
export * from "./design-tokens";
export * from "./status";
export * from "./application";

// 회사 정보
export const COMPANY_INFO = {
  name: "전방 홈케어",
  fullName: "전방 홈케어 서비스",
  slogan: "전원주택 관리의 새로운 기준",
  description: "전방은 고객과 협력사를 연결하는 신뢰할 수 있는 파트너입니다",
  phone: "031-797-4004",
  email: "info@geonbang.com",
  website: "geonbang.com/homecare",
  address: "경기도 하남시 검단산로 239, B1층 23호(창우동, 하남시 벤처집적시설)",
  businessHours: "평일 09:00 - 18:00",
  // 추가 법인 정보 (Footer용)
  companyName: "전방",
  representative: "", // 추후 입력
  businessNumber: "", // 추후 입력
} as const;

// 전방 소개 (3개 사업 영역)
export const COMPANY_INTRO = {
  title: "전방 소개",
  description: "전방은 전원생활의 모든 것을 함께 하는 토탈 솔루션 기업입니다",
  items: [
    {
      id: "realestate",
      title: "부동산 분양·중개",
      description: "전원주택, 토지 분양과\n컨설팅, 중개 서비스를 제공합니다",
      icon: "/icons/estate-sales-icon.png",
      link: "https://www.geonbang.com/",
      isExternal: true,
    },
    {
      id: "community",
      title: "전원 커뮤니티",
      description: "전원 생활인들의 소통을 통한\n네트워크를 구축합니다",
      icon: "/icons/rural-community-icon.png",
      link: "https://www.geonbang.com/community_list.html",
      isExternal: true,
    },
    {
      id: "homecare",
      title: "전방 홈케어",
      description: "전원주택 관리 전문 서비스를\n운영합니다.",
      icon: "/icons/services/management-services-icon.png",
      link: "/",
      isExternal: false,
    },
  ],
} as const;

// 서비스 구조
export const SERVICE_STRUCTURE = [
  {
    role: "고객",
    description: "전원주택 소유자, 거주자",
    icon: "/icons/customer-icon.png",
  },
  {
    role: "전방",
    description: "주택 관리 매니저",
    icon: "/logo.png",
  },
  {
    role: "협력사",
    description: "시공 전문업체",
    icon: "/icons/partner-icon.png",
  },
] as const;

// 파트너 혜택
export const PARTNER_BENEFITS = [
  {
    icon: "/icons/job-connection-icon.png",
    title: "안정적인 일감 연결",
    description: "지속적인 프로젝트 연결로\n안정적인 수익 확보",
  },
  {
    icon: "/icons/transparent-billing-icon.png",
    title: "합리적인 정산 시스템",
    description: "명확한 기준의\n합리적인 대금 정산",
  },
  {
    icon: "/icons/business-expansion-icon.png",
    title: "사업 영역 확장 기회",
    description: "다양한 프로젝트를 통한\n사업 확대",
  },
  {
    icon: "/icons/professional-network-icon.png",
    title: "전문 네트워크 구축",
    description: "업계 전문가들과의\n네트워킹 기회",
  },
] as const;
