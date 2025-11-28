// 디자인 토큰 상수 - UI 일관성 유지를 위한 공통 값

export const DESIGN_TOKENS = {
  // 카드 스타일
  card: {
    radius: "rounded-2xl",
    shadow: "shadow-sm",
    shadowHover: "hover:shadow-lg",
    padding: "p-6",
    paddingLg: "p-8",
  },

  // 아이콘 컨테이너
  iconContainer: {
    // 기본 (48x48)
    base: "w-12 h-12 rounded-full flex items-center justify-center",
    // 중간 (56x56)
    md: "w-14 h-14 rounded-full flex items-center justify-center",
    // 큰 (64x64)
    lg: "w-16 h-16 rounded-full flex items-center justify-center",
    // 더 큰 (80x80)
    xl: "w-20 h-20 rounded-full flex items-center justify-center",
  },

  // 아이콘 크기
  iconSize: {
    sm: "h-5 w-5",
    base: "h-6 w-6",
    md: "h-7 w-7",
    lg: "h-8 w-8",
    xl: "h-10 w-10",
  },

  // 버튼 스타일
  button: {
    height: "h-12",
    heightMobile: "h-14",
    fontSize: "text-base",
    fontWeight: "font-semibold",
    radius: "rounded-lg",
  },

  // 섹션 간격
  section: {
    paddingY: "py-20 lg:py-28",
    containerPadding: "px-4",
    marginBottom: "mb-14",
  },

  // 타이포그래피
  typography: {
    // 섹션 라벨 (영문)
    sectionLabel: "text-xs font-semibold tracking-wider uppercase text-gray-400",
    // 섹션 타이틀
    sectionTitle: "text-[28px] md:text-[32px] lg:text-4xl font-bold text-gray-900",
    // 섹션 서브타이틀
    sectionSubtitle: "text-base md:text-lg text-gray-600 leading-relaxed",
    // 본문 텍스트
    body: "text-base text-gray-600 leading-relaxed",
    // 본문 작은 텍스트
    bodySmall: "text-sm text-gray-600 leading-relaxed",
  },

  // 색상 변형
  colors: {
    // Primary 계열
    primaryBg: "bg-primary-50",
    primaryBgSubtle: "bg-primary/5",
    primaryBorder: "border-primary/20",
    primaryText: "text-primary",
    // Secondary 계열 (파트너용)
    secondaryBg: "bg-secondary-50",
    secondaryBgSubtle: "bg-secondary/5",
    secondaryBorder: "border-secondary/20",
    secondaryText: "text-secondary",
    // 중립 계열
    neutralBg: "bg-gray-50",
    neutralBgWhite: "bg-white",
  },

  // 트랜지션
  transition: {
    base: "transition-all duration-300",
    fast: "transition-all duration-200",
    slow: "transition-all duration-500",
  },
} as const;

// 섹션 공통 스타일 헬퍼
export const getSectionStyles = (variant: "white" | "gray" | "primary" | "secondary" = "white") => {
  const bgMap = {
    white: "bg-white",
    gray: "bg-gray-50",
    primary: "bg-primary-50/50",
    secondary: "bg-secondary-50/30",
  };

  return `relative ${DESIGN_TOKENS.section.paddingY} ${bgMap[variant]}`;
};

// 섹션 헤더 스타일 헬퍼
export const getSectionHeaderStyles = () => ({
  container: "text-center mb-14",
  label: DESIGN_TOKENS.typography.sectionLabel,
  title: DESIGN_TOKENS.typography.sectionTitle,
  subtitle: `${DESIGN_TOKENS.typography.sectionSubtitle} max-w-2xl mx-auto`,
});
