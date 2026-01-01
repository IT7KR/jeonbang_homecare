// 협력사 관련 상수

import type { PartnerStatusChange } from "@/lib/api/admin";

// 파일 URL 기본 경로
export const FILE_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8020/api/v1"
).replace("/api/v1", "");

// 상태 설정
export const PARTNER_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  pending: {
    label: "대기중",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
  },
  approved: {
    label: "승인됨",
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  rejected: {
    label: "거절됨",
    color: "text-red-700",
    bgColor: "bg-red-100",
  },
  inactive: {
    label: "비활성",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
  },
};

// 상태 변경 옵션
export const PARTNER_STATUS_OPTIONS: {
  value: PartnerStatusChange["new_status"];
  label: string;
}[] = [
  { value: "pending", label: "대기중" },
  { value: "approved", label: "승인" },
  { value: "rejected", label: "거절" },
  { value: "inactive", label: "비활성" },
];

// 헬퍼 함수
export const getPartnerStatusInfo = (status: string) => {
  return PARTNER_STATUS_CONFIG[status] || PARTNER_STATUS_CONFIG.pending;
};

// SMS 발송이 필요한 상태 변경인지 확인
export const willSendSmsForPartnerStatusChange = (newStatus: string): boolean => {
  return newStatus === "approved" || newStatus === "rejected";
};

// 사유 입력이 필요한 상태 변경인지 확인
export const needsReasonForPartnerStatusChange = (newStatus: string): boolean => {
  return newStatus === "rejected" || newStatus === "inactive";
};

// 파일 다운로드 함수
export const downloadFile = (fileUrl: string) => {
  const downloadUrl = `${fileUrl}?download=true`;
  window.location.href = downloadUrl;
};

// 날짜 포맷팅
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// 전화번호 포맷팅
export const formatPhone = (phone: string) => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

// 타입 정의
export type PartnerStatus = keyof typeof PARTNER_STATUS_CONFIG;
export type PartnerStatusOption = (typeof PARTNER_STATUS_OPTIONS)[number];
