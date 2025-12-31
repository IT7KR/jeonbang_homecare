// 서비스 그룹 타입 및 상수
export type ServiceGroupId = "outdoor" | "indoor" | "regular" | "others";

export interface ServiceGroup {
  id: ServiceGroupId;
  name: string;
  icon: string;
  categoryIds: string[];
}

/**
 * 서비스 그룹 (4개 대그룹)
 * - 외부 관리: 건축, 외부 관리, 조경 공사, 외부 시설, 창호
 * - 실내 개선: 실내 가구, 화장실, 마감 공사, 설비, 전기, 청소
 * - 정기 관리: 정기 관리 (BASIC/STANDARD/PREMIUM)
 * - 기타: 특수 서비스, 기타 작업
 */
export const SERVICE_GROUPS: ServiceGroup[] = [
  {
    id: "outdoor",
    name: "외부 관리",
    icon: "Trees",
    categoryIds: [
      "construction",
      "exterior",
      "landscaping",
      "outdoor_facility",
      "window_door",
    ],
  },
  {
    id: "indoor",
    name: "실내 개선",
    icon: "Sofa",
    categoryIds: [
      "indoor_furniture",
      "bathroom",
      "finishing",
      "plumbing",
      "electrical",
      "cleaning",
    ],
  },
  {
    id: "regular",
    name: "정기 관리",
    icon: "Calendar",
    categoryIds: ["package_management"],
  },
  {
    id: "others",
    name: "기타",
    icon: "MoreHorizontal",
    categoryIds: ["specialized_services", "others"],
  },
];

// 서비스 카테고리 상수 (16개 대분류, 50개 소분류)
export const SERVICE_CATEGORIES = [
  {
    id: "construction",
    name: "건축",
    subtitle: "전원주택 신축, 전문가와 함께하세요",
    icon: "/icons/services/architecture-icon.png",
    services: ["주택 건축"],
  },
  {
    id: "exterior",
    name: "외부 관리",
    subtitle: "풀·벌레·눈 치우느라 주말을 다 쓰시나요?",
    icon: "/icons/services/external-management-icon.png",
    services: [
      "제초 작업",
      "제설 작업",
      "거미줄 제거",
      "벌집 제거",
      "해충 방제",
      "마당 청소",
    ],
  },
  {
    id: "landscaping",
    name: "조경 공사",
    subtitle: "전문 조경으로 집의 인상을 한 번에 바꿉니다",
    icon: "/icons/services/landscaping-work-icon.png",
    services: [
      "조경 공사",
      "수목 전지",
      "잔디, 제초",
      "정원 공사",
      "마당 공사",
      "정기 관리",
    ],
  },
  {
    id: "outdoor_facility",
    name: "외부 시설",
    subtitle: "데크·펜스로 야외 공간을 완성하세요",
    icon: "/icons/services/external-facilities-icon.png",
    services: ["데크 공사", "펜스, 담장", "어닝/렉산/파고라"],
  },
  {
    id: "indoor_furniture",
    name: "실내 가구",
    subtitle: "맞춤 가구로 공간 활용을 극대화",
    icon: "/icons/services/indoor-furniture-icon.png",
    services: ["씽크대", "붙박이장", "신발장"],
  },
  {
    id: "bathroom",
    name: "화장실",
    subtitle: "깔끔한 화장실로 집의 가치를 높이세요",
    icon: "/icons/services/washroom-icon.png",
    services: ["일부 수리", "전체 수리"],
  },
  {
    id: "finishing",
    name: "마감 공사",
    subtitle: "오래된 인테리어, 새롭게 리뉴얼",
    icon: "/icons/services/closing-construction-icon.png",
    services: [
      "페인트 실내",
      "페인트 실외",
      "도배",
      "타일",
      "장판",
      "마루 바닥",
      "커튼/블라인드",
      "전체 인테리어",
    ],
  },
  {
    id: "plumbing",
    name: "설비",
    subtitle: "배관·누수 문제, 신속하게 해결",
    icon: "/icons/services/facilities-icon.png",
    services: ["배관/누수"],
  },
  {
    id: "electrical",
    name: "전기",
    subtitle: "안전한 전기 공사, 전문가에게 맡기세요",
    icon: "/icons/services/electricity-icon.png",
    services: ["배선/조명"],
  },
  {
    id: "window_door",
    name: "창호",
    subtitle: "단열과 방음, 창호 교체로 해결",
    icon: "/icons/services/windows-icon.png",
    services: ["샷시", "방충망"],
  },
  {
    id: "cleaning",
    name: "청소",
    subtitle: "전문 청소로 깨끗한 주거 환경 유지",
    icon: "/icons/services/cleaning-icon.png",
    services: [
      "실내 청소",
      "실외 청소",
      "외벽 청소",
      "세탁기 청소",
      "에어컨 청소/충전",
    ],
  },
  {
    id: "package_management",
    name: "패키지 관리",
    subtitle: "패키지를 통해 다양한 서비스를 받아보세요",
    icon: "/icons/services/regular-management-icon.png",
    services: [],
  },
  {
    id: "specialized_services",
    name: "특수 서비스",
    subtitle: "특별한 요구에 맞는 서비스",
    icon: "/icons/services/specialized-icon.png",
    services: [
      "장작 난로/땔감",
      "보안 CCTV",
      "통신/인터넷",
      "세탁",
      "이사 (가전/가구)",
      "이사 (전체)",
    ],
  },
  {
    id: "others",
    name: "기타 작업",
    subtitle: "그 외 필요한 작업을 알려주세요",
    icon: "/icons/services/other-operations-icon.png",
    services: ["기타 작업"],
  },
] as const;

export type ServiceCategoryId = (typeof SERVICE_CATEGORIES)[number]["id"];

// 전방의 핵심 역할
export const CORE_ROLES = [
  {
    step: "01",
    title: "고객 관리",
    description: "주택 상태 점검 및\n고객 요구사항 파악",
  },
  {
    step: "02",
    title: "협력사 연결",
    description: "전문 시공업체 매칭\n및 소통 관리",
  },
  {
    step: "03",
    title: "시공 관리",
    description: "작업 일정 조율 및 시공,\n서비스 품질 관리 모니터링",
  },
  {
    step: "04",
    title: "결제 관리",
    description: "적정한 시공비 산출\n및 대금 정산",
  },
  {
    step: "05",
    title: "사후 관리",
    description: "A/S 및\n지속적인 관리 서비스",
  },
] as const;

// 견적 요청 프로세스
export const REQUEST_PROCESS = [
  {
    step: "01",
    title: "QR 코드 스캔",
    subtitle: '검색 "전방 홈케어"',
    description: "간편한 접속",
    icon: "/icons/qr-icon.png",
  },
  {
    step: "02",
    title: "작업 항목 선택",
    description: "필요한 서비스 선택",
    icon: "/icons/work-item-icon.png",
  },
  {
    step: "03",
    title: "현장 정보 입력",
    description: "주소 및 사진 첨부",
    icon: "/icons/field-info-input-icon.png",
  },
  {
    step: "04",
    title: "견적 회신",
    description: "신속한 견적 제공, 필요시 방문 견적",
    icon: "/icons/quote-icon.png",
  },
] as const;
