import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 포맷터 유틸리티는 lib/utils/formatters.ts에서 관리
export {
  formatPhoneInput,
  formatDate,
  formatPhone,
  formatRelativeTime,
  formatCurrency,
  formatNumber,
  truncateText,
  formatBusinessNumber,
} from "./utils/formatters"
