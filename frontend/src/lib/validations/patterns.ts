/**
 * Common Validation Patterns
 * 공통 검증 패턴 - Backend와 동기화 필요
 *
 * @see backend/app/core/validators.py
 */

// ===== 정규식 패턴 =====

/**
 * 전화번호 패턴 (한국 휴대폰)
 * 010-1234-5678, 01012345678, 010-123-4567 등 허용
 */
export const PHONE_PATTERN = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;

/**
 * 사업자등록번호 패턴
 * 123-45-67890 또는 1234567890
 */
export const BUSINESS_NUMBER_PATTERN = /^[0-9]{3}-?[0-9]{2}-?[0-9]{5}$/;

/**
 * 이메일 패턴 (기본)
 */
export const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// ===== 검증 함수 =====

/**
 * 전화번호 형식 검증
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return false;
  return PHONE_PATTERN.test(phone);
}

/**
 * 사업자등록번호 형식 검증
 */
export function validateBusinessNumber(businessNumber: string): boolean {
  if (!businessNumber) return false;
  return BUSINESS_NUMBER_PATTERN.test(businessNumber);
}

/**
 * 이메일 형식 검증
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  return EMAIL_PATTERN.test(email);
}

// ===== 포맷 함수 =====

/**
 * 전화번호를 표준 형식(010-1234-5678)으로 변환
 */
export function formatPhone(phone: string): string {
  if (!phone) return phone;

  // 숫자만 추출
  const digits = phone.replace(/[^0-9]/g, "");

  if (digits.length === 10) {
    // 010-123-4567
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11) {
    // 010-1234-5678
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  return phone;
}

/**
 * 사업자등록번호를 표준 형식(123-45-67890)으로 변환
 */
export function formatBusinessNumber(number: string): string {
  if (!number) return number;

  // 숫자만 추출
  const digits = number.replace(/[^0-9]/g, "");

  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  }

  return number;
}

// ===== 에러 메시지 =====

export const ERROR_MESSAGES = {
  phone: "올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)",
  businessNumber: "올바른 사업자등록번호 형식이 아닙니다 (예: 123-45-67890)",
  email: "올바른 이메일 형식이 아닙니다",
  required: "필수 입력 항목입니다",
  minLength: (min: number) => `최소 ${min}자 이상 입력해주세요`,
  maxLength: (max: number) => `최대 ${max}자까지 입력 가능합니다`,
  futureDate: "오늘 이후 날짜를 선택해주세요",
} as const;
