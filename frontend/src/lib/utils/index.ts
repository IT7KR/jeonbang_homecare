/**
 * 유틸리티 함수 통합 export
 */

// 포맷터 함수들
export {
  formatDate,
  formatRelativeTime,
  formatPhone,
  formatPhoneInput,
  formatCurrency,
  formatNumber,
  truncateText,
  formatBusinessNumber,
  type DateFormatType,
  type DateFormatOptions,
} from "./formatters";

// 이미지 유틸리티
export { compressImage, compressImages, formatFileSize } from "./image";

// 서비스 유틸리티 (deprecated - API가 직접 한글 이름 반환)
// export { getServiceName, getServiceNames } from "./service";
