/**
 * 포맷터 유틸리티 함수
 *
 * 날짜, 전화번호, 금액 등의 포맷팅을 중앙 관리합니다.
 */

// ===== 날짜 포맷팅 =====

export type DateFormatType = "date" | "datetime" | "time" | "relative";

export interface DateFormatOptions {
  type?: DateFormatType;
}

/**
 * 날짜 포맷팅
 * @param dateString ISO 날짜 문자열
 * @param options 포맷 옵션
 * @returns 포맷된 날짜 문자열
 *
 * @example
 * formatDate("2025-01-15T10:30:00") // "2025. 01. 15. 10:30"
 * formatDate("2025-01-15T10:30:00", { type: "date" }) // "2025. 01. 15."
 * formatDate("2025-01-15T10:30:00", { type: "time" }) // "10:30"
 */
export function formatDate(
  dateString: string | null | undefined,
  options: DateFormatOptions = {}
): string {
  if (!dateString) return "";

  const { type = "datetime" } = options;
  const date = new Date(dateString);

  if (isNaN(date.getTime())) return dateString;

  switch (type) {
    case "date":
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

    case "datetime":
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

    case "time":
      return date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      });

    case "relative":
      return formatRelativeTime(date);

    default:
      return dateString;
  }
}

/**
 * 상대적 시간 포맷팅 (예: "3분 전", "2시간 전")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return formatDate(date.toISOString(), { type: "date" });
}

// ===== 전화번호 포맷팅 =====

/**
 * 전화번호 포맷팅 (표시용)
 * @param phone 전화번호 문자열
 * @returns 010-1234-5678 형식
 *
 * @example
 * formatPhone("01012345678") // "010-1234-5678"
 * formatPhone("0212345678") // "02-1234-5678"
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";

  const cleaned = phone.replace(/\D/g, "");

  // 휴대폰 (11자리)
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }

  // 서울 지역번호 (02)
  if (cleaned.length === 9 && cleaned.startsWith("02")) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`;
  }

  if (cleaned.length === 10) {
    // 서울 지역번호 (02) - 10자리
    if (cleaned.startsWith("02")) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    // 기타 지역번호
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  return phone;
}

/**
 * 전화번호 입력 포맷팅 (입력 중 자동 포맷)
 * @param value 입력 값
 * @returns 포맷된 전화번호
 */
export function formatPhoneInput(value: string): string {
  // 숫자만 추출
  const numbers = value.replace(/\D/g, "");

  // 11자리 초과 방지
  const limited = numbers.slice(0, 11);

  // 포맷팅
  if (limited.length <= 3) {
    return limited;
  } else if (limited.length <= 7) {
    return `${limited.slice(0, 3)}-${limited.slice(3)}`;
  } else {
    return `${limited.slice(0, 3)}-${limited.slice(3, 7)}-${limited.slice(7)}`;
  }
}

// ===== 금액 포맷팅 =====

/**
 * 금액 포맷팅
 * @param amount 금액
 * @param options 포맷 옵션
 * @returns 포맷된 금액 문자열
 *
 * @example
 * formatCurrency(1000000) // "₩1,000,000"
 * formatCurrency(1000000, { symbol: false }) // "1,000,000"
 * formatCurrency(1000000, { unit: "만원" }) // "100만원"
 */
export function formatCurrency(
  amount: number | null | undefined,
  options: { symbol?: boolean; unit?: "원" | "만원" } = {}
): string {
  if (amount === null || amount === undefined) return "";

  const { symbol = true, unit = "원" } = options;

  if (unit === "만원") {
    const manWon = Math.floor(amount / 10000);
    return symbol ? `${manWon.toLocaleString("ko-KR")}만원` : `${manWon.toLocaleString("ko-KR")}`;
  }

  if (symbol) {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  }

  return amount.toLocaleString("ko-KR");
}

/**
 * 숫자 포맷팅 (천 단위 콤마)
 * @param value 숫자
 * @returns 포맷된 문자열
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return value.toLocaleString("ko-KR");
}

// ===== 텍스트 포맷팅 =====

/**
 * 텍스트 말줄임
 * @param text 원본 텍스트
 * @param maxLength 최대 길이
 * @returns 말줄임 처리된 텍스트
 */
export function truncateText(
  text: string | null | undefined,
  maxLength: number
): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * 사업자등록번호 포맷팅
 * @param value 사업자등록번호
 * @returns 123-45-67890 형식
 */
export function formatBusinessNumber(value: string | null | undefined): string {
  if (!value) return "";

  const cleaned = value.replace(/\D/g, "");

  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
  }

  return value;
}
