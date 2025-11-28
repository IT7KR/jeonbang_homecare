/**
 * 서비스 코드 → 한글 명칭 매핑
 */
export const SERVICE_CODE_TO_NAME: Record<string, string> = {
  // 건축
  HOUSE_CONSTRUCTION: "주택 건축",
  // 외부 관리
  WEEDING: "제초 작업",
  SNOW_REMOVAL: "제설 작업",
  SPIDER_WEB: "거미줄 제거",
  WASP_NEST: "벌집 제거",
  PEST_CONTROL: "해충 방제",
  YARD_CLEANING: "마당 청소",
  // 조경 공사
  LANDSCAPING_MGMT: "조경 공사/관리",
  LANDSCAPING: "조경",
  TREE_PRUNING: "수목 전지",
  GARDEN_WORK: "정원 공사",
  YARD_WORK: "마당 공사",
  // 외부 시설
  DECK_WORK: "데크 공사",
  FENCE_WALL: "펜스/담장",
  AWNING_PERGOLA: "어닝/파고라",
  AWNING: "어닝",
  // 실내 가구
  SINK: "씽크대",
  BUILT_IN_CLOSET: "붙박이장",
  SHOE_CABINET: "신발장",
  // 화장실
  BATHROOM_PARTIAL: "욕실 일부 수리",
  BATHROOM_FULL: "욕실 전체 수리",
  BATHROOM: "욕실",
  // 마감 공사
  PAINT_INTERIOR: "페인트 내부",
  PAINT_EXTERIOR: "페인트 외부",
  WALLPAPER: "도배",
  TILE: "타일",
  FLOOR_SHEET: "장판",
  WOOD_FLOOR: "마루 바닥",
  CURTAIN_BLIND: "커튼/블라인드",
  FULL_INTERIOR: "전체 인테리어",
  // 설비
  PLUMBING_LEAK: "배관/누수",
  // 전기
  WIRING_LIGHTING: "배선/조명",
  ELECTRICAL: "전기",
  // 창호
  SASH: "샷시",
  SCREEN_DOOR: "방충망",
  // 기타
  OTHERS: "기타 작업",
  // 특화 서비스
  CLEANING_INTERIOR: "내부 청소",
  CLEANING_EXTERIOR: "외부 청소",
  FIREPLACE: "장작 난로/벽난로",
  CCTV: "CCTV 설치",
  CCTV_SECURITY: "CCTV/보안",
  // 관리 서비스
  EMPTY_HOUSE: "빈집 관리",
  REGULAR_CARE: "정기 관리",
  COMPLEX_CARE: "단지 관리",
};

/**
 * 서비스 코드를 한글 명칭으로 변환
 * @param code 서비스 코드
 * @returns 한글 명칭 (매핑이 없으면 원본 코드 반환)
 */
export function getServiceName(code: string): string {
  return SERVICE_CODE_TO_NAME[code] || code;
}

/**
 * 서비스 코드 배열을 한글 명칭 배열로 변환
 * @param codes 서비스 코드 배열
 * @returns 한글 명칭 배열
 */
export function getServiceNames(codes: string[]): string[] {
  return codes.map(getServiceName);
}
